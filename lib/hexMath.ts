import type { HexOrientation, Point, HexCell } from '@/types'

/**
 * Hex Math Library
 * 
 * Implements hex grid calculations for both orientations:
 * - Pointy-top: vertex points up/down
 * - Flat-top: edge is horizontal at top/bottom
 * 
 * Uses axial coordinate system (q, r) internally
 */

// Hex orientation constants
const SQRT3 = Math.sqrt(3)

/**
 * Get the dimensions of a hex based on size (center to corner distance)
 */
export function getHexDimensions(size: number, orientation: HexOrientation) {
  if (orientation === 'pointy') {
    // Pointy-top hex
    return {
      width: SQRT3 * size,      // horizontal span
      height: 2 * size,          // vertical span
      horizontalSpacing: SQRT3 * size,
      verticalSpacing: 1.5 * size,
    }
  } else {
    // Flat-top hex
    return {
      width: 2 * size,           // horizontal span
      height: SQRT3 * size,      // vertical span
      horizontalSpacing: 1.5 * size,
      verticalSpacing: SQRT3 * size,
    }
  }
}

/**
 * Get the center point of a hex given axial coordinates
 */
export function hexToPixel(
  q: number,
  r: number,
  size: number,
  orientation: HexOrientation,
  offsetX: number = 0,
  offsetY: number = 0
): Point {
  let x: number, y: number
  
  if (orientation === 'pointy') {
    x = size * (SQRT3 * q + (SQRT3 / 2) * r)
    y = size * (1.5 * r)
  } else {
    x = size * (1.5 * q)
    y = size * (SQRT3 / 2 * q + SQRT3 * r)
  }
  
  return {
    x: x + offsetX,
    y: y + offsetY,
  }
}

/**
 * Get axial coordinates from pixel position
 */
export function pixelToHex(
  px: number,
  py: number,
  size: number,
  orientation: HexOrientation,
  offsetX: number = 0,
  offsetY: number = 0
): { q: number; r: number } {
  const x = px - offsetX
  const y = py - offsetY
  
  let q: number, r: number
  
  if (orientation === 'pointy') {
    q = (SQRT3 / 3 * x - 1 / 3 * y) / size
    r = (2 / 3 * y) / size
  } else {
    q = (2 / 3 * x) / size
    r = (-1 / 3 * x + SQRT3 / 3 * y) / size
  }
  
  return hexRound(q, r)
}

/**
 * Round fractional axial coordinates to nearest hex
 */
export function hexRound(q: number, r: number): { q: number; r: number } {
  const s = -q - r
  
  let rq = Math.round(q)
  let rr = Math.round(r)
  let rs = Math.round(s)
  
  const qDiff = Math.abs(rq - q)
  const rDiff = Math.abs(rr - r)
  const sDiff = Math.abs(rs - s)
  
  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs
  } else if (rDiff > sDiff) {
    rr = -rq - rs
  }
  
  return { q: rq, r: rr }
}

/**
 * Get the 6 corner vertices of a hex
 */
export function getHexVertices(
  centerX: number,
  centerY: number,
  size: number,
  orientation: HexOrientation
): Point[] {
  const vertices: Point[] = []
  const startAngle = orientation === 'pointy' ? 30 : 0
  
  for (let i = 0; i < 6; i++) {
    const angle = ((60 * i + startAngle) * Math.PI) / 180
    vertices.push({
      x: centerX + size * Math.cos(angle),
      y: centerY + size * Math.sin(angle),
    })
  }
  
  return vertices
}

/**
 * Calculate how many hexes fit in a given width/height
 */
export function calculateHexCount(
  width: number,
  height: number,
  size: number,
  orientation: HexOrientation
): { cols: number; rows: number } {
  const dims = getHexDimensions(size, orientation)
  
  // Account for offset rows/columns
  const cols = Math.ceil(width / dims.horizontalSpacing) + 1
  const rows = Math.ceil(height / dims.verticalSpacing) + 1
  
  return { cols, rows }
}

/**
 * Generate all hex cells that cover a given area
 */
