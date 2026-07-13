# Business Kit

**Professional business document generator for freelancers, agencies, startups, and small businesses.**

Create invoices, quotations, estimates, receipts, and more — entirely in your browser. No account. No subscriptions. No data leaves your device.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)](https://www.typescriptlang.org/)

---

## Features

### Document Types

| Type | Description |
|------|-------------|
| Invoice | Request payment for goods or services |
| Quotation | Provide a price estimate for potential work |
| Estimate | Give an approximate cost for a project |
| Receipt | Acknowledge payment received |
| Purchase Order | Authorize a purchase from a vendor |
| Credit Note | Issue a refund or credit adjustment |
| Proforma Invoice | Preliminary invoice before final billing |
| Delivery Challan | Record goods delivered |

- Shared editor — labels adapt per document type
- Convert between types (Quote → Invoice, Estimate → Invoice, etc.)
- One-click duplicate

### Dashboard

- Total Invoices, Revenue, Outstanding, Drafts, Customers, Products
- Revenue overview chart (theme-aware)
- Recent documents with status

### Invoice Builder

- Company logo, info, and tax number
- Customer selection with Bill To / Ship To
- Auto-numbering per document type
- **Product auto-fill** — search and select saved products
- Items table with drag-to-reorder, duplicate, and keyboard navigation
- Automatic calculations (subtotal, discount, tax, shipping, grand total)
- Reusable notes and terms templates
- Signature (draw or upload) and company stamp
- UPI QR code generation

### Customer Management

- Company, contact, tax number, billing/shipping addresses
- Search, favorites, inline edit, delete

### Product Library

- Name, description, SKU, unit, price, tax, category
- Search, favorites, category filtering
- **Auto-fill into invoices** directly from the builder

### Tax Systems

- GST, CGST, SGST, IGST, VAT, Sales Tax, Custom tax presets

### Currencies

- INR, USD, EUR, GBP, AED, CAD, AUD + custom currencies
- Indian (1,50,000) and International (150,000) number formatting

### Payment Methods

- UPI (with auto-generated QR code), Bank Transfer, PayPal, Stripe, Cash, Cheque, Custom

### Document Templates

- **Minimal** — Clean, borderless, Swiss-style
- **Modern** — Dark header with gradient accent stripe
- **Corporate** — Serif font, bordered table, formal layout
- **Elegant** — Amber accents, asymmetric rounded panels
- **Dark** — Full dark theme, monospace numerals

### PDF Export

- A4 and Letter sizes
- Portrait and Landscape
- Exact match to preview (pdf-lib powered)

### Analytics

- Revenue over time
- Payment status breakdown (semantic colors: green=paid, amber=pending, red=overdue)
- Documents by type
- Top customers

### Additional

- Dark mode (Light / Dark / System)
- Full-text search and status/type filters
- JSON backup and restore
- Command palette (Cmd+K) for navigation and document creation
- Keyboard shortcuts (Ctrl+S save, Ctrl+P preview, Ctrl+D duplicate)
- Fully offline (IndexedDB) — no account required
- **First-run setup wizard** — get started in 4 steps

---

## Screenshots

*(Screenshots coming soon)*

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org/) (App Router) | Framework |
| [TypeScript](https://www.typescriptlang.org/) | Language |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styling |
| [shadcn/ui](https://ui.shadcn.com/) | UI Components |
| [Zod](https://zod.dev/) | Validation |
| [React Hook Form](https://react-hook-form.com/) | Forms |
| [Zustand](https://github.com/pmndrs/zustand) | State Management |
| [IndexedDB (idb)](https://github.com/jakearchibald/idb) | Local Storage |
| [TanStack Table](https://tanstack.com/table) | Tables |
| [Chart.js](https://www.chartjs.org/) | Charts |
| [pdf-lib](https://pdf-lib.js.org/) | PDF Generation |
| [dnd-kit](https://dndkit.com/) | Drag & Drop |
| [date-fns](https://date-fns.org/) | Date Handling |
| [Lucide React](https://lucide.dev/) | Icons |
| [next-themes](https://github.com/pacocoursey/next-themes) | Dark Mode |

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/usmantareen/business-kit.git
cd business-kit

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

---

## Project Structure

```
├── docs/                   # Documentation (architecture, shortcuts, templates)
├── public/                 # Public assets (icons, logos, SVGs)
├── screenshots/            # Screenshots
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── (main)/         # Main app layout (with sidebar)
│   │   │   ├── page.tsx    # Dashboard
│   │   │   ├── analytics/  # Analytics page
│   │   │   ├── customers/  # Customer management
│   │   │   ├── documents/  # Document list, editor, preview
│   │   │   ├── products/   # Product library
│   │   │   └── settings/   # Settings (10 tabs)
│   │   ├── layout.tsx      # Root layout
│   │   └── globals.css     # Global styles + Tailwind CSS v4 variables
│   ├── components/         # UI components
│   │   ├── ui/             # shadcn/ui primitives
│   │   ├── layout/         # Sidebar, Topbar, AppShell
│   │   └── shared/         # EmptyState, StatCard, Spinner, etc.
│   ├── features/           # Feature-specific page contents/charts
│   │   ├── analytics/      # Analytics chart components
│   │   ├── dashboard/      # Dashboard sub-components
│   │   └── documents/      # Document builder components
│   ├── lib/                # Utilities, helper formatters, stores
│   │   ├── db.ts           # IndexedDB wrapper (idb)
│   │   ├── formatters.ts   # Number & date formatting
│   │   └── stores/         # Zustand state stores (document, customer, product, settings)
│   ├── services/           # Helper services (PDF generation, QR codes, import/export)
│   ├── templates/          # 5 document template renderers (Minimal, Modern, Corporate, Elegant, Dark)
│   └── types/              # Zod schemas & TypeScript type definitions
└── LICENSE                 # MIT License
```

---

## Documentation

Detailed documentation is available in the [docs](docs/) directory:

- [Architecture & Data Flow](docs/architecture.md) — How the App Router, IndexedDB, and Zustand state flow together.
- [Keyboard Shortcuts](docs/shortcuts.md) — Comprehensive guide to keyboard shortcuts and the command palette.
- [Document Templates](docs/templates.md) — Overview of the 5 built-in templates and how to build a custom template.

---

## Roadmap

- [ ] Invoice reminders
- [ ] Barcode support
- [ ] Cloud sync (future)
- [ ] AI item description generator (future)
- [ ] Multi-language support

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open command palette |
| `Ctrl/Cmd + S` | Save document (in builder) |
| `Ctrl/Cmd + P` | Preview document (in builder) |
| `Ctrl/Cmd + D` | Duplicate document (in builder) |
| `Delete` | Remove item row (when field empty) |

---

## Contributing

Contributions are welcome! Feel free to open a pull request or submit issues for any bugs, improvements, or new feature requests.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Why Business Kit?

Built for freelancers, agencies, and small businesses who need professional documents without:

- Monthly subscriptions
- Creating an account
- Uploading data to the cloud
- Unnecessary ERP features
- Clutter and complexity

Everything runs locally in your browser. Your data stays yours.
