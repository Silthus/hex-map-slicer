import type { HexCell, HexOrientation, PageSlice, PrintSettings } from '@/types';
import { getHexDimensions, hexOverlapsRect } from './hexMath';

/**
 * Page Slicer
 * 
 * Handles slicing an image into multiple A4 pages with smart overlap
 * to ensure edge hexes appear complete on at least one page.
 */

/**
 * Calculate the total print area dimensions in pixels
 */
export function calculateTotalPrintArea(
  imageWidth: number,
  imageHeight: number,
  settings: PrintSettings
): { width: number; height: number; scale: number } {
  const { pagesX, pagesY, orientation, marginMm, paperWidth, paperHeight } = settings
  
  // Get paper dimensions based on orientation
  const pageWidthMm = orientation === 'landscape' ? paperHeight : paperWidth
  const pageHeightMm = orientation === 'landscape' ? paperWidth : paperHeight
  
  // Subtract margins
  const printableWidthMm = pageWidthMm - (marginMm * 2)
  const printableHeightMm = pageHeightMm - (marginMm * 2)
  
  // Total printable area
  const totalWidthMm = printableWidthMm * pagesX
  const totalHeightMm = printableHeightMm * pagesY
  
  // Calculate scale to fit image
  const scaleX = totalWidthMm / imageWidth
  const scaleY = totalHeightMm / imageHeight
  const scale = Math.min(scaleX, scaleY)
  
  return {
    width: imageWidth,
    height: imageHeight,
    scale,
  }
}

/**
 * Generate page slices with orientation-aware proportions
 * 
 * Each slice matches the aspect ratio of the printable area on a page,
 * ensuring the content distribution changes when switching orientation.
 */
export function generateBasicSlices(
  imageWidth: number,
  imageHeight: number,
  settings: PrintSettings
): PageSlice[] {
  const { pagesX, pagesY, orientation, marginMm, paperWidth, paperHeight } = settings
  
  // Get paper dimensions based on orientation
  const pageWidthMm = orientation === 'landscape' ? paperHeight : paperWidth
  const pageHeightMm = orientation === 'landscape' ? paperWidth : paperHeight
  
  // Subtract margins to get printable area per page
  const printableWidthMm = pageWidthMm - (marginMm * 2)
  const printableHeightMm = pageHeightMm - (marginMm * 2)
  
  // Total printable area dimensions (in mm)
  const totalPrintableWidthMm = printableWidthMm * pagesX
  const totalPrintableHeightMm = printableHeightMm * pagesY
  
  // Calculate how the image fits into the total printable area
  // We scale the image to fit while maintaining aspect ratio
  const imageAspect = imageWidth / imageHeight
  const printableAspect = totalPrintableWidthMm / totalPrintableHeightMm
  
  // Determine the effective image area that will be used
  // (the image is scaled to fit, so we need to know what portion is actually used)
  let effectiveWidth: number
  let effectiveHeight: number
  let offsetX = 0
  let offsetY = 0
  
  if (imageAspect > printableAspect) {
    // Image is wider than printable area - fit to width, letterbox top/bottom
    effectiveWidth = imageWidth
    effectiveHeight = imageWidth / printableAspect
    offsetY = (effectiveHeight - imageHeight) / 2
  } else {
    // Image is taller than printable area - fit to height, pillarbox left/right
    effectiveHeight = imageHeight
    effectiveWidth = imageHeight * printableAspect
    offsetX = (effectiveWidth - imageWidth) / 2
  }
  
  // Each slice represents one page's worth of content
  const sliceWidth = effectiveWidth / pagesX
  const sliceHeight = effectiveHeight / pagesY
  
  const slices: PageSlice[] = []
  
  for (let row = 0; row < pagesY; row++) {
    for (let col = 0; col < pagesX; col++) {
      // Calculate slice position in the effective coordinate system
      const effectiveX = col * sliceWidth - offsetX
      const effectiveY = row * sliceHeight - offsetY
      
      // Clamp to actual image bounds
      const x = Math.max(0, effectiveX)
      const y = Math.max(0, effectiveY)
      const right = Math.min(imageWidth, effectiveX + sliceWidth)
      const bottom = Math.min(imageHeight, effectiveY + sliceHeight)
      
      const width = Math.max(0, right - x)
      const height = Math.max(0, bottom - y)
      
      slices.push({
        row,
        col,
        x,
        y,
        width,
        height,
        // Extended bounds start the same (will be modified by overlap calculation)
        extendedX: x,
        extendedY: y,
        extendedWidth: width,
        extendedHeight: height,
        // No overlap initially
        overlap: { top: 0, bottom: 0, left: 0, right: 0 },
      })
    }
  }
  
  return slices
}

/**
 * Calculate extended bounds for a page slice to include edge hexes
 */
