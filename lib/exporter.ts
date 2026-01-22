import type { HexCell, HexGridSettings, HexOrientation, PageSlice, PrintSettings, TilePage } from '@/types'
import { renderTilePage } from './tileSlicer'

/**
 * Render a slice to a high-resolution canvas for export
 */
export function renderSliceForExport(
  sourceCanvas: HTMLCanvasElement,
  slice: PageSlice,
  settings: PrintSettings
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
  
  // Draw the slice
  ctx.drawImage(
    sourceCanvas,
    slice.extendedX, slice.extendedY, slice.extendedWidth, slice.extendedHeight,
    destX, destY, destWidth, destHeight
  )

  return outputCanvas
}

/**
 * Export all slices to a single PDF using dynamic import
 */
export async function exportToPDF(
  sourceCanvas: HTMLCanvasElement,
  slices: PageSlice[],
  settings: PrintSettings,
  filename: string = 'hex-map.pdf'
): Promise<void> {
  // Dynamic import jsPDF
  const { jsPDF } = await import('jspdf')
  
  const { orientation, paperWidth, paperHeight } = settings
  
  // Create PDF with correct orientation
  const pdf = new jsPDF({
    orientation: orientation === 'landscape' ? 'l' : 'p',
    unit: 'mm',
    format: [paperWidth, paperHeight],
  })
  
  // Render each slice to PDF
  for (let i = 0; i < slices.length; i++) {
    if (i > 0) {
      pdf.addPage()
    }
    
    const slice = slices[i]
    const canvas = renderSliceForExport(sourceCanvas, slice, settings)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
    
    // Add image to PDF (full page)
    const pageWidth = orientation === 'landscape' ? paperHeight : paperWidth
    const pageHeight = orientation === 'landscape' ? paperWidth : paperHeight
    
    pdf.addImage(dataUrl, 'JPEG', 0, 0, pageWidth, pageHeight)
  }
  
  // Save PDF
  pdf.save(filename)
}

/**
 * Export a single page as PNG
 */
export function exportPageAsPNG(
  sourceCanvas: HTMLCanvasElement,
  slice: PageSlice,
  settings: PrintSettings,
  filename?: string
): void {
  const canvas = renderSliceForExport(sourceCanvas, slice, settings)
  const dataUrl = canvas.toDataURL('image/png')
  
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename || `hex-map-page-${slice.col + 1}-${slice.row + 1}.png`
  link.click()
}

/**
 * Export all pages as a ZIP of PNGs using dynamic import
 */
export async function exportAllAsPNGs(
  sourceCanvas: HTMLCanvasElement,
  slices: PageSlice[],
  settings: PrintSettings,
  filename: string = 'hex-map-pages.zip'
): Promise<void> {
  // Dynamic import JSZip
  const JSZip = (await import('jszip')).default
  
  const zip = new JSZip()
  
  // Render each slice and add to ZIP
  for (const slice of slices) {
    const canvas = renderSliceForExport(sourceCanvas, slice, settings)
    
    // Convert to blob
    const dataUrl = canvas.toDataURL('image/png')
    const base64 = dataUrl.split(',')[1]
    
    const pageName = `page-${String(slice.col + 1).padStart(2, '0')}-${String(slice.row + 1).padStart(2, '0')}.png`
    zip.file(pageName, base64, { base64: true })
  }
  
  // Generate and download ZIP
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  
  // Cleanup
  URL.revokeObjectURL(url)
}

/**
 * Get estimated file sizes for display
 */
