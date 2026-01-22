import type { AppSettings, UploadedImage, SelectivePrintSettings } from '@/types'
import { DEFAULT_SETTINGS, DEFAULT_SELECTIVE_PRINT_SETTINGS } from '@/types'

const STORAGE_VERSION = 'v1'
const STORAGE_KEY = `hexTiler:${STORAGE_VERSION}:settings`
const SELECTED_TILES_KEY = `hexTiler:${STORAGE_VERSION}:selectedTiles`
const SELECTIVE_PRINT_KEY = `hexTiler:${STORAGE_VERSION}:selectivePrint`
const DB_NAME = 'hexTilerDB'
const DB_VERSION = 1
const IMAGE_STORE = 'images'
const IMAGE_KEY = 'currentImage'

// Cache for localStorage reads
const storageCache = new Map<string, string | null>()

/**
 * Safely get item from localStorage with caching
 */
function getLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') return null
  
  if (!storageCache.has(key)) {
    try {
      storageCache.set(key, localStorage.getItem(key))
    } catch {
      // localStorage may be disabled or quota exceeded
      storageCache.set(key, null)
    }
  }
  return storageCache.get(key) ?? null
}

/**
 * Safely set item in localStorage and update cache
 */
function setLocalStorage(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    localStorage.setItem(key, value)
    storageCache.set(key, value)
    return true
  } catch {
    // localStorage may be disabled or quota exceeded
    return false
  }
}

/**
 * Remove item from localStorage and cache
 */
function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(key)
    storageCache.delete(key)
  } catch {
    // Ignore errors
  }
}

/**
 * Clear storage cache (useful when storage may have changed externally)
 */
export function clearStorageCache(): void {
  storageCache.clear()
}

/**
 * Load settings from localStorage
 */
export function loadSettings(): AppSettings {
  const stored = getLocalStorage(STORAGE_KEY)
  
  if (!stored) {
    return DEFAULT_SETTINGS
  }
  
  try {
    const parsed = JSON.parse(stored) as Partial<AppSettings>
    
    // Deep merge with defaults to handle missing properties
    return {
      grid: {
        ...DEFAULT_SETTINGS.grid,
        ...parsed.grid,
      },
      print: {
        ...DEFAULT_SETTINGS.print,
        ...parsed.print,
      },
    }
  } catch {
    // Invalid JSON, return defaults
    return DEFAULT_SETTINGS
  }
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: AppSettings): boolean {
  try {
    const json = JSON.stringify(settings)
    return setLocalStorage(STORAGE_KEY, json)
  } catch {
    return false
  }
}

/**
 * Clear all settings from localStorage
 */
export function clearSettings(): void {
  removeLocalStorage(STORAGE_KEY)
}

/**
 * Migrate settings from older versions
 * Call this on app init to handle schema changes
 */
export function migrateSettings(): void {
  if (typeof window === 'undefined') return
  
  // Check for v0 (unversioned) settings
  try {
    const oldKey = 'hexTiler:settings'
    const oldSettings = localStorage.getItem(oldKey)
    
    if (oldSettings) {
      // Migrate to v1 format
      const parsed = JSON.parse(oldSettings)
      const migrated: AppSettings = {
        grid: {
          ...DEFAULT_SETTINGS.grid,
          ...parsed.grid,
          // Handle renamed properties if any
        },
        print: {
          ...DEFAULT_SETTINGS.print,
          ...parsed.print,
        },
      }
      
      saveSettings(migrated)
      localStorage.removeItem(oldKey)
    }
  } catch {
    // Ignore migration errors
  }
}

// =============================================================================
// Selected tiles storage
// =============================================================================

/**
 * Load selected tile IDs from localStorage
 */
export function loadSelectedTiles(): string[] {
  const stored = getLocalStorage(SELECTED_TILES_KEY)
  
  if (!stored) {
    return []
  }
  
  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Save selected tile IDs to localStorage
 */
export function saveSelectedTiles(tileIds: string[]): boolean {
  try {
    const json = JSON.stringify(tileIds)
    return setLocalStorage(SELECTED_TILES_KEY, json)
  } catch {
    return false
  }
}

/**
 * Clear selected tiles from localStorage
 */
export function clearSelectedTiles(): void {
  removeLocalStorage(SELECTED_TILES_KEY)
}

// =============================================================================
// Selective print settings storage
// =============================================================================

/**
 * Load selective print settings from localStorage
 */
export function loadSelectivePrintSettings(): SelectivePrintSettings {
  const stored = getLocalStorage(SELECTIVE_PRINT_KEY)
  
  if (!stored) {
    return DEFAULT_SELECTIVE_PRINT_SETTINGS
  }
  
  try {
    const parsed = JSON.parse(stored) as Partial<SelectivePrintSettings>
    return {
      ...DEFAULT_SELECTIVE_PRINT_SETTINGS,
      ...parsed,
    }
  } catch {
    return DEFAULT_SELECTIVE_PRINT_SETTINGS
  }
}

/**
 * Save selective print settings to localStorage
 */
export function saveSelectivePrintSettings(settings: SelectivePrintSettings): boolean {
  try {
    const json = JSON.stringify(settings)
    return setLocalStorage(SELECTIVE_PRINT_KEY, json)
  } catch {
    return false
  }
}

// Listen for storage changes from other tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      storageCache.delete(STORAGE_KEY)
    }
  })
  
  // Clear cache when tab becomes visible (in case storage changed while hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      storageCache.clear()
    }
  })
}

// =============================================================================
// IndexedDB helpers for image persistence
// =============================================================================

let dbInstance: IDBDatabase | null = null

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)
  
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(request.result)
    }
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE)
      }
    }
  })
}

/**
 * Save image to IndexedDB
 */
export async function saveImage(image: UploadedImage): Promise<boolean> {
  try {
    const db = await openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(IMAGE_STORE, 'readwrite')
      const store = transaction.objectStore(IMAGE_STORE)
      
      const request = store.put(image, IMAGE_KEY)
      
      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  } catch {
    console.error('Failed to save image to IndexedDB')
    return false
  }
}

/**
 * Load image from IndexedDB
 */
export async function loadImage(): Promise<UploadedImage | null> {
  try {
    const db = await openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(IMAGE_STORE, 'readonly')
      const store = transaction.objectStore(IMAGE_STORE)
      
      const request = store.get(IMAGE_KEY)
      
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } catch {
    console.error('Failed to load image from IndexedDB')
    return null
  }
}

/**
 * Clear image from IndexedDB
 */
export async function clearImage(): Promise<void> {
  try {
    const db = await openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(IMAGE_STORE, 'readwrite')
      const store = transaction.objectStore(IMAGE_STORE)
      
      const request = store.delete(IMAGE_KEY)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch {
    console.error('Failed to clear image from IndexedDB')
  }
}
