# Document Templates

Business Kit ships with 5 document templates. Each template is a React component that receives a `Document` object and renders a preview or PDF layout.

## Available Templates

### Minimal
- Clean, borderless, whitespace-focused design
- Uses Geist Sans throughout
- Best for: freelancers, modern brands

### Modern
- Dark header bar with blue-to-purple gradient accent stripe
- Table header with gray background
- Best for: tech companies, startups

### Corporate
- Serif font (Lora), fully bordered table, double-rule bookend headers
- Framed "Bill To" and reference cards with gray backgrounds
- Footer with company contact info
- Best for: traditional businesses, formal documents

### Elegant
- Amber accent palette (amber-700/200/50)
- Asymmetric rounded panel (`rounded-bl-3xl rounded-tr-3xl`)
- Centered "Items" divider with horizontal rule
- Amber-tinted footer and bottom stripe
- Best for: boutique businesses, luxury services

### Dark
- Full dark theme (bg-gray-900, text-gray-100)
- Monospace doc number typography
- Rounded bordered cards with translucent backgrounds
- Best for: modern tech, dark-mode users

## Adding a New Template

1. Create `src/templates/yourtemplate.tsx`
2. Export a default function accepting `{ document: Document }`
3. Use shared helpers from `shared.tsx` (`ItemRow`, `TotalsSection`, etc.)
4. Add the template key to `TEMPLATES` in `src/types/index.ts`
5. Add import in `src/features/documents/components/document-preview.tsx`
