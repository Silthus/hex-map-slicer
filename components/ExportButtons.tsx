'use client'

import { useState, useCallback } from 'react'
import type { UploadedImage, HexSettings, PageSlice, SpatialTilePage, HexCell } from '@/types'
import { exportToPDF, exportAllAsPNGs, estimateFileSizes, exportTilePagesToPDF, exportTilePagesAsZip } from '@/lib/exporter'

interface ExportButtonsProps {
  image: UploadedImage
  settings: HexSettings
  slices: PageSlice[]
  tilePages: SpatialTilePage[]
  hexCells: HexCell[]
  sourceCanvas: HTMLCanvasElement | null
}

export function ExportButtons({ image, settings, slices, tilePages, hexCells, sourceCanvas }: ExportButtonsProps) {
  const [isPdfExporting, setIsPdfExporting] = useState(false)
  const [isZipExporting, setIsZipExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isRegionMode = settings.print.sliceMode === 'region'
  const pageCount = isRegionMode ? slices.length : tilePages.length

  // Get file size estimates
  const estimates = estimateFileSizes(pageCount, settings.print)

  // Handle PDF export
  const handlePdfExport = useCallback(async () => {
    if (!sourceCanvas) return
    
    setIsPdfExporting(true)
    setError(null)
    
    try {
      if (isRegionMode) {
        await exportToPDF(
          sourceCanvas,
          slices,
          settings.print,
          `${image.name.replace(/\.[^/.]+$/, '')}-hex-map.pdf`
        )
      } else {
        await exportTilePagesToPDF(
          sourceCanvas,
          tilePages,
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
          },
          `${image.name.replace(/\.[^/.]+$/, '')}-hex-tiles.pdf`
        )
      }
    } catch (err) {
      setError('Failed to export PDF. Please try again.')
      console.error('PDF export error:', err)
    } finally {
      setIsPdfExporting(false)
    }
  }, [sourceCanvas, slices, tilePages, settings, image.name, isRegionMode])

  // Handle ZIP export
  const handleZipExport = useCallback(async () => {
    if (!sourceCanvas) return
    
    setIsZipExporting(true)
    setError(null)
    
    try {
      if (isRegionMode) {
        await exportAllAsPNGs(
          sourceCanvas,
          slices,
          settings.print,
          `${image.name.replace(/\.[^/.]+$/, '')}-hex-pages.zip`
        )
      } else {
        await exportTilePagesAsZip(
          sourceCanvas,
          tilePages,
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
          },
          `${image.name.replace(/\.[^/.]+$/, '')}-hex-tiles.zip`
        )
      }
    } catch (err) {
      setError('Failed to export ZIP. Please try again.')
      console.error('ZIP export error:', err)
    } finally {
      setIsZipExporting(false)
    }
  }, [sourceCanvas, slices, tilePages, settings, image.name, isRegionMode])

  const isDisabled = !sourceCanvas || pageCount === 0

  return (
    <div className="space-y-4">
      {/* Export buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* PDF Export */}
        <button
          onClick={handlePdfExport}
          disabled={isDisabled || isPdfExporting}
          className={`
            btn-primary flex-1 flex items-center justify-center gap-2 py-3
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          aria-label={`Export all ${pageCount} pages as PDF`}
        >
          {isPdfExporting ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Export PDF</span>
              <span className="text-xs opacity-70">~{estimates.pdfMb}MB</span>
            </>
          )}
        </button>

        {/* ZIP Export */}
        <button
          onClick={handleZipExport}
          disabled={isDisabled || isZipExporting}
          className={`
            btn-secondary flex-1 flex items-center justify-center gap-2 py-3
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          aria-label={`Download all ${pageCount} pages as PNG files in a ZIP`}
        >
          {isZipExporting ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span>Creating ZIP...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Download All PNGs</span>
              <span className="text-xs opacity-70">~{estimates.zipMb}MB</span>
            </>
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-md p-3">
          <p className="font-mono text-sm text-red-300 text-center">{error}</p>
        </div>
      )}

      {/* Export info */}
      <div className="text-center">
        <p className="font-mono text-xs text-parchment/40">
          Exports at {settings.print.dpi} DPI for print quality
        </p>
        <p className="font-mono text-xs text-parchment/30 mt-1">
          Click any page tile above to download a single page
        </p>
      </div>
    </div>
  )
}
