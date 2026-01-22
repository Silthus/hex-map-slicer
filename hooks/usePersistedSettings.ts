'use client'

import { useState, useCallback, useEffect } from 'react'
import type { AppSettings, HexGridSettings, PrintSettings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'
import { loadSettings, saveSettings, clearSettings, migrateSettings } from '@/lib/storage'

type SettingsUpdate = 
  | { type: 'grid'; changes: Partial<HexGridSettings> }
  | { type: 'print'; changes: Partial<PrintSettings> }
  | { type: 'full'; settings: AppSettings }

interface UsePersistedSettingsReturn {
  settings: AppSettings
  updateSettings: (update: SettingsUpdate) => void
  resetSettings: () => void
  isLoaded: boolean
}

/**
 * Hook for managing persisted settings with localStorage
 * Uses lazy initialization and functional updates for performance
 */
export function usePersistedSettings(): UsePersistedSettingsReturn {
  // Lazy initialization - only run once on mount
  const [settings, setSettings] = useState<AppSettings>(() => DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    // Run migrations first
    migrateSettings()
    
    // Then load settings
    const stored = loadSettings()
    setSettings(stored)
    setIsLoaded(true)
  }, [])

  // Save settings whenever they change (after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveSettings(settings)
    }
  }, [settings, isLoaded])

  // Update settings with functional pattern for stability
  const updateSettings = useCallback((update: SettingsUpdate) => {
    setSettings(prev => {
      switch (update.type) {
        case 'grid':
          return {
            ...prev,
            grid: { ...prev.grid, ...update.changes },
          }
        case 'print':
          return {
            ...prev,
            print: { ...prev.print, ...update.changes },
          }
        case 'full':
          return update.settings
        default:
          return prev
      }
    })
  }, [])

  // Reset to defaults
  const resetSettings = useCallback(() => {
    clearSettings()
    setSettings(DEFAULT_SETTINGS)
  }, [])

  return {
    settings,
    updateSettings,
    resetSettings,
    isLoaded,
  }
}
