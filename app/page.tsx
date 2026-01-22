'use client'

import { FloatingGridControls } from '@/components/FloatingGridControls'
import { HexCanvas } from '@/components/HexCanvas'
import { ImageUploader } from '@/components/ImageUploader'
import { useApp } from '@/contexts/AppContext'
import type { UploadedImage } from '@/types'
import Link from 'next/link'
import { useCallback } from 'react'

export default function Home() {
  const { image, setImage, clearCurrentImage, settings, updateSettings, resetSettings, isLoaded } = useApp()

  const handleImageUpload = useCallback((uploadedImage: UploadedImage) => {
    setImage(uploadedImage)
  }, [setImage])

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

  // No image uploaded - show uploader
  if (!image) {
    return (
      <main className="min-h-screen p-4 md:p-6 lg:p-8 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
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
            <h1 className="font-display text-2xl md:text-3xl text-gradient tracking-wide">
              Hex Grid Tiler
            </h1>
          </div>
        </header>

        {/* Upload area - centered */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-2xl animate-slide-up">
            <ImageUploader onUpload={handleImageUpload} />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-teal/10 text-center">
          <p className="font-mono text-xs text-parchment/40">
            Hex Grid Tiler • For tabletop cartographers
          </p>
        </footer>
      </main>
    )
  }

  // Image uploaded - show full-screen editor
  return (
    <main className="h-screen flex flex-col overflow-hidden">
      {/* Minimal header bar */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-navy/80 backdrop-blur-sm border-b border-teal/20 z-40">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
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
            <span className="font-display text-lg text-gradient hidden sm:block">
              Hex Grid Tiler
            </span>
          </div>

          {/* Image info */}
          <div className="flex items-center gap-3 pl-4 border-l border-teal/20">
            <span className="font-mono text-xs text-parchment/50 truncate max-w-[150px] sm:max-w-[200px]">
              {image.name}
            </span>
            <span className="font-mono text-xs text-teal hidden sm:block">
              {image.width} × {image.height}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear image button */}
          <button
            onClick={clearCurrentImage}
            className="btn-ghost text-xs flex items-center gap-1"
            aria-label="Remove image"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="hidden sm:inline">Clear</span>
          </button>

          {/* Reset settings button */}
          <button
            onClick={resetSettings}
            className="btn-ghost text-xs"
            aria-label="Reset all settings to defaults"
          >
            Reset
          </button>

          {/* Preview button */}
          <Link
            href="/preview"
            className="btn-primary text-sm flex items-center gap-2 py-1.5 px-4"
          >
            <span>Preview</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Full-screen canvas area */}
      <div className="flex-1 relative">
        <HexCanvas 
          image={image}
          settings={settings}
          fullScreen
        />
      </div>

      {/* Floating grid controls */}
      <FloatingGridControls
        settings={settings.grid}
        onSettingsChange={updateSettings}
      />
    </main>
  )
}
