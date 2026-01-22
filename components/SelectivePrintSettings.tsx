'use client'

import type { PageOrientation, SelectivePrintSettings } from '@/types'
import { useCallback, useMemo } from 'react'

interface SelectivePrintSettingsPanelProps {
  settings: SelectivePrintSettings
  onSettingsChange: (changes: Partial<SelectivePrintSettings>) => void
  selectedCount: number
}

export function SelectivePrintSettingsPanel({ 
  settings, 
  onSettingsChange, 
  selectedCount 
}: SelectivePrintSettingsPanelProps) {
  
  // Calculate tile layout
  const layoutInfo = useMemo(() => {
    const { tileSizeCm, tileMarginMm, marginMm, orientation, paperWidth, paperHeight } = settings
    
    // Get paper dimensions based on orientation
    const pageWidthMm = orientation === 'landscape' ? paperHeight : paperWidth
    const pageHeightMm = orientation === 'landscape' ? paperWidth : paperHeight
    
    // Printable area
    const printableWidthMm = pageWidthMm - (marginMm * 2)
    const printableHeightMm = pageHeightMm - (marginMm * 2)
    
    // Tile size in mm (converting from cm)
    const tileSizeMm = tileSizeCm * 10
    
    // Effective tile size including margin
    const effectiveTileSizeMm = tileSizeMm + tileMarginMm
    
    // Calculate how many tiles fit per row/column
    const tilesPerRow = Math.max(1, Math.floor((printableWidthMm + tileMarginMm) / effectiveTileSizeMm))
    const tilesPerCol = Math.max(1, Math.floor((printableHeightMm + tileMarginMm) / effectiveTileSizeMm))
    
    const tilesPerPage = tilesPerRow * tilesPerCol
    const totalPages = Math.ceil(selectedCount / tilesPerPage)
    
    return {
      tilesPerRow,
      tilesPerCol,
      tilesPerPage,
      totalPages,
      tileSizeMm,
    }
  }, [settings, selectedCount])

  // Handlers
  const handleTileSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value) && value > 0) {
      onSettingsChange({ tileSizeCm: value })
    }
  }, [onSettingsChange])

  const handleTileMarginChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ tileMarginMm: parseInt(e.target.value, 10) })
  }, [onSettingsChange])

  const handleMarginChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ marginMm: parseInt(e.target.value, 10) })
  }, [onSettingsChange])

  const handleOrientationChange = useCallback((orientation: PageOrientation) => {
    onSettingsChange({ orientation })
  }, [onSettingsChange])

  return (
    <div className="card p-4 space-y-4">
      <h2 className="section-header">Print Settings</h2>
      
      {/* Layout info */}
      <div className="p-3 bg-navy-dark/50 rounded-md space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-parchment/50">Paper Size</span>
          <span className="font-mono text-sm text-teal">A4</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-parchment/50">Selected Tiles</span>
          <span className="font-mono text-sm text-brass">{selectedCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-parchment/50">Tile Size</span>
          <span className="font-mono text-sm text-teal">{settings.tileSizeCm} cm</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-parchment/50">Tiles per Page</span>
          <span className="font-mono text-sm text-teal">
            {layoutInfo.tilesPerRow} × {layoutInfo.tilesPerCol} = {layoutInfo.tilesPerPage}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-parchment/50">Total Pages</span>
          <span className="font-mono text-sm text-brass">{layoutInfo.totalPages}</span>
        </div>
      </div>

      {/* Tile Size (cm) */}
      <div>
        <label className="label">
          Tile Size
          <span className="text-brass ml-2">{settings.tileSizeCm} cm</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={settings.tileSizeCm}
            onChange={handleTileSizeChange}
            className="slider flex-1"
          />
          <input
            type="number"
            min="0.5"
            max="20"
            step="0.1"
            value={settings.tileSizeCm}
            onChange={handleTileSizeChange}
            className="w-16 px-2 py-1 bg-navy-dark border border-teal/20 rounded font-mono text-sm text-parchment text-center"
          />
        </div>
        <p className="font-mono text-xs text-parchment/40 mt-1">
          Printed size of each hex tile
        </p>
      </div>

      {/* Page Orientation */}
      <div>
        <label className="label">Page Orientation</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleOrientationChange('portrait')}
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
            onClick={() => handleOrientationChange('landscape')}
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

      {/* Tile Margin */}
      <div>
        <label className="label">
          Tile Spacing
          <span className="text-brass ml-2">{settings.tileMarginMm}mm</span>
        </label>
        <input
          type="range"
          min="0"
          max="15"
          value={settings.tileMarginMm}
          onChange={handleTileMarginChange}
          className="slider"
        />
        <p className="font-mono text-xs text-parchment/40 mt-1">
          Space between individual hex tiles
        </p>
      </div>

      {/* Page Margin */}
      <div>
        <label className="label">
          Page Margin
          <span className="text-brass ml-2">{settings.marginMm}mm</span>
        </label>
        <input
          type="range"
          min="0"
          max="20"
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
