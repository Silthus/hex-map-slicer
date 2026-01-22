import type { HexCell, HexOrientation, PrintSettings, TileLayout, TilePage, TilePlacement } from '@/types'
import { getHexDimensions, getHexVertices } from './hexMath'

/**
 * Tile Slicer
 * 
 * Handles extracting individual hex tiles and packing them efficiently
 * onto A4 pages with configurable margins between tiles.
 */

/**
 * Calculate the tile layout for packing hexes onto pages
 */
export function calculateTileLayout(
  hexSize: number,
  hexOrientation: HexOrientation,
  imageWidth: number,
  settings: PrintSettings,
  totalHexes: number
): TileLayout {
  const { orientation, marginMm, paperWidth, paperHeight, tileMarginMm, dpi, pagesX } = settings
  
  // Get paper dimensions based on orientation
  const pageWidthMm = orientation === 'landscape' ? paperHeight : paperWidth
  const pageHeightMm = orientation === 'landscape' ? paperWidth : paperHeight
  
  // Printable area (excluding page margins)
  const printableWidthMm = pageWidthMm - (marginMm * 2)
  const printableHeightMm = pageHeightMm - (marginMm * 2)
  
  // Calculate hex dimensions in mm based on the region mode scale
  // This ensures tiles are printed at the same size as they would be in region mode
  const hexDims = getHexDimensions(hexSize, hexOrientation)
  
  // Calculate mm per pixel based on region mode scale
  const regionPrintableWidthMm = (pageWidthMm - (marginMm * 2)) * pagesX
  const mmPerPx = regionPrintableWidthMm / imageWidth
  
  // Hex bounding box in mm
  const hexWidthMm = hexDims.width * mmPerPx
  const hexHeightMm = hexDims.height * mmPerPx
  
  // Use the larger dimension for square packing (bounding box)
  const tileSizeMm = Math.max(hexWidthMm, hexHeightMm)
  
  // Effective tile size including margin
  const effectiveTileSizeMm = tileSizeMm + tileMarginMm
  
  // Calculate how many tiles fit per row/column
  // Subtract one margin since we don't need margin after last tile
  const tilesPerRow = Math.max(1, Math.floor((printableWidthMm + tileMarginMm) / effectiveTileSizeMm))
  const tilesPerCol = Math.max(1, Math.floor((printableHeightMm + tileMarginMm) / effectiveTileSizeMm))
  
  const tilesPerPage = tilesPerRow * tilesPerCol
  const totalPages = Math.ceil(totalHexes / tilesPerPage)
  
  return {
    tilesPerRow,
    tilesPerCol,
    tilesPerPage,
    totalPages,
    tileSizeMm,
    effectiveTileSizeMm,
  }
}

/**
 * Generate tile pages with hex placements
 */
export function generateTilePages(
  cells: HexCell[],
  hexSize: number,
  hexOrientation: HexOrientation,
  imageWidth: number,
  settings: PrintSettings
): TilePage[] {
  const layout = calculateTileLayout(hexSize, hexOrientation, imageWidth, settings, cells.length)
  const { tilesPerRow, tilesPerCol, tilesPerPage, tileSizeMm, effectiveTileSizeMm } = layout
  const { orientation, marginMm, paperWidth, paperHeight, tileMarginMm, dpi } = settings
  
  // Get paper dimensions based on orientation
  const pageWidthMm = orientation === 'landscape' ? paperHeight : paperWidth
  const pageHeightMm = orientation === 'landscape' ? paperWidth : paperHeight
  
  // Convert dimensions to pixels at target DPI
  const mmToPx = dpi / 25.4
  const marginPx = marginMm * mmToPx
  const tileSizePx = tileSizeMm * mmToPx
  const tileMarginPx = tileMarginMm * mmToPx
  const effectiveTileSizePx = effectiveTileSizeMm * mmToPx
  
  // Calculate printable area dimensions
  const printableWidthPx = (pageWidthMm - (marginMm * 2)) * mmToPx
  const printableHeightPx = (pageHeightMm - (marginMm * 2)) * mmToPx
  
  // Center the grid of tiles in the printable area
  const gridWidthPx = tilesPerRow * effectiveTileSizePx - tileMarginPx
  const gridHeightPx = tilesPerCol * effectiveTileSizePx - tileMarginPx
  const offsetX = marginPx + (printableWidthPx - gridWidthPx) / 2
  const offsetY = marginPx + (printableHeightPx - gridHeightPx) / 2
  
  const pages: TilePage[] = []
  
  for (let pageIndex = 0; pageIndex < Math.ceil(cells.length / tilesPerPage); pageIndex++) {
    const startIdx = pageIndex * tilesPerPage
    const endIdx = Math.min(startIdx + tilesPerPage, cells.length)
    const pageCells = cells.slice(startIdx, endIdx)
    
    const tiles: TilePlacement[] = pageCells.map((cell, idx) => {
      const row = Math.floor(idx / tilesPerRow)
      const col = idx % tilesPerRow
      
      return {
        cell,
        destX: offsetX + col * effectiveTileSizePx,
        destY: offsetY + row * effectiveTileSizePx,
        destSize: tileSizePx,
      }
    })
    
    pages.push({
      pageIndex,
      tiles,
    })
  }
  
  return pages
}

