'use client'

import type { PageOrientation, PrintSettings, SliceMode } from '@/types';
import { useCallback, useMemo } from 'react';

type PrintUpdate = { type: 'print'; changes: Partial<PrintSettings> }

interface PrintSettingsPanelProps {
  settings: PrintSettings
  onSettingsChange: (update: PrintUpdate) => void
  imageWidth: number
  hexSize: number
  hexOrientation: 'pointy' | 'flat'
  totalHexes: number
}

export function PrintSettingsPanel({ settings, onSettingsChange, imageWidth, hexSize, hexOrientation, totalHexes }: PrintSettingsPanelProps) {
  // Print setting handlers
  const handlePagesXChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ type: 'print', changes: { pagesX: parseInt(e.target.value, 10) } })
  }, [onSettingsChange])

  const handlePagesYChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ type: 'print', changes: { pagesY: parseInt(e.target.value, 10) } })
  }, [onSettingsChange])

  const handlePageOrientationChange = useCallback((orientation: PageOrientation) => {
    onSettingsChange({ type: 'print', changes: { orientation } })
  }, [onSettingsChange])

  const handleMarginChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ type: 'print', changes: { marginMm: parseInt(e.target.value, 10) } })
  }, [onSettingsChange])

  const handleSliceModeChange = useCallback((sliceMode: SliceMode) => {
    onSettingsChange({ type: 'print', changes: { sliceMode } })
  }, [onSettingsChange])

  const handleTileMarginChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ type: 'print', changes: { tileMarginMm: parseInt(e.target.value, 10) } })
  }, [onSettingsChange])

  // Calculate hex size in cm
  const hexSizeCm = useMemo(() => {
    const pageWidthMm = settings.orientation === 'landscape' ? settings.paperHeight : settings.paperWidth
    const printableWidthMm = pageWidthMm - (settings.marginMm * 2)
    const totalWidthMm = printableWidthMm * settings.pagesX
    
    const hexDiagonalPx = hexSize * 2
    const mmPerPx = totalWidthMm / imageWidth
    const hexDiagonalMm = hexDiagonalPx * mmPerPx
    
    return (hexDiagonalMm / 10).toFixed(1)
  }, [hexSize, settings, imageWidth])


  return (
    <div className="card p-4 space-y-4">
      <h2 className="section-header">Print Settings</h2>
      
      {/* Paper info */}
      <div className="p-3 bg-navy-dark/50 rounded-md">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-xs text-parchment/50">Paper Size</span>
          <span className="font-mono text-sm text-teal">A4</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-parchment/50">Hex Diagonal</span>
          <span className="font-mono text-sm text-brass">~{hexSizeCm} cm</span>
        </div>
        {settings.sliceMode === 'tile' && (
          <>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono text-xs text-parchment/50">Total Tiles</span>
              <span className="font-mono text-sm text-teal">{totalHexes}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono text-xs text-parchment/50">Page Grid</span>
              <span className="font-mono text-sm text-brass">{settings.pagesX} × {settings.pagesY}</span>
            </div>
          </>
        )}
      </div>

      {/* Slice Mode */}
      <div>
        <label className="label">Slice Mode</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleSliceModeChange('region')}
            className={`flex-1 py-2 px-3 rounded-md font-mono text-sm transition-all ${
              settings.sliceMode === 'region'
                ? 'bg-brass text-navy-dark'
                : 'bg-navy-dark text-parchment/70 hover:text-parchment border border-teal/20'
            }`}
            aria-pressed={settings.sliceMode === 'region'}
          >
            <span className="flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="1" />
                <line x1="12" y1="3" x2="12" y2="21" />
                <line x1="3" y1="12" x2="21" y2="12" />
              </svg>
              Region
            </span>
          </button>
          <button
            onClick={() => handleSliceModeChange('tile')}
            className={`flex-1 py-2 px-3 rounded-md font-mono text-sm transition-all ${
              settings.sliceMode === 'tile'
                ? 'bg-brass text-navy-dark'
                : 'bg-navy-dark text-parchment/70 hover:text-parchment border border-teal/20'
            }`}
            aria-pressed={settings.sliceMode === 'tile'}
          >
            <span className="flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" fill="none" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Tile
            </span>
          </button>
        </div>
        <p className="font-mono text-xs text-parchment/40 mt-1">
          {settings.sliceMode === 'region' 
            ? 'Slice map into page-sized regions' 
            : 'Extract individual hex tiles onto pages'}
        </p>
      </div>

      {/* Page Orientation */}
      <div>
        <label className="label">Page Orientation</label>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageOrientationChange('portrait')}
            className={`flex-1 py-2 px-3 rounded-md font-mono text-sm transition-all ${
              settings.orientation === 'portrait'
                ? 'bg-brass text-navy-dark'
                : 'bg-navy-dark text-parchment/70 hover:text-parchment border border-teal/20'
            }`}
            aria-pressed={settings.orientation === 'portrait'}
          >
            <span className="flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="2" width="16" height="20" rx="1" />
              </svg>
              Portrait
            </span>
          </button>
          <button
            onClick={() => handlePageOrientationChange('landscape')}
            className={`flex-1 py-2 px-3 rounded-md font-mono text-sm transition-all ${
              settings.orientation === 'landscape'
                ? 'bg-brass text-navy-dark'
                : 'bg-navy-dark text-parchment/70 hover:text-parchment border border-teal/20'
            }`}
            aria-pressed={settings.orientation === 'landscape'}
          >
            <span className="flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" className="w-5 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="1" />
              </svg>
              Landscape
            </span>
          </button>
        </div>
      </div>

      {/* Pages Grid - shown in both region and tile mode (for spatial layout) */}
      <div>
        <label className="label">
          Pages
          <span className="text-brass ml-2">{settings.pagesX} × {settings.pagesY} = {settings.pagesX * settings.pagesY}</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label text-xs">Columns</label>
            <input
              type="range"
              min="1"
              max="10"
              value={settings.pagesX}
              onChange={handlePagesXChange}
              className="slider"
            />
          </div>
          <div>
            <label className="label text-xs">Rows</label>
            <input
              type="range"
              min="1"
              max="10"
              value={settings.pagesY}
              onChange={handlePagesYChange}
              className="slider"
            />
          </div>
        </div>
        {settings.sliceMode === 'tile' && (
          <p className="font-mono text-xs text-parchment/40 mt-1">
            Tiles arranged spatially to preserve map shape
          </p>
        )}
      </div>

      {/* Tile Margin - only shown in tile mode */}
      {settings.sliceMode === 'tile' && (
        <div>
          <label className="label">
            Tile Spacing
            <span className="text-brass ml-2">{settings.tileMarginMm}mm</span>
          </label>
          <input
            type="range"
            min="1"
            max="15"
            value={settings.tileMarginMm}
            onChange={handleTileMarginChange}
            className="slider"
          />
          <p className="font-mono text-xs text-parchment/40 mt-1">
            Space between individual hex tiles
          </p>
        </div>
      )}

      {/* Margin */}
      <div>
        <label className="label">
          Print Margin
          <span className="text-brass ml-2">{settings.marginMm}mm</span>
        </label>
        <input
          type="range"
          min="0"
          max="20"
          step="1"
          value={settings.marginMm}
          onChange={handleMarginChange}
          className="slider"
        />
      </div>

      {/* DPI info */}
      <div className="pt-2 border-t border-teal/10">
        <p className="font-mono text-xs text-parchment/40 text-center">
          Output at {settings.dpi} DPI for print quality
        </p>
      </div>
    </div>
  )
}