export function calculateOverlapBounds(
  slice: PageSlice,
  cells: HexCell[],
  hexSize: number,
  orientation: HexOrientation
): PageSlice {
  const dims = getHexDimensions(hexSize, orientation)
  
  // Find all cells that overlap with this slice
  const overlappingCells = cells.filter(cell =>
    hexOverlapsRect(
      cell,
      hexSize,
      orientation,
      slice.x,
      slice.y,
      slice.width,
      slice.height
    )
  )
  
  if (overlappingCells.length === 0) {
    return slice
  }
  
  // Calculate the bounding box of all overlapping cells
  let minX = slice.x
  let minY = slice.y
  let maxX = slice.x + slice.width
  let maxY = slice.y + slice.height
  
  overlappingCells.forEach(cell => {
    const halfWidth = dims.width / 2
    const halfHeight = dims.height / 2
    
    minX = Math.min(minX, cell.centerX - halfWidth)
    minY = Math.min(minY, cell.centerY - halfHeight)
    maxX = Math.max(maxX, cell.centerX + halfWidth)
    maxY = Math.max(maxY, cell.centerY + halfHeight)
  })
  
  // Calculate overlap amounts
  const overlapLeft = Math.max(0, slice.x - minX)
  const overlapTop = Math.max(0, slice.y - minY)
  const overlapRight = Math.max(0, maxX - (slice.x + slice.width))
  const overlapBottom = Math.max(0, maxY - (slice.y + slice.height))
  
  return {
    ...slice,
    extendedX: minX,
    extendedY: minY,
    extendedWidth: maxX - minX,
    extendedHeight: maxY - minY,
    overlap: {
      top: overlapTop,
      bottom: overlapBottom,
      left: overlapLeft,
      right: overlapRight,
    },
  }
}

/**
 * Generate page slices with smart hex overlap
 */
export function generateSlicesWithOverlap(
  imageWidth: number,
  imageHeight: number,
  printSettings: PrintSettings,
  cells: HexCell[],
  hexSize: number,
  hexOrientation: HexOrientation
): PageSlice[] {
  // Generate basic slices first (now orientation-aware)
  const basicSlices = generateBasicSlices(imageWidth, imageHeight, printSettings)
  
  // Calculate extended bounds for each slice
  return basicSlices.map(slice =>
    calculateOverlapBounds(slice, cells, hexSize, hexOrientation)
  )
}

/**
 * Calculate hex diagonal size in cm for display
 */
export function calculateDisplayHexSize(
  imageWidth: number,
  hexSize: number,
  pagesX: number,
  settings: PrintSettings
): number {
  const { orientation, marginMm, paperWidth, paperHeight } = settings
  
  // Get paper dimensions based on orientation
  const pageWidthMm = orientation === 'landscape' ? paperHeight : paperWidth
  
  // Subtract margins
  const printableWidthMm = pageWidthMm - (marginMm * 2)
  
  // Total print width
  const totalWidthMm = printableWidthMm * pagesX
  
  // Calculate hex diagonal in mm
  const hexDiagonalPx = hexSize * 2
  const mmPerPx = totalWidthMm / imageWidth
  const hexDiagonalMm = hexDiagonalPx * mmPerPx
  
  // Return in cm
  return hexDiagonalMm / 10
}

/**
 * Render a single page slice to a canvas
 */
export function renderSliceToCanvas(
  sourceCanvas: HTMLCanvasElement,
  slice: PageSlice,
  settings: PrintSettings,
  useExtendedBounds: boolean = true
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
  
  // Calculate margins in pixels
  const marginPx = (marginMm / 25.4) * dpi
  
  // Printable area
  const printableWidth = outputWidth - (marginPx * 2)
  const printableHeight = outputHeight - (marginPx * 2)
  
  // Source region (extended or basic)
  const srcX = useExtendedBounds ? slice.extendedX : slice.x
  const srcY = useExtendedBounds ? slice.extendedY : slice.y
  const srcWidth = useExtendedBounds ? slice.extendedWidth : slice.width
  const srcHeight = useExtendedBounds ? slice.extendedHeight : slice.height
  
  // Calculate scale to fit while maintaining aspect ratio
  const scaleX = printableWidth / srcWidth
  const scaleY = printableHeight / srcHeight
  const scale = Math.min(scaleX, scaleY)
  
  // Calculate destination size
  const destWidth = srcWidth * scale
  const destHeight = srcHeight * scale
  
  // Center in printable area
  const destX = marginPx + (printableWidth - destWidth) / 2
  const destY = marginPx + (printableHeight - destHeight) / 2
  
  // Draw the slice
  ctx.drawImage(
    sourceCanvas,
    srcX, srcY, srcWidth, srcHeight,
    destX, destY, destWidth, destHeight
  )
  
  return outputCanvas
}

/**
 * Calculate page dimensions for the given settings
 */
export function getPageDimensions(settings: PrintSettings): {
  widthPx: number
  heightPx: number
  printableWidthPx: number
  printableHeightPx: number
} {
  const { dpi, orientation, marginMm, paperWidth, paperHeight } = settings
  
  const pageWidthMm = orientation === 'landscape' ? paperHeight : paperWidth
  const pageHeightMm = orientation === 'landscape' ? paperWidth : paperHeight
  
  const widthPx = Math.round((pageWidthMm / 25.4) * dpi)
  const heightPx = Math.round((pageHeightMm / 25.4) * dpi)
  
  const marginPx = (marginMm / 25.4) * dpi
  const printableWidthPx = widthPx - (marginPx * 2)
  const printableHeightPx = heightPx - (marginPx * 2)
  
  return { widthPx, heightPx, printableWidthPx, printableHeightPx }
}
