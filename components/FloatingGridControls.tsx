'use client'

import { useState, useCallback } from 'react'
import type { HexGridSettings, HexOrientation, NumberingMode } from '@/types'

type GridUpdate = { type: 'grid'; changes: Partial<HexGridSettings> }

interface FloatingGridControlsProps {
  settings: HexGridSettings
  onSettingsChange: (update: GridUpdate) => void
}

export function FloatingGridControls({ settings, onSettingsChange }: FloatingGridControlsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState<'main' | 'lines' | 'numbers'>('main')

  // Grid setting handlers
  const handleOrientationChange = useCallback((orientation: HexOrientation) => {
    onSettingsChange({ type: 'grid', changes: { orientation } })
  }, [onSettingsChange])

  const handleHexSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ type: 'grid', changes: { hexSize: parseInt(e.target.value, 10) } })
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

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed bottom-4 left-4 z-50 bg-navy/95 backdrop-blur-sm border border-teal/30 rounded-lg p-3 shadow-xl hover:border-teal/50 transition-colors"
        aria-label="Expand grid controls"
      >
        <svg className="w-6 h-6 text-brass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-navy/95 backdrop-blur-sm border border-teal/30 rounded-lg shadow-xl w-72 max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-teal/20">
        <h3 className="font-mono text-sm text-parchment font-semibold">Grid Controls</h3>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-navy-dark rounded transition-colors"
          aria-label="Collapse controls"
        >
          <svg className="w-4 h-4 text-parchment/50 hover:text-parchment" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Tab buttons */}
      <div className="flex border-b border-teal/20">
        <button
          onClick={() => setActiveSection('main')}
          className={`flex-1 py-2 px-3 font-mono text-xs transition-colors ${
            activeSection === 'main' ? 'bg-navy-dark text-brass' : 'text-parchment/60 hover:text-parchment'
          }`}
        >
          Grid
        </button>
        <button
          onClick={() => setActiveSection('lines')}
          className={`flex-1 py-2 px-3 font-mono text-xs transition-colors ${
            activeSection === 'lines' ? 'bg-navy-dark text-brass' : 'text-parchment/60 hover:text-parchment'
          }`}
        >
          Lines
        </button>
        <button
          onClick={() => setActiveSection('numbers')}
          className={`flex-1 py-2 px-3 font-mono text-xs transition-colors ${
            activeSection === 'numbers' ? 'bg-navy-dark text-brass' : 'text-parchment/60 hover:text-parchment'
          }`}
        >
          Numbers
        </button>
      </div>

      {/* Content */}
      <div className="p-3 overflow-y-auto">
        {activeSection === 'main' && (
          <div className="space-y-4">
            {/* Orientation */}
            <div>
              <label className="label text-xs">Hex Orientation</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOrientationChange('pointy')}
                  className={`flex-1 py-1.5 px-2 rounded font-mono text-xs transition-all ${
                    settings.orientation === 'pointy'
                      ? 'bg-brass text-navy-dark'
                      : 'bg-navy-dark text-parchment/70 hover:text-parchment border border-teal/20'
                  }`}
                  aria-pressed={settings.orientation === 'pointy'}
                >
                  <span className="flex items-center justify-center gap-1">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                      <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" />
                    </svg>
                    Pointy
                  </span>
                </button>
                <button
                  onClick={() => handleOrientationChange('flat')}
                  className={`flex-1 py-1.5 px-2 rounded font-mono text-xs transition-all ${
                    settings.orientation === 'flat'
                      ? 'bg-brass text-navy-dark'
                      : 'bg-navy-dark text-parchment/70 hover:text-parchment border border-teal/20'
                  }`}
                  aria-pressed={settings.orientation === 'flat'}
                >
                  <span className="flex items-center justify-center gap-1">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 rotate-90" fill="currentColor">
                      <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" />
                    </svg>
                    Flat
                  </span>
                </button>
              </div>
            </div>

            {/* Hex Size */}
            <div>
              <label className="label text-xs">
                Hex Size
                <span className="text-brass ml-2">{settings.hexSize}px</span>
              </label>
              <input
                type="range"
                min="20"
                max="200"
                value={settings.hexSize}
                onChange={handleHexSizeChange}
                className="slider"
              />
            </div>
          </div>
        )}

        {activeSection === 'lines' && (
          <div className="space-y-4">
            {/* Show Lines Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showLines}
                onChange={handleShowLinesChange}
                className="checkbox"
              />
              <span className="font-mono text-xs text-parchment/70">Show Grid Lines</span>
            </label>

            {settings.showLines && (
              <>
                {/* Line Color */}
                <div className="flex items-center gap-2">
                  <label className="label text-xs mb-0 min-w-[50px]">Color</label>
                  <input
                    type="color"
                    value={settings.lineColor}
                    onChange={handleLineColorChange}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={settings.lineColor}
                    onChange={handleLineColorChange}
                    className="input flex-1 text-xs"
                    maxLength={7}
                  />
                </div>

                {/* Line Opacity */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="label text-xs mb-0">Opacity</label>
                    <span className="font-mono text-xs text-parchment/50">{settings.lineOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.lineOpacity}
                    onChange={handleLineOpacityChange}
                    className="slider"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {activeSection === 'numbers' && (
          <div className="space-y-4">
            {/* Show Numbers Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showNumbers}
                onChange={handleShowNumbersChange}
                className="checkbox"
              />
              <span className="font-mono text-xs text-parchment/70">Show Numbers</span>
            </label>

            {settings.showNumbers && (
              <>
                {/* Numbering Format */}
                <div>
                  <label className="label text-xs">Format</label>
                  <select
                    value={settings.numberingMode}
                    onChange={handleNumberingModeChange}
                    className="select text-xs"
                  >
                    <option value="sequential">Sequential (1, 2, 3...)</option>
                    <option value="padded">Padded (0001, 0002...)</option>
                    <option value="alphaCoord">Alpha (A1, B2...)</option>
                    <option value="axialCoord">Axial (0,0 / 1,0...)</option>
                  </select>
                </div>

                {/* Number Color */}
                <div className="flex items-center gap-2">
                  <label className="label text-xs mb-0 min-w-[50px]">Color</label>
                  <input
                    type="color"
                    value={settings.numberColor}
                    onChange={handleNumberColorChange}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={settings.numberColor}
                    onChange={handleNumberColorChange}
                    className="input flex-1 text-xs"
                    maxLength={7}
                  />
                </div>

                {/* Number Opacity */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="label text-xs mb-0">Opacity</label>
                    <span className="font-mono text-xs text-parchment/50">{settings.numberOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.numberOpacity}
                    onChange={handleNumberOpacityChange}
                    className="slider"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-teal/20 bg-navy-dark/50">
        <p className="font-mono text-[10px] text-parchment/40 text-center">
          Drag the map to align the grid
        </p>
      </div>
    </div>
  )
}
