'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import type { UploadedImage, HexSettings, HexCell } from '@/types'
import { generateLabeledHexGrid } from '@/lib/gridGenerator'
import { findHexAtPoint } from '@/lib/hexMath'

// Zoom constants
const MIN_ZOOM = 0.25
const MAX_ZOOM = 4
const ZOOM_STEP = 0.1

interface HexCanvasProps {
  image: UploadedImage
  settings: HexSettings
  fullScreen?: boolean
  // Select mode props
  selectMode?: boolean
  selectedTileIds?: string[]
  onTileClick?: (q: number, r: number) => void
}

export function HexCanvas({ 
  image, 
  settings, 
  fullScreen = false,
  selectMode = false,
  selectedTileIds = [],
  onTileClick,
}: HexCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [offset, setOffset] = useState({ x: settings.grid.offsetX, y: settings.grid.offsetY })
  const [zoom, setZoom] = useState(1)
  
  // Create a Set for faster lookup of selected tiles
  const selectedTileSet = useMemo(() => new Set(selectedTileIds), [selectedTileIds])
  
  // Sync offset with settings
  useEffect(() => {
    setOffset({ x: settings.grid.offsetX, y: settings.grid.offsetY })
  }, [settings.grid.offsetX, settings.grid.offsetY])

  // Load image
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageRef.current = img
      // Trigger re-render
      setDisplaySize(prev => ({ ...prev }))
    }
    img.src = image.src
    
    return () => {
      imageRef.current = null
    }
  }, [image.src])

  // Calculate display dimensions to fit container
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateSize = () => {
      const rect = container.getBoundingClientRect()
      
      // For full-screen mode, use the full container dimensions
      const maxWidth = fullScreen ? rect.width : rect.width - 16
      const maxHeight = fullScreen ? rect.height : Math.min(600, window.innerHeight * 0.5)
      
      // Maintain aspect ratio
      const aspectRatio = image.width / image.height
      let width = maxWidth
      let height = width / aspectRatio
      
      if (height > maxHeight) {
        height = maxHeight
        width = height * aspectRatio
      }
      
      setDisplaySize({ width: Math.floor(width), height: Math.floor(height) })
    }

    updateSize()
    window.addEventListener('resize', updateSize, { passive: true })
    return () => window.removeEventListener('resize', updateSize)
  }, [image.width, image.height, fullScreen])

  // Generate hex grid at FULL image resolution
  const hexCells = useMemo(() => {
    if (displaySize.width === 0) return []
    
    return generateLabeledHexGrid(
      image.width,
      image.height,
      settings.grid.hexSize,
      settings.grid.orientation,
      settings.grid.numberingMode,
      offset.x,
      offset.y
    )
  }, [
    displaySize.width,
    image.width,
    image.height,
    settings.grid.hexSize,
    settings.grid.orientation,
    settings.grid.numberingMode,
    offset.x,
    offset.y,
  ])

  // Draw canvas at full resolution
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const img = imageRef.current
    
    if (!canvas || !ctx || !img || displaySize.width === 0) return

    // Use devicePixelRatio for sharp rendering
    const dpr = window.devicePixelRatio || 1
    
    // Set canvas internal resolution to full image size (or scaled for performance)
    // Use a reasonable max size to avoid performance issues
    const maxCanvasSize = 2000
    const scale = Math.min(1, maxCanvasSize / Math.max(image.width, image.height))
    const canvasWidth = Math.floor(image.width * scale)
    const canvasHeight = Math.floor(image.height * scale)
    
    canvas.width = canvasWidth * dpr
    canvas.height = canvasHeight * dpr
    
    // Scale context for high DPI
    ctx.scale(dpr, dpr)

    // Draw image at full quality
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)

    // Draw hex grid
    if (settings.grid.showLines || settings.grid.showNumbers || selectMode) {
      drawHexGrid(ctx, hexCells, settings, scale, selectMode ? selectedTileSet : undefined)
    }
  }, [displaySize, hexCells, settings, image.width, image.height, selectMode, selectedTileSet])

  // Handle click for select mode
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!selectMode || !onTileClick) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    
    // Scale click to image coordinates (accounting for zoom)
    const scaleX = image.width / (displaySize.width * zoom)
    const scaleY = image.height / (displaySize.height * zoom)
    const imageX = clickX * scaleX
    const imageY = clickY * scaleY
    
    // Find the hex at this position
    const cell = findHexAtPoint(imageX, imageY, hexCells)
    if (cell) {
      onTileClick(cell.q, cell.r)
    }
  }, [selectMode, onTileClick, image.width, image.height, displaySize.width, displaySize.height, hexCells, zoom])

  // Handle mouse events for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return // Only left click
    if (selectMode) return // Don't drag in select mode
    
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }, [offset, selectMode])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || selectMode) return
    
    // Scale mouse movement to image coordinates
    const scale = image.width / displaySize.width
    const newOffset = {
      x: (e.clientX - dragStart.x),
      y: (e.clientY - dragStart.y),
    }
    setOffset(newOffset)
  }, [isDragging, selectMode, dragStart, image.width, displaySize.width])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (selectMode) return
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y })
  }, [offset, selectMode])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || selectMode) return
    
    const touch = e.touches[0]
    const newOffset = {
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    }
    setOffset(newOffset)
  }, [isDragging, selectMode, dragStart])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (selectMode && onTileClick && e.changedTouches.length > 0) {
      // Handle tap in select mode
      const touch = e.changedTouches[0]
      const canvas = canvasRef.current
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const clickX = touch.clientX - rect.left
      const clickY = touch.clientY - rect.top
      
      // Scale click to image coordinates (accounting for zoom)
      const scaleX = image.width / (displaySize.width * zoom)
      const scaleY = image.height / (displaySize.height * zoom)
      const imageX = clickX * scaleX
      const imageY = clickY * scaleY
      
      const cell = findHexAtPoint(imageX, imageY, hexCells)
      if (cell) {
        onTileClick(cell.q, cell.r)
      }
    }
    setIsDragging(false)
  }, [selectMode, onTileClick, image.width, image.height, displaySize.width, displaySize.height, hexCells, zoom])

  // Zoom via scroll wheel - use native event listener for non-passive option
  useEffect(() => {
    const container = containerRef.current
    if (!container || !fullScreen) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      setZoom(prev => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(prev + delta).toFixed(2))))
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [fullScreen])

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(MAX_ZOOM, +(prev + ZOOM_STEP).toFixed(2)))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(MIN_ZOOM, +(prev - ZOOM_STEP).toFixed(2)))
  }, [])

  const handleZoomReset = useCallback(() => {
    setZoom(1)
  }, [])

  // Cursor style based on mode
  const getCursorClass = () => {
    if (selectMode) return 'cursor-pointer'
    return isDragging ? 'cursor-grabbing' : 'cursor-grab'
  }

  // For full-screen mode, render a simpler container
  if (fullScreen) {
    return (
      <div 
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center bg-navy-dark/30 overflow-auto"
      >
        <canvas
          ref={canvasRef}
          className={`
            shadow-2xl shadow-black/40
            ${getCursorClass()}
          `}
          style={{
            width: displaySize.width || 'auto',
            height: displaySize.height || 'auto',
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
          }}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role="img"
          aria-label={selectMode 
            ? "Hex map in selection mode. Click tiles to select or deselect them." 
            : "Hex map preview with grid overlay. Drag to adjust grid position."}
        />

        {/* Mode indicator */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-navy/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-teal/20">
          <span className="font-mono text-xs text-parchment/60">
            {selectMode 
              ? `Click tiles to select • ${selectedTileIds.length} selected`
              : `Offset: ${Math.round(offset.x)}px, ${Math.round(offset.y)}px`}
          </span>
        </div>

        {/* Zoom controls */}
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-navy/90 backdrop-blur-sm px-2 py-1.5 rounded-lg border border-teal/20">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-navy-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Zoom out"
          >
            <svg className="w-4 h-4 text-parchment" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <button
            onClick={handleZoomReset}
            className="min-w-[60px] px-2 py-1 font-mono text-xs text-brass hover:text-brass/80 transition-colors"
            aria-label="Reset zoom to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>
          
          <button
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-navy-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Zoom in"
          >
            <svg className="w-4 h-4 text-parchment" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // Standard (non-full-screen) mode
  return (
    <div className="space-y-4">
      {/* Canvas container */}
      <div 
        ref={containerRef}
        className="relative flex items-center justify-center min-h-[300px] md:min-h-[400px]"
      >
        <canvas
          ref={canvasRef}
          className={`
            rounded-lg shadow-lg shadow-black/20
            ${getCursorClass()}
          `}
          style={{
            width: displaySize.width || 'auto',
            height: displaySize.height || 'auto',
          }}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role="img"
          aria-label={selectMode 
            ? "Hex map in selection mode. Click tiles to select or deselect them." 
            : "Hex map preview with grid overlay. Drag to adjust grid position."}
        />

        {/* Hint text */}
        {!isDragging && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-navy-dark/80 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="font-mono text-xs text-parchment/50">
                {selectMode ? 'Click tiles to select' : 'Drag to align grid'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Status display */}
      <div className="flex items-center justify-center gap-4 font-mono text-xs text-parchment/40">
        <span>
          {selectMode 
            ? `${selectedTileIds.length} tiles selected`
            : `Offset: ${Math.round(offset.x)}px, ${Math.round(offset.y)}px`}
        </span>
      </div>
    </div>
  )
}

/**
 * Draw hex grid on canvas
 */
function drawHexGrid(
  ctx: CanvasRenderingContext2D,
  cells: HexCell[],
  settings: HexSettings,
  scale: number = 1,
  selectedTileSet?: Set<string>
) {
  const { grid } = settings
  
  // Draw selected hex fill first (so outlines draw on top)
  if (selectedTileSet && selectedTileSet.size > 0) {
    cells.forEach(cell => {
      const id = `${cell.q}:${cell.r}`
      if (selectedTileSet.has(id)) {
        ctx.beginPath()
        cell.vertices.forEach((vertex, i) => {
          const x = vertex.x * scale
          const y = vertex.y * scale
          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })
        ctx.closePath()
        
        // Fill with semi-transparent teal
        ctx.fillStyle = '#14b8a6'
        ctx.globalAlpha = 0.35
        ctx.fill()
        ctx.globalAlpha = 1
        
        // Draw selection border
        ctx.strokeStyle = '#14b8a6'
        ctx.lineWidth = Math.max(2, 3 * scale)
        ctx.stroke()
      }
    })
  }
  
  // Draw hex outlines
  if (grid.showLines) {
    ctx.strokeStyle = grid.lineColor
    ctx.globalAlpha = grid.lineOpacity / 100
    ctx.lineWidth = Math.max(1, 2 * scale)
    
    cells.forEach(cell => {
      ctx.beginPath()
      cell.vertices.forEach((vertex, i) => {
        const x = vertex.x * scale
        const y = vertex.y * scale
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.closePath()
      ctx.stroke()
    })
    
    ctx.globalAlpha = 1
  }
  
  // Draw hex numbers
  if (grid.showNumbers) {
    // Calculate base font size and apply multiplier
    const baseFontSize = Math.max(8, Math.min(20, settings.grid.hexSize * 0.25)) * scale
    const fontSize = baseFontSize * (grid.numberFontSize || 1.0)
    
    // Build font style string
    const fontStyle = grid.numberFontStyle === 'boldItalic' ? 'bold italic' :
                      grid.numberFontStyle === 'bold' ? 'bold' :
                      grid.numberFontStyle === 'italic' ? 'italic' : ''
    
    ctx.font = `${fontStyle} ${fontSize}px "JetBrains Mono", monospace`.trim()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = grid.numberColor
    ctx.globalAlpha = grid.numberOpacity / 100
    
    // Calculate position offset based on numberPosition setting
    const positionOffset = grid.numberPosition === 'top' ? -0.3 :
                          grid.numberPosition === 'bottom' ? 0.3 : 0
    
    // Get user-defined offsets (as percentage of hex size, default to 0)
    const userOffsetX = (grid.numberOffsetX || 0) / 100
    const userOffsetY = (grid.numberOffsetY || 0) / 100
    
    cells.forEach(cell => {
      const x = cell.centerX * scale + (settings.grid.hexSize * userOffsetX * scale)
      const y = cell.centerY * scale + (settings.grid.hexSize * (positionOffset + userOffsetY) * scale)
      ctx.fillText(cell.label, x, y)
    })
    
    ctx.globalAlpha = 1
  }
  
  // Draw checkmarks on selected tiles
  if (selectedTileSet && selectedTileSet.size > 0) {
    const checkSize = Math.max(12, settings.grid.hexSize * 0.2) * scale
    
    cells.forEach(cell => {
      const id = `${cell.q}:${cell.r}`
      if (selectedTileSet.has(id)) {
        const cx = cell.centerX * scale
        const cy = cell.centerY * scale
        
        // Draw checkmark background circle
        ctx.beginPath()
        ctx.arc(cx, cy - settings.grid.hexSize * 0.25 * scale, checkSize * 0.8, 0, Math.PI * 2)
        ctx.fillStyle = '#14b8a6'
        ctx.globalAlpha = 0.9
        ctx.fill()
        ctx.globalAlpha = 1
        
        // Draw checkmark
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = Math.max(2, checkSize * 0.2)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        
        const checkX = cx - checkSize * 0.35
        const checkY = cy - settings.grid.hexSize * 0.25 * scale
        
        ctx.beginPath()
        ctx.moveTo(checkX - checkSize * 0.2, checkY)
        ctx.lineTo(checkX, checkY + checkSize * 0.2)
        ctx.lineTo(checkX + checkSize * 0.4, checkY - checkSize * 0.25)
        ctx.stroke()
      }
    })
  }
}

/**
 * Export the canvas for external use
 */
export function getHexCanvasData(
  image: UploadedImage,
  settings: HexSettings,
  targetWidth?: number
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const width = targetWidth || image.width
      const height = Math.round(width * (image.height / image.width))
      
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      
      // Draw image
      ctx.drawImage(img, 0, 0, width, height)
      
      // Generate and draw hex grid
      const cells = generateLabeledHexGrid(
        width,
        height,
        settings.grid.hexSize,
        settings.grid.orientation,
        settings.grid.numberingMode,
        settings.grid.offsetX,
        settings.grid.offsetY
      )
      
      if (settings.grid.showLines || settings.grid.showNumbers) {
        drawHexGrid(ctx, cells, settings, 1)
      }
      
      resolve(canvas)
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = image.src
  })
}
