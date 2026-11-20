# Morrow — Your life, in pages

Morrow is a paper-inspired digital journal. This first standalone build focuses on the actual journal-making experience: a book-like editor, flexible pages, writing, photographs, stickers, checklists, quotes, drawing, calendars, goals, habits, search, memories and printable layouts.

## Run locally

No build step or dependencies are needed.

1. Unzip the project.
2. Open a terminal in this folder.
3. Run a local static server, for example:

   ```bash
   python -m http.server 8000
   ```

4. Open <http://localhost:8000>.

The service worker and installable-app behavior require `localhost` or HTTPS. Opening `index.html` directly still runs the core application, but offline/PWA behavior will not be enabled.

## What works in this build

- Multiple journals, covers, page creation, duplication, deletion and archiving.
- Two-page, paper-inspired editor with page backgrounds, page sizes, zoom and page navigation.
- Editable text and quotes, headings, bold/italic/underline, text highlighting, text colour, size and typeface controls; tables, photos, stickers, checklists, audio, video, file attachments and freehand drawing.
- Six built-in page templates plus saving a current page layout as a reusable personal template.
- Pointer Events for mouse, touch and stylus input, including pressure-aware drawing where the device/browser supplies pressure data.
- Calendar, daily check-in, goals, habit tracking, memory search and a basic year-in-review summary.
- Print layout that opens the browser's print dialog, with A5, A4 and square page formats; choose a PDF printer or print provider.
- Local-first persistence with IndexedDB where available, plus JSON backup export/import.
- Installable PWA shell and basic app-shell caching.

## Install on a phone or tablet

The site is configured as an installable Progressive Web App (PWA), not as a native App Store / Play Store application. Serve it over HTTPS (or `localhost`) first:

- **iPhone / iPad:** open the HTTPS site in Safari, tap Share, then choose **Add to Home Screen**.
- **Android:** open the HTTPS site in Chrome, open the browser menu, then choose **Install app** or **Add to Home screen**.
- **Desktop:** in a supported Chromium browser, use the install icon in the address bar or the browser menu.

The editor uses browser Pointer Events for mouse, touch and stylus input. Pressure-aware drawing is used when the browser reports pen pressure. Apple Pencil tilt, palm rejection and handwriting-to-text conversion have not yet been validated on physical iPad hardware.

## Important limitations of this standalone build

This is a functional local-first product foundation, not yet a deployed multi-user service. Content is saved in the current browser profile. It does not sync between devices and should not be treated as cloud backup. Account registration, secure server-side storage, multi-device sync, public/private sharing, community profiles/follows/comments, AI features, real notification scheduling, and print-shop fulfilment are not connected yet. The Discover screen is an honest product placeholder, not a simulated feed.

Uploaded media is stored as data URLs in browser storage. Large video files can exceed browser quota; keep uploads modest and export backups regularly. The browser print layout uses the chosen A5, A4 or square page format and includes text, tables, photos and drawings. Audio/video and arbitrary file attachments are represented by a note in the print layout and remain available in the digital journal. This is not yet a commercial print-on-demand pipeline: bleed, crop marks, spine calculation, printer proofing and a print-provider checkout still need to be built.

## Suggested next engineering stages

1. Add a production backend (authentication, Postgres metadata, object storage, row-level authorization and signed uploads).
2. Move the editor document model to a versioned schema and add robust history/undo, multi-select, layers, snapping, resizing, better inline rich-text controls and accessibility.
3. Add cloud sync, conflict handling, device management and encrypted export/restore flows.
4. Build a native-feeling touch/stylus experience and validate Pencil pressure/tilt/palm rejection on actual iPad hardware.
5. Implement explicit sharing permissions and community moderation before opening social features.
6. Build print profiles, bleed/safe-area checks, page imposition and a print-provider integration.
7. Add tests and automated visual regression across desktop, iOS Safari, Android Chrome and tablet breakpoints.