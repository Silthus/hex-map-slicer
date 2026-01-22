'use client'

import { generateLabeledHexGrid } from '@/lib/gridGenerator'
import { calculateDisplayHexSize, generateSlicesWithOverlap } from '@/lib/pageSlicer'
import { generateSpatialTilePages, renderSpatialTilePage } from '@/lib/tileSlicer'
import type { HexCell, HexSettings, PageSlice, SpatialTilePage, UploadedImage } from '@/types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ExportButtons } from './ExportButtons'
import { PageTile } from './PageTile'
import { TilePagePreview } from './TilePagePreview'

interface PageGridProps {
  image: UploadedImage
  settings: HexSettings
}

export function PageGrid({ image, settings }: PageGridProps) {
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

      // Draw hex grid at full resolution
      if (settings.grid.showLines) {
        ctx.strokeStyle = settings.grid.lineColor
        ctx.globalAlpha = settings.grid.lineOpacity / 100
        ctx.lineWidth = Math.max(2, settings.grid.hexSize * 0.03) // Scale line width with hex size
        
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
        // Calculate appropriate font size based on hex size
        const fontSize = Math.max(12, Math.min(settings.grid.hexSize * 0.3, 48))
        ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = settings.grid.numberColor
        ctx.globalAlpha = settings.grid.numberOpacity / 100
        
        // Add text shadow for better readability
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

  // Generate page slices with overlap (region mode)
  const slices = useMemo(() => {
    if (!isReady || settings.print.sliceMode !== 'region') return []
    
    return generateSlicesWithOverlap(
      image.width,
      image.height,
      settings.print,
      hexCells,
      settings.grid.hexSize,
      settings.grid.orientation
    )
  }, [isReady, image.width, image.height, settings.print, hexCells, settings.grid.hexSize, settings.grid.orientation])

  // Generate spatial tile pages (tile mode - preserves map layout)
  const tilePages = useMemo(() => {
    if (!isReady || settings.print.sliceMode !== 'tile' || hexCells.length === 0) return []
    
    return generateSpatialTilePages(
      hexCells,
      settings.grid.hexSize,
      settings.grid.orientation,
      image.width,
      image.height,
      settings.print
    )
  }, [isReady, hexCells, settings.grid.hexSize, settings.grid.orientation, image.width, image.height, settings.print])

  // Calculate hex size for display
  const hexSizeCm = useMemo(() => {
    return calculateDisplayHexSize(
      image.width,
      settings.grid.hexSize,
      settings.print.pagesX,
      settings.print
    ).toFixed(1)
  }, [image.width, settings.grid.hexSize, settings.print])

  // Handle single page download (region mode)
  const handleDownloadPage = useCallback(async (slice: PageSlice) => {
    const sourceCanvas = sourceCanvasRef.current
    if (!sourceCanvas) return

    const { dpi, orientation, marginMm, paperWidth, paperHeight } = settings.print
    
    // Get paper dimensions based on orientation
    const pageWidthMm = orientation === 'landscape' ? paperHeight : paperWidth
    const pageHeightMm = orientation === 'landscape' ? paperWidth : paperHeight
    
    // Calculate output canvas size in pixels at target DPI
    const outputWidth = Math.round((pageWidthMm / 25.4) * dpi)
    const outputHeight = Math.round((pageHeightMm / 25.4) * dpi)
    
    // Create output canvas
    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = outputWidth
    outputCanvas.height = outputHeight
    
    const ctx = outputCanvas.getContext('2d')
    if (!ctx) return

    // Fill with white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, outputWidth, outputHeight)
    
    // Calculate margins in pixels
    const marginPx = (marginMm / 25.4) * dpi
    
    // Printable area
    const printableWidth = outputWidth - (marginPx * 2)
    const printableHeight = outputHeight - (marginPx * 2)
    
    // Calculate scale to fit while maintaining aspect ratio
    const scaleX = printableWidth / slice.extendedWidth
    const scaleY = printableHeight / slice.extendedHeight
    const scale = Math.min(scaleX, scaleY)
    
    // Calculate destination size
    const destWidth = slice.extendedWidth * scale
    const destHeight = slice.extendedHeight * scale
    
    // Center in printable area
    const destX = marginPx + (printableWidth - destWidth) / 2
    const destY = marginPx + (printableHeight - destHeight) / 2
    
    // Draw the slice with high quality
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(
      sourceCanvas,
      slice.extendedX, slice.extendedY, slice.extendedWidth, slice.extendedHeight,
      destX, destY, destWidth, destHeight
    )

    // Download as PNG
    const dataUrl = outputCanvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `hex-map-page-${slice.col + 1}-${slice.row + 1}.png`
    link.click()
  }, [settings.print])

  // Handle single tile page download
  const handleDownloadTilePage = useCallback(async (page: SpatialTilePage) => {
    const sourceCanvas = sourceCanvasRef.current
    if (!sourceCanvas) return

    const outputCanvas = renderSpatialTilePage(
      sourceCanvas,
      page,
      settings.grid.hexSize,
      settings.grid.orientation,
      settings.print,
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
    link.download = `hex-tiles-page-${page.row + 1}-${page.col + 1}.png`
    link.click()
  }, [settings.grid, settings.print])

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

  const isRegionMode = settings.print.sliceMode === 'region'
  const totalPages = isRegionMode ? slices.length : tilePages.length

  return (
    <div className="card p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-header mb-0 border-0 pb-0">
          Page Preview
        </h2>
        <div className="flex items-center gap-4">
          {isRegionMode ? (
            <span className="font-mono text-xs text-parchment/50">
              {settings.print.pagesX} × {settings.print.pagesY} = {totalPages} pages
            </span>
          ) : (
            <span className="font-mono text-xs text-parchment/50">
              {hexCells.length} tiles → {totalPages} pages
            </span>
          )}
          <span className="font-mono text-xs text-brass">
            ~{hexSizeCm}cm hex
          </span>
        </div>
      </div>

      {/* Page grid - Region mode */}
      {isRegionMode && (
        <div 
          className="grid gap-4 mb-6"
          style={{
            gridTemplateColumns: `repeat(${settings.print.pagesX}, minmax(150px, 1fr))`,
          }}
        >
          {slices.map((slice) => (
            <PageTile
              key={`${slice.row}-${slice.col}`}
              slice={slice}
              image={image}
              settings={settings}
              sourceCanvas={sourceCanvasRef.current}
              onDownload={handleDownloadPage}
            />
          ))}
        </div>
      )}

      {/* Page grid - Tile mode (spatial layout matching region mode) */}
      {!isRegionMode && (
        <div 
          className="grid gap-4 mb-6"
          style={{
            gridTemplateColumns: `repeat(${settings.print.pagesX}, minmax(150px, 1fr))`,
          }}
        >
          {tilePages.map((page) => (
            <TilePagePreview
              key={page.pageIndex}
              page={page}
              hexSize={settings.grid.hexSize}
              hexOrientation={settings.grid.orientation}
              settings={settings}
              sourceCanvas={sourceCanvasRef.current}
              onDownload={handleDownloadTilePage}
            />
          ))}
        </div>
      )}

      {/* Export buttons */}
      <ExportButtons
        image={image}
        settings={settings}
        slices={slices}
        tilePages={tilePages}
        hexCells={hexCells}
        sourceCanvas={sourceCanvasRef.current}
      />
    </div>
  )
}