export function estimateFileSizes(
  sliceCount: number,
  settings: PrintSettings
): { pdfMb: string; pngMb: string; zipMb: string } {
  const { dpi, orientation, paperWidth, paperHeight } = settings
  
  // Estimate pixels per page
  const pageWidthMm = orientation === 'landscape' ? paperHeight : paperWidth
  const pageHeightMm = orientation === 'landscape' ? paperWidth : paperHeight
  
  const pixelsPerPage = Math.round((pageWidthMm / 25.4) * dpi) * Math.round((pageHeightMm / 25.4) * dpi)
  
  // Rough estimates (very approximate)
  const jpegBytesPerPixel = 0.3 // JPEG compression
  const pngBytesPerPixel = 0.5 // PNG with some compression
  
  const pdfBytes = sliceCount * pixelsPerPage * jpegBytesPerPixel
  const pngBytes = pixelsPerPage * pngBytesPerPixel
  const zipBytes = sliceCount * pixelsPerPage * pngBytesPerPixel * 0.9 // ZIP adds some compression
  
  return {
    pdfMb: (pdfBytes / (1024 * 1024)).toFixed(1),
    pngMb: (pngBytes / (1024 * 1024)).toFixed(1),
    zipMb: (zipBytes / (1024 * 1024)).toFixed(1),
  }
}

// ============================================
// Tile Mode Export Functions
// ============================================

/**
 * Export all tile pages to a single PDF
 */
export async function exportTilePagesToPDF(
  sourceCanvas: HTMLCanvasElement,
  tilePages: TilePage[],
  hexSize: number,
  hexOrientation: HexOrientation,
  printSettings: PrintSettings,
  gridSettings: {
    showLines: boolean
    lineColor: string
    lineOpacity: number
    showNumbers: boolean
    numberColor: string
    numberOpacity: number
  },
  filename: string = 'hex-tiles.pdf'
): Promise<void> {
  // Dynamic import jsPDF
  const { jsPDF } = await import('jspdf')
  
  const { orientation, paperWidth, paperHeight } = printSettings
  
  // Create PDF with correct orientation
  const pdf = new jsPDF({
    orientation: orientation === 'landscape' ? 'l' : 'p',
    unit: 'mm',
    format: [paperWidth, paperHeight],
  })
  
  // Render each tile page to PDF
  for (let i = 0; i < tilePages.length; i++) {
    if (i > 0) {
      pdf.addPage()
    }
    
    const page = tilePages[i]
    const canvas = renderTilePage(
      sourceCanvas,
      page,
      hexSize,
      hexOrientation,
      printSettings,
      gridSettings
    )
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
    
    // Add image to PDF (full page)
    const pageWidth = orientation === 'landscape' ? paperHeight : paperWidth
    const pageHeight = orientation === 'landscape' ? paperWidth : paperHeight
    
    pdf.addImage(dataUrl, 'JPEG', 0, 0, pageWidth, pageHeight)
  }
  
  // Save PDF
  pdf.save(filename)
}

/**
 * Export all tile pages as a ZIP of PNGs
 */
export async function exportTilePagesAsZip(
  sourceCanvas: HTMLCanvasElement,
  tilePages: TilePage[],
  hexSize: number,
  hexOrientation: HexOrientation,
  printSettings: PrintSettings,
  gridSettings: {
    showLines: boolean
    lineColor: string
    lineOpacity: number
    showNumbers: boolean
    numberColor: string
    numberOpacity: number
  },
  filename: string = 'hex-tiles.zip'
): Promise<void> {
  // Dynamic import JSZip
  const JSZip = (await import('jszip')).default
  
  const zip = new JSZip()
  
  // Render each tile page and add to ZIP
  for (const page of tilePages) {
    const canvas = renderTilePage(
      sourceCanvas,
      page,
      hexSize,
      hexOrientation,
      printSettings,
      gridSettings
    )
    
    // Convert to blob
    const dataUrl = canvas.toDataURL('image/png')
    const base64 = dataUrl.split(',')[1]
    
    const pageName = `tile-page-${String(page.pageIndex + 1).padStart(2, '0')}.png`
    zip.file(pageName, base64, { base64: true })
  }
  
  // Generate and download ZIP
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  
  // Cleanup
  URL.revokeObjectURL(url)
}
