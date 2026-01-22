# Hex Grid Tiler

A web application for creating printable hex map tiles with smart overlap for tabletop gaming. Upload your hex map, overlay a configurable grid, and export to A4 pages that properly handle edge hexes so you can cut them out as individual cards.

## Features

- **Image Upload**: Drag-and-drop or click to upload PNG, JPG, or WEBP maps
- **Hex Grid Overlay**: 
  - Two orientation modes (pointy-top and flat-top)
  - Customizable line and number colors with opacity
  - Four numbering schemes: sequential, zero-padded, coordinate-based, and axial
  - Drag to align grid over your map
- **Smart Page Slicing**:
  - Automatic overlap calculation for edge hexes
  - Preview all pages before export
  - Download individual pages on-demand
- **Export Options**:
  - PDF with all pages (300 DPI print quality)
  - Individual PNG downloads per page
  - Bulk ZIP download of all pages
- **Settings Persistence**: Your preferences are saved in the browser

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

### Deploy to Vercel

This app is ready for Vercel deployment:

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **HTML5 Canvas** for rendering
- **jsPDF** for PDF generation
- **JSZip** for bulk PNG downloads

## Usage

1. **Upload your map**: Drag and drop or click to select an image file
2. **Configure the grid**: 
   - Choose hex orientation (pointy or flat top)
   - Adjust hex size to match your map
   - Set colors and opacity for lines and numbers
   - Choose a numbering format
   - Drag on the preview to align the grid
3. **Set print options**:
   - Choose page count (columns × rows)
   - Select portrait or landscape orientation
   - Adjust print margins
4. **Export**:
   - Click individual page tiles to download single pages
   - Use "Export PDF" for a single printable file
   - Use "Download All PNGs" for a ZIP of individual pages

## The Overlap Feature

The key feature of this tool is **smart overlap**. When slicing a hex map into printable pages:

- Standard tools cut hexes in half at page boundaries
- This tool extends each page to include the full hex for any hexes that cross boundaries
- This means some hexes appear on multiple pages, but each instance is complete
- You can cut out full hexes from any page without needing to tape half-hexes together

## License

MIT
