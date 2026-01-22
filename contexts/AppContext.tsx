'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { AppSettings, UploadedImage, HexGridSettings, PrintSettings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'
import { loadSettings, saveSettings, clearSettings, migrateSettings, saveImage, loadImage, clearImage } from '@/lib/storage'

type SettingsUpdate = 
  | { type: 'grid'; changes: Partial<HexGridSettings> }
  | { type: 'print'; changes: Partial<PrintSettings> }
  | { type: 'full'; settings: AppSettings }

interface AppContextType {
  // Image state
  image: UploadedImage | null
  setImage: (image: UploadedImage | null) => void
  clearCurrentImage: () => void
  
  // Settings state
  settings: AppSettings
  updateSettings: (update: SettingsUpdate) => void
  resetSettings: () => void
  
  // Loading state
  isLoaded: boolean
}

const AppContext = createContext<AppContextType | null>(null)

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [image, setImageState] = useState<UploadedImage | null>(null)
  const [settings, setSettings] = useState<AppSettings>(() => DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load persisted state on mount
  useEffect(() => {
    const loadPersistedState = async () => {
      // Run migrations first
      migrateSettings()
      
      // Load settings from localStorage
      const storedSettings = loadSettings()
      setSettings(storedSettings)
      
      // Load image from IndexedDB
      const storedImage = await loadImage()
      if (storedImage) {
        setImageState(storedImage)
      }
      
      setIsLoaded(true)
    }
    
    loadPersistedState()
  }, [])

  // Persist settings when they change
  useEffect(() => {
    if (isLoaded) {
      saveSettings(settings)
    }
  }, [settings, isLoaded])

  // Set image and persist to IndexedDB
  const setImage = useCallback((newImage: UploadedImage | null) => {
    setImageState(newImage)
    
    if (newImage) {
      saveImage(newImage)
    } else {
      clearImage()
    }
  }, [])

  // Clear image
  const clearCurrentImage = useCallback(() => {
    setImageState(null)
    clearImage()
  }, [])

  // Update settings
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

  // Reset settings to defaults
  const resetSettings = useCallback(() => {
    clearSettings()
    setSettings(DEFAULT_SETTINGS)
  }, [])

  const value: AppContextType = {
    image,
    setImage,
    clearCurrentImage,
    settings,
    updateSettings,
    resetSettings,
    isLoaded,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
