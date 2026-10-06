# SSM Travel & Tours Co., Ltd.

Offline-capable PWA for an India and Bhutan travel agency: packages, visa, passport, air tickets, revenue comparison, heatmaps and calendar export.

![Architecture](architecture.png)

## Run it

```bash
cd app
npm install
npm run dev        # development, http://localhost:5173
```

Production build (needed to test offline and install as an app):

```bash
npm run build
npm run preview    # http://localhost:4173
```

Tests: `npm test`

## Notes
- Data is stored on the device (IndexedDB). Use Settings > Backup to export it.
- The first launch loads demo data; reset or erase it in Settings.
- Stack: React, Vite, TypeScript, Tailwind, Dexie, ECharts, Leaflet, vite-plugin-pwa.
