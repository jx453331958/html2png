import { chromium, Browser } from 'playwright'

let browser: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }
  return browser
}

export interface ConvertOptions {
  html: string
  width?: number
  height?: number
  dpr?: 1 | 2 | 3
  fullPage?: boolean
}

export async function convertHtmlToPng(options: ConvertOptions): Promise<Buffer> {
  const {
    html,
    width = 1200,
    height,
    dpr = 1,
    fullPage = false,
  } = options

  const browserInstance = await getBrowser()
  const context = await browserInstance.newContext({
    viewport: {
      width,
      height: height || 800,
    },
    deviceScaleFactor: dpr,
  })

  const page = await context.newPage()

  try {
    await page.setContent(html, { waitUntil: 'networkidle' })
    await page.waitForTimeout(100)

    let screenshotOptions: { type: 'png'; fullPage: boolean } = {
      type: 'png',
      fullPage,
    }

    if (!height && !fullPage) {
      const contentHeight = await page.evaluate(() => {
        return Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.clientHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        )
      })

      await page.setViewportSize({ width, height: contentHeight })
      screenshotOptions.fullPage = true
    }

    const screenshot = await page.screenshot(screenshotOptions)
    return Buffer.from(screenshot)
  } finally {
    await context.close()
  }
}

export async function closeBrowser() {
  if (browser) {
    await browser.close()
    browser = null
  }
}
