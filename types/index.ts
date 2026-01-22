// Hex orientation types
export type HexOrientation = 'pointy' | 'flat'

// Numbering mode types
export type NumberingMode = 'sequential' | 'padded' | 'alphaCoord' | 'axialCoord'

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

// Layout info for tile mode
export interface TileLayout {
  tilesPerRow: number
  tilesPerCol: number
  tilesPerPage: number
  totalPages: number
  tileSizeMm: number // hex bounding box size in mm
  effectiveTileSizeMm: number // including margin
}

// Export options
export interface ExportOptions {
  format: 'pdf' | 'png' | 'zip'
  dpi: number
  includeOverlap: boolean
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
}

export const DEFAULT_SETTINGS: AppSettings = {
  grid: DEFAULT_HEX_GRID_SETTINGS,
  print: DEFAULT_PRINT_SETTINGS,
}

// A4 dimensions at different DPIs
export const A4_DIMENSIONS = {
  mm: { width: 210, height: 297 },
  px300: { width: 2480, height: 3508 }, // 300 DPI
  px150: { width: 1240, height: 1754 }, // 150 DPI
  px72: { width: 595, height: 842 },    // 72 DPI (screen)
}
