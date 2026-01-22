// Hex orientation types
export type HexOrientation = 'pointy' | 'flat'

// Numbering mode types
export type NumberingMode = 'sequential' | 'padded' | 'alphaCoord' | 'axialCoord'

// Number font style types
export type NumberFontStyle = 'normal' | 'bold' | 'italic' | 'boldItalic'

// Number position types
export type NumberPosition = 'top' | 'middle' | 'bottom'

// Page orientation
export type PageOrientation = 'portrait' | 'landscape'

// Slice mode - how to distribute content across pages
export type SliceMode = 'region' | 'tile'

// Uploaded image data
export interface UploadedImage {
  src: string
  width: number
  height: number
  name: string
}

// Hex grid settings
export interface HexGridSettings {
  orientation: HexOrientation
  lineColor: string
  lineOpacity: number
  numberColor: string
  numberOpacity: number
  showLines: boolean
  showNumbers: boolean
  numberingMode: NumberingMode
  // Number styling
  numberFontSize: number // Font size multiplier (0.5 - 2.0)
  numberFontStyle: NumberFontStyle
  numberPosition: NumberPosition
  numberOffsetX: number // Horizontal offset (-50 to 50, percentage of hex size)
  numberOffsetY: number // Vertical offset (-50 to 50, percentage of hex size)
  // Grid alignment offset
  offsetX: number
  offsetY: number
  // Hex size (will be calculated from page count)
  hexSize: number
}

// Print/export settings
export interface PrintSettings {
  paperWidth: number // mm
  paperHeight: number // mm
  pagesX: number
  pagesY: number
  orientation: PageOrientation
  marginMm: number
  dpi: number
  sliceMode: SliceMode
  tileMarginMm: number // margin between individual tiles in tile mode
  tileSpacingFactor: number // multiplier for spatial tile spacing (e.g., 1.2 = 20% extra space between tiles)
}

// Combined settings object
export interface AppSettings {
  grid: HexGridSettings
  print: PrintSettings
}

// Convenience type for settings updates
export type HexSettings = AppSettings

// Page slice information
export interface PageSlice {
  row: number
  col: number
  x: number
  y: number
  width: number
  height: number
  // Extended bounds for overlap
  extendedX: number
  extendedY: number
  extendedWidth: number
  extendedHeight: number
  // Overlap amounts on each side
  overlap: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

// Hex cell data
export interface HexCell {
  q: number // axial q coordinate
  r: number // axial r coordinate
  centerX: number
  centerY: number
  vertices: Point[]
  label: string
}

// Point type
export interface Point {
  x: number
  y: number
}

// Tile placement on a page
export interface TilePlacement {
  cell: HexCell
  destX: number // destination X position on page (in pixels at target DPI)
  destY: number // destination Y position on page
  destSize: number // destination hex size (in pixels at target DPI)
}

// A page containing multiple hex tiles
export interface TilePage {
  pageIndex: number
  tiles: TilePlacement[]
}

// A page containing tiles arranged spatially (preserving map layout)
export interface SpatialTilePage extends TilePage {
  row: number  // page grid row
  col: number  // page grid column
  regionBounds: { x: number; y: number; width: number; height: number }
}

// Layout info for tile mode
export interface TileLayout {
  tilesPerRow: number
  tilesPerCol: number
  tilesPerPage: number
  totalPages: number
  tileSizeMm: number // hex bounding box size in mm
  effectiveTileSizeMm: number // including margin
}

// Layout info for spatial tile mode
export interface SpatialTileLayout {
  pagesX: number
  pagesY: number
  tileSizeMm: number
  tileSizePx: number
  spacingFactor: number
  // Scale from source image pixels to page pixels
  pageScale: number
}

// Export options
export interface ExportOptions {
  format: 'pdf' | 'png' | 'zip'
  dpi: number
  includeOverlap: boolean
}

// Selective print settings (for individual tile selection mode)
export interface SelectivePrintSettings {
  tileSizeCm: number // desired hex tile size in centimeters
  tileMarginMm: number // margin between tiles in mm
  marginMm: number // page margin in mm
  orientation: PageOrientation
  paperWidth: number // mm
  paperHeight: number // mm
  dpi: number
  featherMm: number // bleed/feather amount in mm (extra overlap beyond hex edges for cutting tolerance)
}

// Selective tile page (tiles packed efficiently)
export interface SelectiveTilePage {
  pageIndex: number
  tiles: TilePlacement[]
}

// Layout info for selective tile mode
export interface SelectiveTileLayout {
  tilesPerRow: number
  tilesPerCol: number
  tilesPerPage: number
  totalPages: number
  tileSizePx: number // tile size in pixels at target DPI
  tileSizeMm: number // tile size in mm
}

// Default settings
export const DEFAULT_HEX_GRID_SETTINGS: HexGridSettings = {
  orientation: 'flat',
  lineColor: '#2d6a6a',
  lineOpacity: 70,
  numberColor: '#e8dcc4',
  numberOpacity: 80,
  showLines: true,
  showNumbers: true,
  numberingMode: 'padded',
  numberFontSize: 1.0,
  numberFontStyle: 'bold',
  numberPosition: 'middle',
  numberOffsetX: 0,
  numberOffsetY: 0,
  offsetX: 0,
  offsetY: 0,
  hexSize: 50,
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  paperWidth: 210, // A4 width in mm
  paperHeight: 297, // A4 height in mm
  pagesX: 2,
  pagesY: 2,
  orientation: 'landscape',
  marginMm: 5,
  dpi: 300,
  sliceMode: 'region',
  tileMarginMm: 3,
  tileSpacingFactor: 1.15, // 15% extra space between tiles to preserve map shape
}

export const DEFAULT_SETTINGS: AppSettings = {
  grid: DEFAULT_HEX_GRID_SETTINGS,
  print: DEFAULT_PRINT_SETTINGS,
}

export const DEFAULT_SELECTIVE_PRINT_SETTINGS: SelectivePrintSettings = {
  tileSizeCm: 3, // 3cm default tile size
  tileMarginMm: 3,
  marginMm: 5,
  orientation: 'portrait',
  paperWidth: 210, // A4
  paperHeight: 297,
  dpi: 300,
  featherMm: 0, // default to no feather
}

// A4 dimensions at different DPIs
export const A4_DIMENSIONS = {
  mm: { width: 210, height: 297 },
  px300: { width: 2480, height: 3508 }, // 300 DPI
  px150: { width: 1240, height: 1754 }, // 150 DPI
  px72: { width: 595, height: 842 },    // 72 DPI (screen)
}
