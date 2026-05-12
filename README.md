# insightO Frontend

React + TypeScript frontend for the insightO Enterprise EdTech SaaS platform.

## Stack

- React 19 + TypeScript (Vite)
- Tailwind CSS + PostCSS
- Routing: react-router-dom
- State: Redux Toolkit + react-redux (and Zustand installed for lightweight stores)
- UI/UX: lucide-react, framer-motion, react-hot-toast
- Forms: react-hook-form + zod + @hookform/resolvers
- Networking: axios
- Utilities: date-fns, html2canvas

## Project Structure

```text
frontend/
  src/
    assets/       # Static assets
    components/   # Reusable UI components
    hooks/        # Custom React hooks
    pages/        # Route-level pages/screens
    services/     # API clients and domain services
    store/        # Redux store and slices
    types/        # Shared TypeScript types/interfaces
    utils/        # Utility helpers
```

## Weekly Switch Workflow

1. Pull latest `main`.
2. Run `npm install` in this directory.
3. Build by feature vertically:
   - `pages` + `components`
   - API logic in `services`
   - state in `store`
4. Keep Zod schemas close to forms or domain boundaries.
5. Use motion and toast feedback consistently for user-facing async flows.

## Local Setup

```bash
npm install
npm run dev
```

Tailwind has been initialized with:

- `tailwind.config.js`
- `postcss.config.js`
