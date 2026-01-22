'use client'

import type { HexOrientation, HexSettings, SpatialTilePage } from '@/types'
import { renderSpatialTilePagePreview } from '@/lib/tileSlicer'
import { useEffect, useMemo, useRef, useState } from 'react'

interface TilePagePreviewProps {
  page: SpatialTilePage
  hexSize: number
  hexOrientation: HexOrientation
  settings: HexSettings
  sourceCanvas: HTMLCanvasElement | null
  onDownload: (page: SpatialTilePage) => void
}

export function TilePagePreview({ 
  page, 
  hexSize, 
  hexOrientation, 
  settings, 
  sourceCanvas, 
  onDownload 
}: TilePagePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  // Calculate page aspect ratio based on orientation
  const pageAspectRatio = useMemo(() => {
    const { orientation, paperWidth, paperHeight } = settings.print
    if (orientation === 'landscape') {
      return paperHeight / paperWidth // 297/210 for A4 landscape
    }
    return paperWidth / paperHeight // 210/297 for A4 portrait
  }, [settings.print.orientation, settings.print.paperWidth, settings.print.paperHeight])

  // Track container size changes
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateSize = () => {
      const rect = container.getBoundingClientRect()
      setCanvasSize({ width: rect.width, height: rect.height })
    }

    // Initial size
    updateSize()

    // Use ResizeObserver for size changes
    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [pageAspectRatio])

  // Render the tile page preview
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !sourceCanvas || canvasSize.width === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Use higher resolution for the preview (2x display resolution for retina)
    const dpr = window.devicePixelRatio || 1
    const displayWidth = canvasSize.width
    const displayHeight = canvasSize.height
    
    // Set canvas internal size for high DPI
    canvas.width = displayWidth * dpr
    canvas.height = displayHeight * dpr
    
    // Scale context
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight)

    // Render the spatial tile page preview at display resolution
    const previewCanvas = renderSpatialTilePagePreview(
      sourceCanvas,
      page,
      hexSize,
      hexOrientation,
      settings.print,
      {
        showLines: settings.grid.showLines,
        lineColor: settings.grid.lineColor,
        lineOpacity: settings.grid.lineOpacity,
        showNumbers: settings.grid.showNumbers,
        numberColor: settings.grid.numberColor,
        numberOpacity: settings.grid.numberOpacity,
      },
      displayWidth
    )

    // Draw the preview
    ctx.drawImage(previewCanvas, 0, 0, displayWidth, displayHeight)
  }, [page, sourceCanvas, canvasSize, hexSize, hexOrientation, settings.print, settings.grid])

  return (
    <div 
      className="group relative rounded-lg overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Page number label */}
      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-navy-dark/80 backdrop-blur-sm rounded text-xs font-mono text-parchment">
        Page {page.pageIndex + 1}
      </div>

      {/* Tile count */}
      <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 bg-teal/80 backdrop-blur-sm rounded text-xs font-mono text-white">
        {page.tiles.length} tiles
      </div>

      {/* Canvas container with dynamic aspect ratio */}
      <div 
        ref={containerRef}
        className="w-full"
        style={{ aspectRatio: pageAspectRatio }}
      >
        <canvas 
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: 'block' }}
        />
      </div>

      {/* Download overlay */}
      <div 
        className={`
          absolute inset-0 bg-navy-dark/60 backdrop-blur-sm
          flex items-center justify-center
          transition-opacity duration-200
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}
      >
        <button
          onClick={() => onDownload(page)}
          className="btn-primary flex items-center gap-2"
          aria-label={`Download tile page ${page.pageIndex + 1}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PNG
        </button>
      </div>
    </div>
  )
}