export function generateHexGrid(
  width: number,
  height: number,
  size: number,
  orientation: HexOrientation,
  offsetX: number = 0,
  offsetY: number = 0
): HexCell[] {
  const cells: HexCell[] = []
  const dims = getHexDimensions(size, orientation)
  
  // Calculate bounds with extra margin for edge hexes
  const margin = size * 2
  const minX = -margin
  const minY = -margin
  const maxX = width + margin
  const maxY = height + margin
  
  // Determine range of axial coordinates to cover the area
  // We'll iterate over a larger range to ensure full coverage
  const range = Math.max(
    Math.ceil(maxX / dims.horizontalSpacing),
    Math.ceil(maxY / dims.verticalSpacing)
  ) + 5
  
  let index = 0
  
  for (let q = -range; q <= range; q++) {
    for (let r = -range; r <= range; r++) {
      const center = hexToPixel(q, r, size, orientation, offsetX, offsetY)
      
      // Check if hex center is within visible bounds (with margin)
      if (
        center.x >= minX &&
        center.x <= maxX &&
        center.y >= minY &&
        center.y <= maxY
      ) {
        const vertices = getHexVertices(center.x, center.y, size, orientation)
        
        cells.push({
          q,
          r,
          centerX: center.x,
          centerY: center.y,
          vertices,
          label: '', // Will be set by grid generator
        })
        index++
      }
    }
  }
  
  // Sort cells for consistent numbering (top-to-bottom, left-to-right)
  cells.sort((a, b) => {
    const rowA = Math.round(a.centerY / (dims.verticalSpacing || 1))
    const rowB = Math.round(b.centerY / (dims.verticalSpacing || 1))
    
    if (rowA !== rowB) return rowA - rowB
    return a.centerX - b.centerX
  })
  
  return cells
}

/**
 * Calculate the diagonal size of a hex in real-world units
 */
export function calculateHexDiagonalCm(
  imageWidth: number,
  totalPrintWidthMm: number,
  hexSizePx: number
): number {
  // hex diagonal = 2 * size
  const diagonalPx = hexSizePx * 2
  const mmPerPx = totalPrintWidthMm / imageWidth
  const diagonalMm = diagonalPx * mmPerPx
  return diagonalMm / 10 // Convert to cm
}

/**
 * Calculate hex size needed for a target diagonal in cm
 */
export function calculateHexSizeFromDiagonal(
  imageWidth: number,
  totalPrintWidthMm: number,
  targetDiagonalCm: number
): number {
  const targetDiagonalMm = targetDiagonalCm * 10
  const mmPerPx = totalPrintWidthMm / imageWidth
  const diagonalPx = targetDiagonalMm / mmPerPx
  return diagonalPx / 2 // hex size = diagonal / 2
}

/**
 * Get the bounding box of a hex
 */
export function getHexBoundingBox(
  centerX: number,
  centerY: number,
  size: number,
  orientation: HexOrientation
): { x: number; y: number; width: number; height: number } {
  const dims = getHexDimensions(size, orientation)
  
  return {
    x: centerX - dims.width / 2,
    y: centerY - dims.height / 2,
    width: dims.width,
    height: dims.height,
  }
}

/**
 * Check if a hex overlaps with a rectangular region
 */
export function hexOverlapsRect(
  cell: HexCell,
  size: number,
  orientation: HexOrientation,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number
): boolean {
  const bbox = getHexBoundingBox(cell.centerX, cell.centerY, size, orientation)
  
  // Simple AABB overlap check
  return !(
    bbox.x + bbox.width < rectX ||
    bbox.x > rectX + rectWidth ||
    bbox.y + bbox.height < rectY ||
    bbox.y > rectY + rectHeight
  )
}

/**
 * Check if a hex center is near a page boundary
 */
export function isHexOnBoundary(
  cell: HexCell,
  size: number,
  boundaries: { x: number; y: number }[]
): boolean {
  const threshold = size * 1.2 // Slightly larger than hex radius
  
  for (const boundary of boundaries) {
    if (
      Math.abs(cell.centerX - boundary.x) < threshold ||
      Math.abs(cell.centerY - boundary.y) < threshold
    ) {
      return true
    }
  }
  
  return false
}
