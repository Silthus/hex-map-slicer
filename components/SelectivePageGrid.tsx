'use client'

import { generateLabeledHexGrid } from '@/lib/gridGenerator'
import { generateSelectiveTilePages, renderSelectiveTilePage, renderSelectiveTilePagePreview } from '@/lib/tileSlicer'
import type { HexCell, HexSettings, SelectivePrintSettings, SelectiveTilePage, UploadedImage } from '@/types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface SelectivePageGridProps {
  image: UploadedImage
  settings: HexSettings
  selectedTileIds: string[]
  selectivePrintSettings: SelectivePrintSettings
}

export function SelectivePageGrid({ 
  image, 
  settings, 
  selectedTileIds,
  selectivePrintSettings 
}: SelectivePageGridProps) {
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [hexCells, setHexCells] = useState<HexCell[]>([])

  // Generate source canvas with image and hex overlay at FULL resolution
  useEffect(() => {
    const loadAndRender = async () => {
      setIsReady(false)
      
      // Create source canvas at full image resolution
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Load image
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject()
        img.src = image.src
      })

      // Draw image at full resolution
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, image.width, image.height)

      // Generate hex grid at full resolution
      const cells = generateLabeledHexGrid(
        image.width,
        image.height,
        settings.grid.hexSize,
        settings.grid.orientation,
        settings.grid.numberingMode,
        settings.grid.offsetX,
        settings.grid.offsetY
      )

      // Draw hex grid at full resolution (without overlay, just the lines/numbers)
      if (settings.grid.showLines) {
        ctx.strokeStyle = settings.grid.lineColor
        ctx.globalAlpha = settings.grid.lineOpacity / 100
        ctx.lineWidth = Math.max(2, settings.grid.hexSize * 0.03)
        
        cells.forEach(cell => {
          ctx.beginPath()
          cell.vertices.forEach((vertex, i) => {
            if (i === 0) ctx.moveTo(vertex.x, vertex.y)
            else ctx.lineTo(vertex.x, vertex.y)
          })
          ctx.closePath()
          ctx.stroke()
        })
        
        ctx.globalAlpha = 1
      }

      if (settings.grid.showNumbers) {
        const fontSize = Math.max(12, Math.min(settings.grid.hexSize * 0.3, 48))
        ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = settings.grid.numberColor
        ctx.globalAlpha = settings.grid.numberOpacity / 100
        
        ctx.shadowColor = 'rgba(0,0,0,0.5)'
        ctx.shadowBlur = 3
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1
        
        cells.forEach(cell => {
          ctx.fillText(cell.label, cell.centerX, cell.centerY)
        })
        
        ctx.shadowColor = 'transparent'
        ctx.globalAlpha = 1
      }

      sourceCanvasRef.current = canvas
      setHexCells(cells)
      setIsReady(true)
    }

    loadAndRender().catch(console.error)
  }, [image, settings.grid])

  // Get selected cells from the hex cells array
  const selectedCells = useMemo(() => {
    const selectedSet = new Set(selectedTileIds)
    return hexCells.filter(cell => selectedSet.has(`${cell.q}:${cell.r}`))
  }, [hexCells, selectedTileIds])

  // Generate tile pages for the selected tiles
  const tilePages = useMemo(() => {
    if (!isReady || selectedCells.length === 0) return []
    
    return generateSelectiveTilePages(selectedCells, selectivePrintSettings)
  }, [isReady, selectedCells, selectivePrintSettings])

  // Handle single tile page download
  const handleDownloadPage = useCallback(async (page: SelectiveTilePage) => {
    const sourceCanvas = sourceCanvasRef.current
    if (!sourceCanvas) return

    const outputCanvas = renderSelectiveTilePage(
      sourceCanvas,
      page,
      settings.grid.hexSize,
      settings.grid.orientation,
      selectivePrintSettings,
      {
        showLines: settings.grid.showLines,
        lineColor: settings.grid.lineColor,
        lineOpacity: settings.grid.lineOpacity,
        showNumbers: settings.grid.showNumbers,
        numberColor: settings.grid.numberColor,
        numberOpacity: settings.grid.numberOpacity,
      }
    )

    // Download as PNG
    const dataUrl = outputCanvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `hex-tiles-page-${page.pageIndex + 1}.png`
    link.click()
  }, [settings.grid, selectivePrintSettings])

  // Handle download all pages
  const handleDownloadAll = useCallback(async () => {
    const sourceCanvas = sourceCanvasRef.current
    if (!sourceCanvas || tilePages.length === 0) return

    for (const page of tilePages) {
      const outputCanvas = renderSelectiveTilePage(
        sourceCanvas,
        page,
        settings.grid.hexSize,
        settings.grid.orientation,
        selectivePrintSettings,
        {
          showLines: settings.grid.showLines,
          lineColor: settings.grid.lineColor,
          lineOpacity: settings.grid.lineOpacity,
          showNumbers: settings.grid.showNumbers,
          numberColor: settings.grid.numberColor,
          numberOpacity: settings.grid.numberOpacity,
        }
      )

      const dataUrl = outputCanvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `hex-tiles-page-${page.pageIndex + 1}.png`
      link.click()

      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }, [tilePages, settings.grid, selectivePrintSettings])

  if (!isReady) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin w-6 h-6 text-brass mr-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span className="font-mono text-parchment/70">Generating pages...</span>
        </div>
      </div>
    )
  }

  if (selectedCells.length === 0) {
    return (
      <div className="card p-6">
        <div className="text-center py-8">
          <p className="font-mono text-parchment/70">No tiles selected</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-header mb-0 border-0 pb-0">
          Page Preview
        </h2>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-parchment/50">
            {selectedCells.length} tiles → {tilePages.length} {tilePages.length === 1 ? 'page' : 'pages'}
          </span>
          <span className="font-mono text-xs text-brass">
            {selectivePrintSettings.tileSizeCm}cm tiles
          </span>
        </div>
      </div>

      {/* Page grid */}
      <div 
        className="grid gap-4 mb-6"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(200px, 1fr))`,
        }}
      >
        {tilePages.map((page) => (
          <SelectiveTilePagePreview
            key={page.pageIndex}
            page={page}
            hexSize={settings.grid.hexSize}
            hexOrientation={settings.grid.orientation}
            settings={settings}
            selectivePrintSettings={selectivePrintSettings}
            sourceCanvas={sourceCanvasRef.current}
            onDownload={handleDownloadPage}
          />
        ))}
      </div>

      {/* Export buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-teal/10">
        <button
          onClick={handleDownloadAll}
          className="btn-primary flex items-center gap-2"
          disabled={tilePages.length === 0}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download All ({tilePages.length} {tilePages.length === 1 ? 'page' : 'pages'})
        </button>
      </div>
    </div>
  )
}

// Individual tile page preview component
interface SelectiveTilePagePreviewProps {
  page: SelectiveTilePage
  hexSize: number
  hexOrientation: 'pointy' | 'flat'
  settings: HexSettings
  selectivePrintSettings: SelectivePrintSettings
  sourceCanvas: HTMLCanvasElement | null
  onDownload: (page: SelectiveTilePage) => void
}

function SelectiveTilePagePreview({
  page,
  hexSize,
  hexOrientation,
  settings,
  selectivePrintSettings,
  sourceCanvas,
  onDownload,
}: SelectiveTilePagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Render preview
  useEffect(() => {
    if (!sourceCanvas || !canvasRef.current || !containerRef.current) return

    const container = containerRef.current
    const previewWidth = Math.min(container.clientWidth, 300)

    const previewCanvas = renderSelectiveTilePagePreview(
      sourceCanvas,
      page,
      hexSize,
      hexOrientation,
      selectivePrintSettings,
      {
        showLines: settings.grid.showLines,
        lineColor: settings.grid.lineColor,
        lineOpacity: settings.grid.lineOpacity,
        showNumbers: settings.grid.showNumbers,
        numberColor: settings.grid.numberColor,
        numberOpacity: settings.grid.numberOpacity,
      },
      previewWidth
    )

    const canvas = canvasRef.current
    canvas.width = previewCanvas.width
    canvas.height = previewCanvas.height

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(previewCanvas, 0, 0)
    }
  }, [sourceCanvas, page, hexSize, hexOrientation, settings.grid, selectivePrintSettings])

  return (
    <div 
      ref={containerRef}
      className="group relative bg-navy-dark/30 rounded-lg overflow-hidden border border-teal/10 hover:border-teal/30 transition-colors"
    >
      {/* Page number label */}
      <div className="absolute top-2 left-2 z-10 bg-navy/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-mono text-parchment/70">
        Page {page.pageIndex + 1}
      </div>

      {/* Tile count */}
      <div className="absolute top-2 right-2 z-10 bg-brass/90 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-mono text-navy-dark">
        {page.tiles.length} tiles
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-auto"
      />

      {/* Hover overlay with download button */}
      <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button
          onClick={() => onDownload(page)}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
      </div>
    </div>
  )
}