/**
 * Extract a single hex tile from the source canvas
 * Returns a canvas with the hex clipped and centered
 */
export function extractHexTile(
  sourceCanvas: HTMLCanvasElement,
  cell: HexCell,
  hexSize: number,
  hexOrientation: HexOrientation,
  outputSize: number
): HTMLCanvasElement {
  const hexDims = getHexDimensions(hexSize, hexOrientation)
  
  // Create output canvas at target size
  const tileCanvas = document.createElement('canvas')
  tileCanvas.width = outputSize
  tileCanvas.height = outputSize
  
  const ctx = tileCanvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')
  
  // Calculate scale to fit hex in output
  const scale = outputSize / Math.max(hexDims.width, hexDims.height)
  
  // Center position
  const centerX = outputSize / 2
  const centerY = outputSize / 2
  
  // Save context and set up clipping
  ctx.save()
  
  // Create hex clipping path at output size
  const scaledSize = hexSize * scale
  const vertices = getHexVertices(centerX, centerY, scaledSize, hexOrientation)
  
  ctx.beginPath()
  vertices.forEach((vertex, i) => {
    if (i === 0) ctx.moveTo(vertex.x, vertex.y)
    else ctx.lineTo(vertex.x, vertex.y)
  })
  ctx.closePath()
  ctx.clip()
  
  // Calculate source region
  const srcX = cell.centerX - hexDims.width / 2
  const srcY = cell.centerY - hexDims.height / 2
  const srcWidth = hexDims.width
  const srcHeight = hexDims.height
  
  // Calculate destination to center the hex
  const destWidth = srcWidth * scale
  const destHeight = srcHeight * scale
  const destX = centerX - destWidth / 2
  const destY = centerY - destHeight / 2
  
  // Draw the clipped region
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    sourceCanvas,
    srcX, srcY, srcWidth, srcHeight,
    destX, destY, destWidth, destHeight
  )
  
  ctx.restore()
  
  return tileCanvas
}

/**
 * Render a complete tile page with all its hex tiles
 */
