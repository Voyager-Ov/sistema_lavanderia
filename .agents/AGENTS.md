# Design & Architecture Rules

- **Overlays (Modals & Sheets)**: ALWAYS use the `ResponsiveSheet` component (from `src/shared/ui/overlays/responsive-sheet.tsx`) for side panels, forms, and detail views. This component automatically provides a standardized `BottomSheet` on mobile and a fixed-width `SideSheet` on desktop. Do not override its dimensions (`max-w-`, `w-`, `h-`) via `className` to maintain uniform sizing and margins across the entire application.
