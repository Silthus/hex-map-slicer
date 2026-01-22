'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { AppSettings, UploadedImage, HexGridSettings, PrintSettings, SelectivePrintSettings } from '@/types'
import { DEFAULT_SETTINGS, DEFAULT_SELECTIVE_PRINT_SETTINGS } from '@/types'
import { loadSettings, saveSettings, clearSettings, migrateSettings, saveImage, loadImage, clearImage, loadSelectedTiles, saveSelectedTiles, clearSelectedTiles as clearStoredSelectedTiles, loadSelectivePrintSettings, saveSelectivePrintSettings } from '@/lib/storage'

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
  
  // Selective print state
  isSelectMode: boolean
  setSelectMode: (enabled: boolean) => void
  selectedTileIds: string[] // "q:r" format
  toggleTileSelection: (q: number, r: number) => void
  clearSelectedTiles: () => void
  selectivePrintSettings: SelectivePrintSettings
  updateSelectivePrintSettings: (changes: Partial<SelectivePrintSettings>) => void
  
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
  
  // Selective print state
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([])
  const [selectivePrintSettings, setSelectivePrintSettings] = useState<SelectivePrintSettings>(() => DEFAULT_SELECTIVE_PRINT_SETTINGS)

  // Load persisted state on mount
  useEffect(() => {
    const loadPersistedState = async () => {
      // Run migrations first
      migrateSettings()
      
      // Load settings from localStorage
      const storedSettings = loadSettings()
      setSettings(storedSettings)
      
      // Load selective print settings
      const storedSelectiveSettings = loadSelectivePrintSettings()
      setSelectivePrintSettings(storedSelectiveSettings)
      
      // Load selected tiles
      const storedSelectedTiles = loadSelectedTiles()
      setSelectedTileIds(storedSelectedTiles)
      
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

  // Persist selected tiles when they change
  useEffect(() => {
    if (isLoaded) {
      saveSelectedTiles(selectedTileIds)
    }
  }, [selectedTileIds, isLoaded])

  // Persist selective print settings when they change
  useEffect(() => {
    if (isLoaded) {
      saveSelectivePrintSettings(selectivePrintSettings)
    }
  }, [selectivePrintSettings, isLoaded])

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

  // Set select mode
  const setSelectMode = useCallback((enabled: boolean) => {
    setIsSelectMode(enabled)
  }, [])

  // Toggle tile selection
  const toggleTileSelection = useCallback((q: number, r: number) => {
    const id = `${q}:${r}`
    setSelectedTileIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(tileId => tileId !== id)
      } else {
        return [...prev, id]
      }
    })
  }, [])

  // Clear all selected tiles
  const clearSelectedTiles = useCallback(() => {
    setSelectedTileIds([])
    clearStoredSelectedTiles()
  }, [])

  // Update selective print settings
  const updateSelectivePrintSettings = useCallback((changes: Partial<SelectivePrintSettings>) => {
    setSelectivePrintSettings(prev => ({ ...prev, ...changes }))
  }, [])

  const value: AppContextType = {
    image,
    setImage,
    clearCurrentImage,
    settings,
    updateSettings,
    resetSettings,
    isSelectMode,
    setSelectMode,
    selectedTileIds,
    toggleTileSelection,
    clearSelectedTiles,
    selectivePrintSettings,
    updateSelectivePrintSettings,
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
