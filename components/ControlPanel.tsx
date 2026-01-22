'use client'

import { useCallback, useMemo } from 'react'
import type { HexSettings, HexOrientation, NumberingMode, PageOrientation, HexGridSettings, PrintSettings, NumberFontStyle, NumberPosition } from '@/types'

type SettingsUpdate = 
  | { type: 'grid'; changes: Partial<HexGridSettings> }
  | { type: 'print'; changes: Partial<PrintSettings> }
  | { type: 'full'; settings: HexSettings }

interface ControlPanelProps {
  settings: HexSettings
  onSettingsChange: (update: SettingsUpdate) => void
  hasImage: boolean
}

export function ControlPanel({ settings, onSettingsChange, hasImage }: ControlPanelProps) {
  const { grid, print } = settings

  // Grid setting handlers
  const handleOrientationChange = useCallback((orientation: HexOrientation) => {
    onSettingsChange({ type: 'grid', changes: { orientation } })
  }, [onSettingsChange])

  const handleLineColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ type: 'grid', changes: { lineColor: e.target.value } })
  }, [onSettingsChange])

  const handleLineOpacityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ type: 'grid', changes: { lineOpacity: parseInt(e.target.value, 10) } })
  }, [onSettingsChange])

  const handleNumberColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ type: 'grid', changes: { numberColor: e.target.value } })
  }, [onSettingsChange])

  const handleNumberOpacityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ type: 'grid', changes: { numberOpacity: parseInt(e.target.value, 10) } })
  }, [onSettingsChange])

  const handleShowLinesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ type: 'grid', changes: { showLines: e.target.checked } })
  }, [onSettingsChange])

  const handleShowNumbersChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ type: 'grid', changes: { showNumbers: e.target.checked } })
  }, [onSettingsChange])

  const handleNumberingModeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingsChange({ type: 'grid', changes: { numberingMode: e.target.value as NumberingMode } })
  }, [onSettingsChange])

  const handleHexSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ type: 'grid', changes: { hexSize: parseInt(e.target.value, 10) } })
  }, [onSettingsChange])

  const handleNumberFontSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ type: 'grid', changes: { numberFontSize: parseFloat(e.target.value) } })
  }, [onSettingsChange])

  const handleNumberFontStyleChange = useCallback((style: NumberFontStyle) => {
    onSettingsChange({ type: 'grid', changes: { numberFontStyle: style } })
  }, [onSettingsChange])

  const handleNumberPositionChange = useCallback((position: NumberPosition) => {
    onSettingsChange({ type: 'grid', changes: { numberPosition: position } })
  }, [onSettingsChange])

  const handleNumberOffsetXChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ type: 'grid', changes: { numberOffsetX: parseInt(e.target.value, 10) } })
  }, [onSettingsChange])

  const handleNumberOffsetYChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ type: 'grid', changes: { numberOffsetY: parseInt(e.target.value, 10) } })
  }, [onSettingsChange])

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

  // Calculate hex size in cm
  const hexSizeCm = useMemo(() => {
    const pageWidthMm = print.orientation === 'landscape' ? print.paperHeight : print.paperWidth
    const printableWidthMm = pageWidthMm - (print.marginMm * 2)
    const totalWidthMm = printableWidthMm * print.pagesX
    
    // Assume 1000px image width as baseline
    const baseImageWidth = 1000
    const hexDiagonalPx = grid.hexSize * 2
    const mmPerPx = totalWidthMm / baseImageWidth
    const hexDiagonalMm = hexDiagonalPx * mmPerPx
    
    return (hexDiagonalMm / 10).toFixed(1)
  }, [grid.hexSize, print])

  return (
    <div className="space-y-6">
      {/* Grid Settings */}
      <section className="card p-4">
        <h2 className="section-header">Grid</h2>
        
        {/* Orientation */}
        <div className="mb-4">
          <label className="label">Hex Orientation</label>
          <div className="flex gap-2">
            <button
              onClick={() => handleOrientationChange('pointy')}
              className={`flex-1 py-2 px-3 rounded-md font-mono text-sm transition-all ${
                grid.orientation === 'pointy'
                  ? 'bg-brass text-navy-dark'
                  : 'bg-navy-dark text-parchment/70 hover:text-parchment border border-teal/20'
              }`}
              aria-pressed={grid.orientation === 'pointy'}
            >
              <span className="flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" />
                </svg>
                Pointy
              </span>
            </button>
            <button
              onClick={() => handleOrientationChange('flat')}
              className={`flex-1 py-2 px-3 rounded-md font-mono text-sm transition-all ${
                grid.orientation === 'flat'
                  ? 'bg-brass text-navy-dark'
                  : 'bg-navy-dark text-parchment/70 hover:text-parchment border border-teal/20'
              }`}
              aria-pressed={grid.orientation === 'flat'}
            >
              <span className="flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5 rotate-90" fill="currentColor">
                  <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" />
                </svg>
                Flat
              </span>
            </button>
          </div>
        </div>

        {/* Hex Size */}
        <div className="mb-4">
          <label className="label">
            Hex Size
            <span className="text-brass ml-2">{grid.hexSize}px</span>
          </label>
          <input
            type="range"
            min="20"
            max="200"
            value={grid.hexSize}
            onChange={handleHexSizeChange}
            className="slider"
          />
        </div>

        {/* Line Settings */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={grid.showLines}
                onChange={handleShowLinesChange}
                className="checkbox"
              />
              <span className="font-mono text-sm text-parchment/70">Show Grid Lines</span>
            </label>
          </div>
          
          {grid.showLines && (
            <div className="pl-6 space-y-3">
              <div className="flex items-center gap-3">
                <label className="label mb-0 min-w-[60px]">Color</label>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="color"
                    value={grid.lineColor}
                    onChange={handleLineColorChange}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={grid.lineColor}
                    onChange={handleLineColorChange}
                    className="input flex-1"
                    maxLength={7}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="label mb-0 min-w-[60px]">Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={grid.lineOpacity}
                  onChange={handleLineOpacityChange}
                  className="slider flex-1"
                />
                <span className="font-mono text-xs text-parchment/50 w-10 text-right">
                  {grid.lineOpacity}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Number Settings */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={grid.showNumbers}
                onChange={handleShowNumbersChange}
                className="checkbox"
              />
              <span className="font-mono text-sm text-parchment/70">Show Numbers</span>
            </label>
          </div>
          
          {grid.showNumbers && (
            <div className="pl-6 space-y-3">
              <div>
                <label className="label">Format</label>
                <select
                  value={grid.numberingMode}
                  onChange={handleNumberingModeChange}
                  className="select"
                >
                  <option value="sequential">Sequential (1, 2, 3...)</option>
                  <option value="padded">Coordinates (0102, 0305...)</option>
                  <option value="alphaCoord">Alpha Coords (A1, B2...)</option>
                  <option value="axialCoord">Axial Coords (0,0 / 1,0...)</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="label mb-0 min-w-[60px]">Color</label>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="color"
                    value={grid.numberColor}
                    onChange={handleNumberColorChange}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={grid.numberColor}
                    onChange={handleNumberColorChange}
                    className="input flex-1"
                    maxLength={7}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="label mb-0 min-w-[60px]">Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={grid.numberOpacity}
                  onChange={handleNumberOpacityChange}
                  className="slider flex-1"
                />
                <span className="font-mono text-xs text-parchment/50 w-10 text-right">
                  {grid.numberOpacity}%
                </span>
              </div>

              {/* Font Size */}
              <div className="flex items-center gap-3">
                <label className="label mb-0 min-w-[60px]">Size</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={grid.numberFontSize}
                  onChange={handleNumberFontSizeChange}
                  className="slider flex-1"
                />
                <span className="font-mono text-xs text-parchment/50 w-10 text-right">
                  {grid.numberFontSize.toFixed(1)}x
                </span>
              </div>

              {/* Font Style */}
              <div>
                <label className="label">Style</label>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    onClick={() => handleNumberFontStyleChange('normal')}
                    className={`py-1.5 px-2 rounded text-xs font-mono transition-all ${
                      grid.numberFontStyle === 'normal'
                        ? 'bg-brass text-navy-dark'
                        : 'bg-navy-dark text-parchment/70 hover:text-parchment border border-teal/20'
                    }`}
                    aria-pressed={grid.numberFontStyle === 'normal'}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => handleNumberFontStyleChange('bold')}
                    className={`py-1.5 px-2 rounded text-xs font-mono font-bold transition-all ${
                      grid.numberFontStyle === 'bold'
                        ? 'bg-brass text-navy-dark'
                        : 'bg-navy-dark text-parchment/70 hover:text-parchment border border-teal/20'
                    }`}
                    aria-pressed={grid.numberFontStyle === 'bold'}
                  >
                    Bold
                  </button>
                  <button
                    onClick={() => handleNumberFontStyleChange('italic')}
                    className={`py-1.5 px-2 rounded text-xs font-mono italic transition-all ${
                      grid.numberFontStyle === 'italic'
                        ? 'bg-brass text-navy-dark'
                        : 'bg-navy-dark text-parchment/70 hover:text-parchment border border-teal/20'
                    }`}
                    aria-pressed={grid.numberFontStyle === 'italic'}
                  >
                    Italic
                  </button>
                  <button
                    onClick={() => handleNumberFontStyleChange('boldItalic')}
                    className={`py-1.5 px-2 rounded text-xs font-mono font-bold italic transition-all ${
                      grid.numberFontStyle === 'boldItalic'
                        ? 'bg-brass text-navy-dark'
                        : 'bg-navy-dark text-parchment/70 hover:text-parchment border border-teal/20'
                    }`}
                    aria-pressed={grid.numberFontStyle === 'boldItalic'}
                  >
                    B+I
                  </button>
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="label">Position</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleNumberPositionChange('top')}
                    className={`flex-1 py-1.5 px-2 rounded text-xs font-mono transition-all ${
                      grid.numberPosition === 'top'
                        ? 'bg-brass text-navy-dark'
                        : 'bg-navy-dark text-parchment/70 hover:text-parchment border border-teal/20'
                    }`}
                    aria-pressed={grid.numberPosition === 'top'}
                  >
                    Top
                  </button>
                  <button
                    onClick={() => handleNumberPositionChange('middle')}
                    className={`flex-1 py-1.5 px-2 rounded text-xs font-mono transition-all ${
                      grid.numberPosition === 'middle'
                        ? 'bg-brass text-navy-dark'
                        : 'bg-navy-dark text-parchment/70 hover:text-parchment border border-teal/20'
                    }`}
                    aria-pressed={grid.numberPosition === 'middle'}
                  >
                    Middle
                  </button>
                  <button
                    onClick={() => handleNumberPositionChange('bottom')}
                    className={`flex-1 py-1.5 px-2 rounded text-xs font-mono transition-all ${
                      grid.numberPosition === 'bottom'
                        ? 'bg-brass text-navy-dark'
                        : 'bg-navy-dark text-parchment/70 hover:text-parchment border border-teal/20'
                    }`}
                    aria-pressed={grid.numberPosition === 'bottom'}
                  >
                    Bottom
                  </button>
                </div>
              </div>

              {/* Horizontal Offset */}
              <div className="flex items-center gap-3">
                <label className="label mb-0 min-w-[60px]">H Offset</label>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={grid.numberOffsetX}
                  onChange={handleNumberOffsetXChange}
                  className="slider flex-1"
                />
                <span className="font-mono text-xs text-parchment/50 w-10 text-right">
                  {grid.numberOffsetX}%
                </span>
              </div>

              {/* Vertical Offset */}
              <div className="flex items-center gap-3">
                <label className="label mb-0 min-w-[60px]">V Offset</label>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={grid.numberOffsetY}
                  onChange={handleNumberOffsetYChange}
                  className="slider flex-1"
                />
                <span className="font-mono text-xs text-parchment/50 w-10 text-right">
                  {grid.numberOffsetY}%
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Print Settings */}
      <section className="card p-4">
        <h2 className="section-header">Print</h2>
        
        {/* Paper info */}
        <div className="mb-4 p-3 bg-navy-dark/50 rounded-md">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs text-parchment/50">Paper Size</span>
            <span className="font-mono text-sm text-teal">A4</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-parchment/50">Hex Diagonal</span>
            <span className="font-mono text-sm text-brass">~{hexSizeCm} cm</span>
          </div>
        </div>

        {/* Page Orientation */}
        <div className="mb-4">
          <label className="label">Page Orientation</label>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageOrientationChange('portrait')}
              className={`flex-1 py-2 px-3 rounded-md font-mono text-sm transition-all ${
                print.orientation === 'portrait'
                  ? 'bg-brass text-navy-dark'
                  : 'bg-navy-dark text-parchment/70 hover:text-parchment border border-teal/20'
              }`}
              aria-pressed={print.orientation === 'portrait'}
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
                print.orientation === 'landscape'
                  ? 'bg-brass text-navy-dark'
                  : 'bg-navy-dark text-parchment/70 hover:text-parchment border border-teal/20'
              }`}
              aria-pressed={print.orientation === 'landscape'}
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

        {/* Pages Grid */}
        <div className="mb-4">
          <label className="label">
            Pages
            <span className="text-brass ml-2">{print.pagesX} × {print.pagesY} = {print.pagesX * print.pagesY}</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">Columns</label>
              <input
                type="range"
                min="1"
                max="10"
                value={print.pagesX}
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
                value={print.pagesY}
                onChange={handlePagesYChange}
                className="slider"
              />
            </div>
          </div>
        </div>

        {/* Margin */}
        <div className="mb-4">
          <label className="label">
            Print Margin
            <span className="text-brass ml-2">{print.marginMm}mm</span>
          </label>
          <input
            type="range"
            min="0"
            max="20"
            value={print.marginMm}
            onChange={handleMarginChange}
            className="slider"
          />
        </div>
      </section>

      {/* Export notice */}
      {!hasImage && (
        <div className="text-center p-4">
          <p className="font-mono text-sm text-parchment/40">
            Upload an image to see export options
          </p>
        </div>
      )}
    </div>
  )
}
