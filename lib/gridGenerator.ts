import type { HexCell, HexOrientation, NumberingMode } from '@/types'
import { generateHexGrid, getHexDimensions } from './hexMath'

/**
 * Grid Generator
 * 
 * Creates labeled hex grids with various numbering schemes
 */

/**
 * Convert a number to column letter (A, B, C, ... Z, AA, AB, ...)
 */
function numberToColumnLetter(num: number): string {
  let result = ''
  let n = num
  
  while (n >= 0) {
    result = String.fromCharCode(65 + (n % 26)) + result
    n = Math.floor(n / 26) - 1
  }
  
  return result
}

/**
 * Generate a label for a hex cell based on numbering mode
 */
function generateLabel(
  index: number,
  q: number,
  r: number,
  row: number,
  col: number,
  totalCount: number,
  mode: NumberingMode
): string {
  switch (mode) {
    case 'sequential':
      return String(index + 1)
    
    case 'padded': {
      // Calculate padding width based on total count
      const padWidth = Math.max(4, String(totalCount).length)
      return String(index + 1).padStart(padWidth, '0')
    }
    
    case 'alphaCoord': {
      // Use column letter + row number (A1, B2, etc.)
      const colLetter = numberToColumnLetter(col)
      return `${colLetter}${row + 1}`
    }
    
    case 'axialCoord': {
      // Use axial coordinates (q,r)
      return `${q},${r}`
    }
    
    default:
      return String(index + 1)
  }
}

/**
 * Generate a complete hex grid with labels
 */
export function generateLabeledHexGrid(
  width: number,
  height: number,
  hexSize: number,
  orientation: HexOrientation,
  numberingMode: NumberingMode,
  offsetX: number = 0,
  offsetY: number = 0
): HexCell[] {
  // Generate base grid
  const cells = generateHexGrid(
    width,
    height,
    hexSize,
    orientation,
    offsetX,
    offsetY
  )
  
  // Get dimensions for row/col calculation
  const dims = getHexDimensions(hexSize, orientation)
  
  // Assign row/col indices for alpha-coord numbering
  const cellsWithRowCol = cells.map(cell => {
    const row = Math.round(cell.centerY / (dims.verticalSpacing || 1))
    const col = Math.round(cell.centerX / (dims.horizontalSpacing || 1))
    return { cell, row, col }
  })
  
  // Normalize row/col to start from 0
  const minRow = Math.min(...cellsWithRowCol.map(c => c.row))
  const minCol = Math.min(...cellsWithRowCol.map(c => c.col))
  
  // Apply labels
  const totalCount = cells.length
  
  cellsWithRowCol.forEach(({ cell, row, col }, index) => {
    const normalizedRow = row - minRow
    const normalizedCol = col - minCol
    
    cell.label = generateLabel(
      index,
      cell.q,
      cell.r,
      normalizedRow,
      normalizedCol,
      totalCount,
      numberingMode
    )
  })
  
  return cells
}

/**
 * Filter grid to only include cells within a specific rectangular region
 */
export function filterGridToRegion(
  cells: HexCell[],
  x: number,
  y: number,
  width: number,
  height: number,
  hexSize: number,
  includePartial: boolean = true
): HexCell[] {
  const margin = includePartial ? hexSize : 0
  
  return cells.filter(cell => {
    return (
      cell.centerX >= x - margin &&
      cell.centerX <= x + width + margin &&
      cell.centerY >= y - margin &&
      cell.centerY <= y + height + margin
    )
  })
}

/**
 * Get cells that are on page boundaries (need overlap)
 */
export function getCellsOnBoundaries(
  cells: HexCell[],
  boundaries: { x?: number; y?: number }[],
  hexSize: number
): HexCell[] {
  const threshold = hexSize * 1.5 // Cells within this distance of a boundary
  
  return cells.filter(cell => {
    for (const boundary of boundaries) {
      if (boundary.x !== undefined && Math.abs(cell.centerX - boundary.x) < threshold) {
        return true
      }
      if (boundary.y !== undefined && Math.abs(cell.centerY - boundary.y) < threshold) {
        return true
      }
    }
    return false
  })
}

/**
 * Calculate grid statistics
 */
export function getGridStats(
  cells: HexCell[],
  hexSize: number,
  orientation: HexOrientation
): {
  totalCells: number
  columns: number
  rows: number
  hexDiagonalPx: number
} {
  if (cells.length === 0) {
    return {
      totalCells: 0,
      columns: 0,
      rows: 0,
      hexDiagonalPx: hexSize * 2,
    }
  }
  
  const dims = getHexDimensions(hexSize, orientation)
  
  // Calculate unique rows and columns
  const rowSet = new Set<number>()
  const colSet = new Set<number>()
  
  cells.forEach(cell => {
    const row = Math.round(cell.centerY / (dims.verticalSpacing || 1))
    const col = Math.round(cell.centerX / (dims.horizontalSpacing || 1))
    rowSet.add(row)
    colSet.add(col)
  })
  
  return {
    totalCells: cells.length,
    columns: colSet.size,
    rows: rowSet.size,
    hexDiagonalPx: hexSize * 2,
  }
}

/**
 * Re-number an existing grid with a new numbering mode
 */
export function renumberGrid(
  cells: HexCell[],
  numberingMode: NumberingMode,
  hexSize: number,
  orientation: HexOrientation
): HexCell[] {
  const dims = getHexDimensions(hexSize, orientation)
  
  // Calculate row/col for each cell
  const cellsWithRowCol = cells.map(cell => {
    const row = Math.round(cell.centerY / (dims.verticalSpacing || 1))
    const col = Math.round(cell.centerX / (dims.horizontalSpacing || 1))
    return { cell: { ...cell }, row, col }
  })
  
  // Normalize row/col
  const minRow = Math.min(...cellsWithRowCol.map(c => c.row))
  const minCol = Math.min(...cellsWithRowCol.map(c => c.col))
  
  // Apply new labels
  const totalCount = cells.length
  
  return cellsWithRowCol.map(({ cell, row, col }, index) => {
    const normalizedRow = row - minRow
    const normalizedCol = col - minCol
    
    return {
      ...cell,
      label: generateLabel(
        index,
        cell.q,
        cell.r,
        normalizedRow,
        normalizedCol,
        totalCount,
        numberingMode
      ),
    }
  })
}
