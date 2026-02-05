'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dictionary } from '@/lib/i18n'

const defaultHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      margin: 0;
    }
    h1 { font-size: 3.5rem; margin-bottom: 1rem; }
    p { font-size: 1.3rem; opacity: 0.9; }
  </style>
</head>
<body>
  <h1>Hello World!</h1>
  <p>This is a sample HTML content.</p>
</body>
</html>`

interface Conversion {
  id: number
  html_preview: string | null
  html_content: string | null
  width: number
  height: number | null
  dpr: number
  full_page: number
  file_size: number | null
  created_at: string
}

interface ConverterProps {
  dict: Dictionary
  isLoggedIn: boolean
}

export default function Converter({ dict, isLoggedIn }: ConverterProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [html, setHtml] = useState(defaultHtml)
  const [width, setWidth] = useState(1200)
  const [height, setHeight] = useState('')
  const [dpr, setDpr] = useState(1)
  const [fullPage, setFullPage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // History state
  const [conversions, setConversions] = useState<Conversion[]>([])
  const [conversionsTotal, setConversionsTotal] = useState(0)
  const [conversionsLoading, setConversionsLoading] = useState(false)
  const [conversionsOffset, setConversionsOffset] = useState(0)
  const conversionsLimit = 5

  useEffect(() => {
    if (isLoggedIn) {
      loadConversions()
    }
  }, [isLoggedIn])

  const loadConversions = async (offset = 0) => {
    setConversionsLoading(true)
    try {
      const response = await fetch(`/api/conversions?limit=${conversionsLimit}&offset=${offset}`)
      const data = await response.json()
      if (offset === 0) {
        setConversions(data.conversions || [])
      } else {
        setConversions(prev => [...prev, ...(data.conversions || [])])
      }
      setConversionsTotal(data.total || 0)
      setConversionsOffset(offset)
    } catch {
      console.error('Failed to load conversions')
    } finally {
      setConversionsLoading(false)
    }
  }

  const handleConvert = async () => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    setError('')
    setLoading(true)
    setPreviewUrl(null)

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html,
          width,
          height: height ? parseInt(height) : undefined,
          dpr,
          fullPage,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Conversion failed')
        return
      }

      const blob = await response.blob()
      setPreviewUrl(URL.createObjectURL(blob))

      // Reload history after successful conversion
      loadConversions(0)
    } catch {
      setError('Conversion failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (previewUrl) {
      const a = document.createElement('a')
      a.href = previewUrl
      a.download = 'screenshot.png'
      a.click()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      setError(dict.converter.invalidFileType)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setHtml(content)
      setError('')
    }
    reader.onerror = () => {
      setError(dict.converter.fileReadError)
    }
    reader.readAsText(file)

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const loadFromHistory = (conversion: Conversion) => {
    // Use full html_content for re-editing, fallback to html_preview
    const htmlToLoad = conversion.html_content || conversion.html_preview
    if (htmlToLoad) {
      setHtml(htmlToLoad)
      setWidth(conversion.width)
      setHeight(conversion.height?.toString() || '')
      setDpr(conversion.dpr)
      setFullPage(conversion.full_page === 1)
      setPreviewUrl(null)
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const deleteConversion = async (id: number) => {
    if (!confirm(dict.converter.confirmDeleteHistory)) return
    try {
      await fetch(`/api/conversions/${id}`, { method: 'DELETE' })
      setConversions(prev => prev.filter(c => c.id !== id))
      setConversionsTotal(prev => prev - 1)
    } catch {
      console.error('Failed to delete conversion')
    }
  }

  const formatDate = (dateStr: string) => {
    // SQLite stores UTC time without timezone indicator, append 'Z' to parse as UTC
    const utcDateStr = dateStr.endsWith('Z') ? dateStr : dateStr.replace(' ', 'T') + 'Z'
    const date = new Date(utcDateStr)
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Input Section */}
        <div className="glass-card p-4 md:p-7 slide-up stagger-1">
          <div className="section-header flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="section-icon">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <span className="section-title">{dict.converter.htmlInput}</span>
            </div>
            <button
              onClick={triggerFileUpload}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-cyber-cyan hover:text-white bg-cyber-cyan/10 hover:bg-cyber-cyan/20 border border-cyber-cyan/30 rounded transition-all"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {dict.converter.uploadFile}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            className="cyber-input cyber-textarea h-56 md:h-72"
            placeholder={dict.converter.placeholder}
          />

          <div className="grid grid-cols-2 gap-3 md:gap-4 mt-4 md:mt-5">
            <div>
              <label className="cyber-label">{dict.converter.width}</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value) || 1200)}
                className="cyber-input"
                min={100}
                max={4096}
              />
            </div>
            <div>
              <label className="cyber-label">{dict.converter.height}</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="cyber-input"
                placeholder={dict.converter.autoHeight}
                min={100}
                max={10000}
              />
            </div>
            <div>
              <label className="cyber-label">{dict.converter.dpr}</label>
              <select
                value={dpr}
                onChange={(e) => setDpr(parseInt(e.target.value))}
                className="cyber-input cyber-select"
              >
                <option value={1}>1x Standard</option>
                <option value={2}>2x Retina</option>
                <option value={3}>3x High DPI</option>
              </select>
            </div>
            <div className="flex items-center pt-7">
              <label className="flex items-center gap-3 cursor-pointer group relative">
                <input
                  type="checkbox"
                  checked={fullPage}
                  onChange={(e) => setFullPage(e.target.checked)}
                  className="w-5 h-5 rounded bg-black/40 border border-white/[0.08] checked:bg-cyber-cyan checked:border-cyber-cyan transition-all cursor-pointer"
                />
                <span className="text-sm text-zinc-400">{dict.converter.fullPage}</span>
                <span className="ml-1 text-zinc-500 hover:text-cyber-cyan cursor-help">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-black/90 border border-white/10 rounded-lg text-xs text-zinc-300 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  {dict.converter.fullPageTip}
                  <div className="absolute top-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/90" />
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={handleConvert}
            disabled={loading || !html.trim()}
            className="cyber-btn w-full mt-4 md:mt-6 flex items-center justify-center gap-3"
          >
            {loading ? (
              <span className="cyber-spinner" />
            ) : (
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
            {loading ? dict.converter.converting : dict.converter.convert}
          </button>

          {error && <div className="cyber-error mt-4">{error}</div>}
        </div>

        {/* Preview Section */}
        <div className="glass-card p-4 md:p-7 slide-up stagger-2">
          <div className="section-header">
            <div className="section-icon">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="section-title">{dict.converter.preview}</span>
          </div>

          <div className={`preview-box ${previewUrl ? 'has-image' : ''}`}>
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="max-w-full h-auto" />
            ) : (
              <div className="text-center text-zinc-500">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="font-orbitron text-xs tracking-wider uppercase">{dict.converter.noPreview}</p>
              </div>
            )}
          </div>

          {previewUrl && (
            <button
              onClick={handleDownload}
              className="cyber-btn cyber-btn-success w-full mt-4 md:mt-5 flex items-center justify-center gap-3"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {dict.converter.download}
            </button>
          )}
        </div>
      </div>

      {/* Conversion History */}
      {isLoggedIn && conversions.length > 0 && (
        <div className="glass-card slide-up stagger-3">
          <div className="p-4 md:p-5 border-b border-white/[0.08]">
            <div className="section-header !mb-0 !pb-0 !border-0 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="section-icon">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="section-title">{dict.converter.history}</span>
              </div>
              <span className="text-sm text-zinc-500">{conversionsTotal} {dict.converter.historyTotal}</span>
            </div>
          </div>

          <div>
            {conversions.map((conversion) => (
              <div
                key={conversion.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 border-b border-white/[0.08] last:border-0 hover:bg-cyber-cyan/[0.02] transition-colors gap-3"
              >
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => loadFromHistory(conversion)}
                >
                  <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                    <span className="text-xs text-zinc-400">{formatDate(conversion.created_at)}</span>
                    {conversion.full_page === 1 && (
                      <span className="text-xs px-2 py-0.5 bg-cyber-cyan/20 text-cyber-cyan rounded">
                        {dict.converter.fullPage}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-300 truncate mb-1.5 hover:text-cyber-cyan transition-colors" title={dict.converter.clickToEdit}>
                    {conversion.html_preview || '-'}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {conversion.width}×{conversion.height || 'auto'} @{conversion.dpr}x
                    <span className="ml-3">{formatFileSize(conversion.file_size)}</span>
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteConversion(conversion.id)
                  }}
                  className="cyber-btn cyber-btn-danger !py-2 !px-4 !text-xs self-start sm:self-center"
                >
                  {dict.converter.delete}
                </button>
              </div>
            ))}

            {conversions.length < conversionsTotal && (
              <div className="p-4 md:p-5 text-center">
                <button
                  onClick={() => loadConversions(conversionsOffset + conversionsLimit)}
                  disabled={conversionsLoading}
                  className="cyber-btn !py-2 !px-6 !text-sm"
                >
                  {conversionsLoading ? (
                    <span className="cyber-spinner" />
                  ) : (
                    dict.converter.viewMore
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
