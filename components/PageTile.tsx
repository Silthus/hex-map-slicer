'use client'

import type { HexSettings, PageSlice, UploadedImage } from '@/types'
import { useEffect, useMemo, useRef, useState } from 'react'

interface PageTileProps {
  slice: PageSlice
  image: UploadedImage
  settings: HexSettings
  sourceCanvas: HTMLCanvasElement | null
  onDownload: (slice: PageSlice) => void
}

export function PageTile({ slice, image, settings, sourceCanvas, onDownload }: PageTileProps) {
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

  // Render the preview at good quality with margin visualization
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !sourceCanvas || canvasSize.width === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { orientation, marginMm, paperWidth, paperHeight } = settings.print

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

    // Fill with white background (this represents the full page)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, displayWidth, displayHeight)

    // Calculate margin as a proportion of the page
    const pageWidthMm = orientation === 'landscape' ? paperHeight : paperWidth
    const pageHeightMm = orientation === 'landscape' ? paperWidth : paperHeight
    
    const marginXRatio = marginMm / pageWidthMm
    const marginYRatio = marginMm / pageHeightMm
    
    // Calculate printable area in display pixels
    const marginX = displayWidth * marginXRatio
    const marginY = displayHeight * marginYRatio
    const printableWidth = displayWidth - (marginX * 2)
    const printableHeight = displayHeight - (marginY * 2)

    // Calculate the slice aspect ratio
    const sliceAspectRatio = slice.extendedWidth / slice.extendedHeight

    // Calculate centering - fit slice content into the printable area (not full page)
    let drawWidth = printableWidth
    let drawHeight = printableHeight
    let offsetX = marginX
    let offsetY = marginY

    if (sliceAspectRatio > printableWidth / printableHeight) {
      // Source is wider, fit to width
      drawHeight = printableWidth / sliceAspectRatio
      offsetY = marginY + (printableHeight - drawHeight) / 2
    } else {
      // Source is taller, fit to height
      drawWidth = printableHeight * sliceAspectRatio
      offsetX = marginX + (printableWidth - drawWidth) / 2
    }

    // Draw with high quality settings
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    
    ctx.drawImage(
      sourceCanvas,
      slice.extendedX, slice.extendedY, slice.extendedWidth, slice.extendedHeight,
      offsetX, offsetY, drawWidth, drawHeight
    )

    // Draw margin indicator (subtle border showing printable area)
    if (marginMm > 0) {
      ctx.save()
      ctx.strokeStyle = 'rgba(45, 106, 106, 0.3)' // teal color, subtle
      ctx.lineWidth = 1
      ctx.setLineDash([2, 2])
      ctx.strokeRect(marginX, marginY, printableWidth, printableHeight)
      ctx.restore()
    }

    // Draw overlap indicator if there's overlap
    if (slice.overlap.left > 0 || slice.overlap.right > 0 || slice.overlap.top > 0 || slice.overlap.bottom > 0) {
      ctx.save()
      
      // Calculate scaled overlap boundaries
      const scaleX = drawWidth / slice.extendedWidth
      const scaleY = drawHeight / slice.extendedHeight
      
      // Draw subtle overlap indicator border
      ctx.strokeStyle = 'rgba(218, 165, 32, 0.3)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      
      // Original slice boundaries (non-overlapped region)
      const innerX = offsetX + (slice.overlap.left * scaleX)
      const innerY = offsetY + (slice.overlap.top * scaleY)
      const innerWidth = drawWidth - ((slice.overlap.left + slice.overlap.right) * scaleX)
      const innerHeight = drawHeight - ((slice.overlap.top + slice.overlap.bottom) * scaleY)
      
      ctx.strokeRect(innerX, innerY, innerWidth, innerHeight)
      
      ctx.restore()
    }
  }, [slice, sourceCanvas, canvasSize, settings.print])

  const hasOverlap = slice.overlap.left > 0 || slice.overlap.right > 0 || 
                    slice.overlap.top > 0 || slice.overlap.bottom > 0

  return (
    <div 
      className="group relative rounded-lg overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Page number label */}
      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-navy-dark/80 backdrop-blur-sm rounded text-xs font-mono text-parchment">
        {slice.col + 1},{slice.row + 1}
      </div>

      {/* Overlap indicator */}
      {hasOverlap && (
        <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 bg-brass/80 backdrop-blur-sm rounded text-xs font-mono text-navy-dark">
          +overlap
        </div>
      )}

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
          onClick={() => onDownload(slice)}
          className="btn-primary flex items-center gap-2"
          aria-label={`Download page ${slice.col + 1},${slice.row + 1}`}
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
