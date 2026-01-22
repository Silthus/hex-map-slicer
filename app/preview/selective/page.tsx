'use client'

import { SelectivePageGrid } from '@/components/SelectivePageGrid'
import { SelectivePrintSettingsPanel } from '@/components/SelectivePrintSettings'
import { useApp } from '@/contexts/AppContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SelectivePreviewPage() {
  const router = useRouter()
  const { 
    image, 
    settings, 
    isLoaded,
    selectedTileIds,
    setSelectMode,
    selectivePrintSettings,
    updateSelectivePrintSettings,
  } = useApp()

  // Redirect to home if no image is loaded or no tiles selected
  useEffect(() => {
    if (isLoaded && (!image || selectedTileIds.length === 0)) {
      router.push('/')
    }
  }, [isLoaded, image, selectedTileIds.length, router])

  // Show loading state while hydrating
  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="animate-spin w-6 h-6 text-brass" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span className="font-mono text-parchment/70">Loading...</span>
        </div>
      </div>
    )
  }

  // No image or no selection - will redirect
  if (!image || selectedTileIds.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-parchment/70 mb-4">
            {!image ? 'No image loaded' : 'No tiles selected'}
          </p>
          <Link href="/" className="btn-primary">
            Go to Editor
          </Link>
        </div>
      </div>
    )
  }

  const handleBackToSelection = () => {
    setSelectMode(true)
    router.push('/')
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-navy/95 backdrop-blur-sm border-b border-teal/20">
        <div className="flex items-center gap-4">
          {/* Back button */}
          <button
            onClick={handleBackToSelection}
            className="btn-ghost text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back to Selection</span>
          </button>

          {/* Title */}
          <div className="flex items-center gap-3 pl-4 border-l border-teal/20">
            <div className="w-7 h-7 flex items-center justify-center">
              <svg 
                viewBox="0 0 40 40" 
                className="w-full h-full text-brass"
                fill="currentColor"
              >
                <path d="M20 2L35 11V29L20 38L5 29V11L20 2Z" fill="none" stroke="currentColor" strokeWidth="2"/>
                <path d="M20 8L30 14V26L20 32L10 26V14L20 8Z" fill="currentColor" opacity="0.3"/>
                <circle cx="20" cy="20" r="4" fill="currentColor"/>
              </svg>
            </div>
            <h1 className="font-display text-lg text-gradient">
              Print Selected Tiles
            </h1>
          </div>
        </div>

        {/* Selection info */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-brass">
            {selectedTileIds.length} tiles selected
          </span>
          <span className="font-mono text-xs text-parchment/50 truncate max-w-[150px] sm:max-w-[200px]">
            {image.name}
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 xl:gap-8">
          {/* Page grid preview */}
          <section className="animate-slide-up">
            <SelectivePageGrid 
              image={image}
              settings={settings}
              selectedTileIds={selectedTileIds}
              selectivePrintSettings={selectivePrintSettings}
            />
          </section>

          {/* Print settings sidebar */}
          <aside className="animate-slide-up delay-100 lg:sticky lg:top-24 lg:self-start">
            <SelectivePrintSettingsPanel
              settings={selectivePrintSettings}
              onSettingsChange={updateSelectivePrintSettings}
              selectedCount={selectedTileIds.length}
            />
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 py-6 border-t border-teal/10 text-center">
        <p className="font-mono text-xs text-parchment/40">
          Hex Grid Tiler • For tabletop cartographers
        </p>
      </footer>
    </main>
  )
}
