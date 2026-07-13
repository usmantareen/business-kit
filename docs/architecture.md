# Architecture

## App Router Layout

```
RootLayout (layout.tsx)
└── ThemeProvider + Toaster
    └── (main)/layout.tsx
        └── AppShell
            ├── Sidebar
            ├── Topbar
            └── Page content
```

## Data Flow

- All data is stored in IndexedDB via the `idb` wrapper (`src/lib/db.ts`)
- Zustand stores (`src/lib/stores/`) provide reactive access to IndexedDB
- Each store has `load()`, `add()`, `update()`, `remove()` methods
- Stores are the single source of truth; components subscribe via hooks

## Stores

| Store | File | Data |
|-------|------|------|
| `useDocumentStore` | `document-store.ts` | Documents (invoices, quotes, etc.) |
| `useCustomerStore` | `customer-store.ts` | Customers |
| `useProductStore` | `product-store.ts` | Products |
| `useSettingsStore` | `settings-store.ts` | Settings (company, tax, currency, etc.) |

## Template System

Documents are rendered using 5 template components in `src/templates/`:
- Each template receives a `Document` object
- Templates share helpers via `shared.tsx`
- Preview and PDF use the same rendering path

## PDF Generation

PDFs are generated client-side using `pdf-lib` in `src/services/pdf.ts`. The same template components used for preview are also used for PDF layout.