export function renderTilePage(
  sourceCanvas: HTMLCanvasElement,
  page: TilePage,
  hexSize: number,
  hexOrientation: HexOrientation,
  settings: PrintSettings,
  gridSettings: {
    showLines: boolean
    lineColor: string
    lineOpacity: number
    showNumbers: boolean
    numberColor: string
    numberOpacity: number
  }
): HTMLCanvasElement {
  const { dpi, orientation, marginMm, paperWidth, paperHeight } = settings
  
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
  if (!ctx) throw new Error('Failed to get canvas context')
  
  // Fill with white background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, outputWidth, outputHeight)
  
  // Draw each tile
  page.tiles.forEach(placement => {
    const { cell, destX, destY, destSize } = placement
    
    // Extract the hex tile
    const tileCanvas = extractHexTile(
      sourceCanvas,
      cell,
      hexSize,
      hexOrientation,
      Math.round(destSize)
    )
    
    // Draw the tile at its destination
    ctx.drawImage(tileCanvas, destX, destY)
    
    // Draw hex border if enabled
    if (gridSettings.showLines) {
      const scale = destSize / Math.max(
        getHexDimensions(hexSize, hexOrientation).width,
        getHexDimensions(hexSize, hexOrientation).height
      )
      const scaledHexSize = hexSize * scale
      const centerX = destX + destSize / 2
      const centerY = destY + destSize / 2
      const vertices = getHexVertices(centerX, centerY, scaledHexSize, hexOrientation)
      
      ctx.strokeStyle = gridSettings.lineColor
      ctx.globalAlpha = gridSettings.lineOpacity / 100
      ctx.lineWidth = Math.max(1, scaledHexSize * 0.02)
      
      ctx.beginPath()
      vertices.forEach((vertex, i) => {
        if (i === 0) ctx.moveTo(vertex.x, vertex.y)
        else ctx.lineTo(vertex.x, vertex.y)
      })
      ctx.closePath()
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    
    // Draw label if enabled
    if (gridSettings.showNumbers && cell.label) {
      const scale = destSize / Math.max(
        getHexDimensions(hexSize, hexOrientation).width,
        getHexDimensions(hexSize, hexOrientation).height
      )
      const scaledHexSize = hexSize * scale
      const centerX = destX + destSize / 2
      const centerY = destY + destSize / 2
      
      const fontSize = Math.max(10, Math.min(scaledHexSize * 0.3, 36))
      ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = gridSettings.numberColor
      ctx.globalAlpha = gridSettings.numberOpacity / 100
      
      // Add text shadow for better readability
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 2
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1
      
      ctx.fillText(cell.label, centerX, centerY)
      
      ctx.shadowColor = 'transparent'
      ctx.globalAlpha = 1
    }
  })
  
  return outputCanvas
}

/**
 * Generate a preview canvas for a tile page (lower resolution for display)
 */
export function renderTilePagePreview(
  sourceCanvas: HTMLCanvasElement,
  page: TilePage,
  hexSize: number,
  hexOrientation: HexOrientation,
  settings: PrintSettings,
  gridSettings: {
    showLines: boolean
    lineColor: string
    lineOpacity: number
    showNumbers: boolean
    numberColor: string
    numberOpacity: number
  },
  previewWidth: number
): HTMLCanvasElement {
  const { orientation, paperWidth, paperHeight } = settings
  
  // Get paper dimensions based on orientation
  const pageWidthMm = orientation === 'landscape' ? paperHeight : paperWidth
  const pageHeightMm = orientation === 'landscape' ? paperWidth : paperHeight
  
  // Calculate preview height maintaining aspect ratio
  const aspectRatio = pageHeightMm / pageWidthMm
  const previewHeight = previewWidth * aspectRatio
  
  // Create a temporary settings object with lower DPI for preview
  const previewDpi = (previewWidth / pageWidthMm) * 25.4
  const previewSettings: PrintSettings = {
    ...settings,
    dpi: previewDpi,
  }
  
  // Recalculate tile positions for preview resolution
  const layout = calculateTileLayout(hexSize, hexOrientation, sourceCanvas.width, previewSettings, page.tiles.length)
  const { tilesPerRow, tileSizeMm, effectiveTileSizeMm } = layout
  const { marginMm, tileMarginMm } = settings
  
  // Convert to preview pixels
  const mmToPx = previewDpi / 25.4
  const marginPx = marginMm * mmToPx
  const tileSizePx = tileSizeMm * mmToPx
  const tileMarginPx = tileMarginMm * mmToPx
  const effectiveTileSizePx = effectiveTileSizeMm * mmToPx
  
  // Calculate printable area
  const printableWidthPx = previewWidth - (marginPx * 2)
  const printableHeightPx = previewHeight - (marginPx * 2)
  
  // Calculate actual tiles per row/col at preview size
  const actualTilesPerRow = Math.max(1, Math.floor((printableWidthPx + tileMarginPx) / effectiveTileSizePx))
  const actualTilesPerCol = Math.max(1, Math.floor((printableHeightPx + tileMarginPx) / effectiveTileSizePx))
  
  // Center the grid
  const gridWidthPx = actualTilesPerRow * effectiveTileSizePx - tileMarginPx
  const gridHeightPx = actualTilesPerCol * effectiveTileSizePx - tileMarginPx
  const offsetX = marginPx + (printableWidthPx - gridWidthPx) / 2
  const offsetY = marginPx + (printableHeightPx - gridHeightPx) / 2
  
  // Create preview canvas
  const previewCanvas = document.createElement('canvas')
  previewCanvas.width = previewWidth
  previewCanvas.height = previewHeight
  
  const ctx = previewCanvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')
  
  // Fill with white background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, previewWidth, previewHeight)
  
  // Draw each tile
  page.tiles.forEach((placement, idx) => {
    const row = Math.floor(idx / actualTilesPerRow)
    const col = idx % actualTilesPerRow
    
    const destX = offsetX + col * effectiveTileSizePx
    const destY = offsetY + row * effectiveTileSizePx
    
    // Extract and draw tile at preview size
    const tileCanvas = extractHexTile(
      sourceCanvas,
      placement.cell,
      hexSize,
      hexOrientation,
      Math.round(tileSizePx)
    )
    
    ctx.drawImage(tileCanvas, destX, destY)
    
    // Draw hex border if enabled
    if (gridSettings.showLines) {
      const hexDims = getHexDimensions(hexSize, hexOrientation)
      const scale = tileSizePx / Math.max(hexDims.width, hexDims.height)
      const scaledHexSize = hexSize * scale
      const centerX = destX + tileSizePx / 2
      const centerY = destY + tileSizePx / 2
      const vertices = getHexVertices(centerX, centerY, scaledHexSize, hexOrientation)
      
      ctx.strokeStyle = gridSettings.lineColor
      ctx.globalAlpha = gridSettings.lineOpacity / 100
      ctx.lineWidth = Math.max(0.5, scaledHexSize * 0.02)
      
      ctx.beginPath()
      vertices.forEach((vertex, i) => {
        if (i === 0) ctx.moveTo(vertex.x, vertex.y)
        else ctx.lineTo(vertex.x, vertex.y)
      })
      ctx.closePath()
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    
    // Draw label if enabled
    if (gridSettings.showNumbers && placement.cell.label) {
      const hexDims = getHexDimensions(hexSize, hexOrientation)
      const scale = tileSizePx / Math.max(hexDims.width, hexDims.height)
      const scaledHexSize = hexSize * scale
      const centerX = destX + tileSizePx / 2
      const centerY = destY + tileSizePx / 2
      
      const fontSize = Math.max(6, Math.min(scaledHexSize * 0.25, 14))
      ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = gridSettings.numberColor
      ctx.globalAlpha = gridSettings.numberOpacity / 100
      
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 1
      ctx.shadowOffsetX = 0.5
      ctx.shadowOffsetY = 0.5
      
      ctx.fillText(placement.cell.label, centerX, centerY)
      
      ctx.shadowColor = 'transparent'
      ctx.globalAlpha = 1
    }
  })
  
  return previewCanvas
}
