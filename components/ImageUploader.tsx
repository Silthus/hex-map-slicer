'use client'

import { useState, useCallback, useRef } from 'react'
import type { UploadedImage } from '@/types'

interface ImageUploaderProps {
  onUpload: (image: UploadedImage) => void
}

export function ImageUploader({ onUpload }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, or WEBP)')
      return
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('Image must be smaller than 50MB')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create object URL for the image
      const src = URL.createObjectURL(file)
      
      // Load image to get dimensions
      const img = new Image()
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = src
      })

      onUpload({
        src,
        width: img.naturalWidth,
        height: img.naturalHeight,
        name: file.name,
      })
    } catch {
      setError('Failed to load image. Please try another file.')
    } finally {
      setIsLoading(false)
    }
  }, [onUpload])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set to false if we're leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }, [processFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
    // Reset input so same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [processFile])

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }, [])

  return (
    <div
      className={`
        relative min-h-[300px] md:min-h-[400px] rounded-lg
        flex flex-col items-center justify-center
        transition-all duration-300 cursor-pointer
        ${isDragging 
          ? 'dashed-border-animated bg-brass/5' 
          : 'border-2 border-dashed border-teal/30 hover:border-teal/50 hover:bg-navy-dark/30'
        }
        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Upload image by clicking or dragging"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden="true"
      />

      {/* Icon */}
      <div className={`
        mb-4 transition-transform duration-300
        ${isDragging ? 'scale-110' : ''}
      `}>
        <svg 
          className={`w-16 h-16 md:w-20 md:h-20 ${isDragging ? 'text-brass' : 'text-teal/50'}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
      </div>

      {/* Text */}
      <div className="text-center px-4">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <svg className="animate-spin w-5 h-5 text-brass" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span className="font-mono text-parchment/70">Loading image...</span>
          </div>
        ) : (
          <>
            <p className={`font-display text-lg md:text-xl mb-2 ${isDragging ? 'text-brass' : 'text-parchment'}`}>
              {isDragging ? 'Drop your map here' : 'Upload your hex map'}
            </p>
            <p className="font-mono text-sm text-parchment/50">
              Drag & drop or click to browse
            </p>
            <p className="font-mono text-xs text-parchment/30 mt-2">
              PNG, JPG, or WEBP • Max 50MB
            </p>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-900/50 border border-red-700/50 rounded-md p-3">
          <p className="font-mono text-sm text-red-300 text-center">{error}</p>
        </div>
      )}

      {/* Decorative corners */}
      <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-teal/20 rounded-tl-sm" />
      <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-teal/20 rounded-tr-sm" />
      <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-teal/20 rounded-bl-sm" />
      <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-teal/20 rounded-br-sm" />
    </div>
  )
}
