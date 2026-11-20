# Morrow — Product architecture

## Product principle

The journal itself is the product. Navigation, statistics and productivity tools should support the act of making a personal book, not replace it with a generic dashboard.

## Product areas

### 1. Journal library
- Create multiple journals with distinct cover styles and descriptions.
- Archive, restore, rename and remove a journal.
- Keep journals as independent books, not just folders of notes.

### 2. Book editor
- Two-page spread with configurable paper, size and date.
- Absolute-positioned elements: rich text, quotes, photographs, stickers, checklists, audio, video and attachments.
- Handwriting and drawing through Pointer Events.
- Templates for daily, weekly, gratitude, travel, ideas and dream pages.
- Page duplicate, delete, reorder foundation, zoom and print/export.

### 3. Life organisation
- Calendar with page markers.
- Habits and goals with progress.
- Daily mood check-in.
- Search across journals and page content.
- Memories view and annual recap.

### 4. Personalisation
- Paper textures and page sizes.
- Cover styles and sticker drawer.
- Text size, colour, inline formatting and custom layouts.
- Save the current page as a reusable personal template; next: reusable stamps, font library, grids and layout presets.

### 5. Community and sharing (planned, not active in local build)
- Private-by-default account model.
- Explicit page-level sharing, separate from journal-level visibility.
- Public profile, follows, reactions and curated discovery only after server-side permission checks and moderation exist.

### 6. Print (initial browser print, production print service later)
- Page-sized print document from saved pages, with A5, A4 and square formats.
- Later: print profiles, trim/bleed/safe areas, resolution validation, cover/spine generation, proof preview and a print-provider integration.

## Technical direction

### Local foundation
The current build is dependency-free HTML/CSS/JavaScript. It persists the app state in IndexedDB (with localStorage fallback), supports JSON backup/restore and uses a PWA shell cache. That makes the project easy to run and inspect while the experience is being shaped.

### Production architecture target
- Frontend: component-based TypeScript app with a dedicated editor engine and accessible responsive shells.
- Auth: managed authentication with secure sessions and account recovery.
- Database: Postgres for users, journals, pages, element metadata, goals, habits, check-ins, sharing grants and audit records.
- Media: object storage for photos, audio, video, scans, exports and print files; signed upload/download URLs.
- Sync: versioned page documents, optimistic concurrency, conflict resolution and offline queue.
- Search: server-side search over permitted metadata and text, with private data isolation.
- AI: optional user-triggered tools only; never train or infer from private journal content without explicit consent.
- Print: render pipeline from canonical page documents to print-ready PDFs with validation and proofing.

## Data model direction
- `users`: identity, preferences, privacy defaults.
- `journals`: owner, title, description, cover, archive state, timestamps.
- `pages`: journal, date, title, order, size, paper, schema version.
- `page_elements`: type, position, dimensions, style, content, z-index.
- `media_assets`: owner, object key, media type, file size, checksum, metadata.
- `goals`, `habits`, `habit_completions`, `check_ins`.
- `sharing_grants`: explicit page-level scope, audience, expiry and revoke state.
- `follows`, `reactions`, `reports`, `moderation_actions` (later, behind privacy/security controls).

## Non-negotiable quality gates
1. No public exposure of private pages through predictable URLs or client-side flags.
2. Every interaction shown in the product has a working behavior or is clearly marked as planned.
3. The editor remains usable on desktop, phone and tablet, including keyboard and assistive input.
4. Stylus input is validated on real hardware; browser pointer events are a baseline, not proof of full Pencil integration.
5. Print output is checked for page size, margins, image resolution, bleed and page order before any printer integration.
6. Backups and deletion flows are tested before cloud launch.