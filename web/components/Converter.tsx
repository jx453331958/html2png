'use client'

import { useState, useRef } from 'react'
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Section */}
      <div className="glass-card p-7 slide-up stagger-1">
        <div className="section-header">
          <div className="section-icon">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <span className="section-title">{dict.converter.htmlInput}</span>
          <button
            onClick={triggerFileUpload}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-cyber-cyan hover:text-white bg-cyber-cyan/10 hover:bg-cyber-cyan/20 border border-cyber-cyan/30 rounded transition-all"
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
          className="cyber-input cyber-textarea h-72"
          placeholder={dict.converter.placeholder}
        />

        <div className="grid grid-cols-2 gap-4 mt-5">
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
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={fullPage}
                onChange={(e) => setFullPage(e.target.checked)}
                className="w-5 h-5 rounded bg-black/40 border border-white/[0.08] checked:bg-cyber-cyan checked:border-cyber-cyan transition-all cursor-pointer"
              />
              <span className="text-sm text-zinc-400">{dict.converter.fullPage}</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleConvert}
          disabled={loading || !html.trim()}
          className="cyber-btn w-full mt-6 flex items-center justify-center gap-3"
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
      <div className="glass-card p-7 slide-up stagger-2">
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
            className="cyber-btn cyber-btn-success w-full mt-5 flex items-center justify-center gap-3"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {dict.converter.download}
          </button>
        )}
      </div>
    </div>
  )
}
