# Project UI Design System & Guidelines

## 1. Typography & Font Style
- **Font Family**: Defined in `src/index.css`
  ```css
  font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  ```
- **Font Sizes (Tailwind standard)**:
  - Headers/Titles: `text-xl` (20px) to `text-2xl` (24px) with `font-bold` or `font-semibold`.
  - Regular Body & Buttons: `text-sm` (14px) with `font-medium`.
  - Labels, Badges, & Small Metadata: `text-xs` (12px) with `font-semibold` or `font-normal`.
  - Micro-indicators: `text-[10px]`.

## 2. Color Palette & Brand Theme
- **Brand Accent Color (Main Green)**: `#00891D` (mapped to Tailwind `green-600`).
- **Complete Green Palette**:
  - `50`: `#e8f5ea`
  - `100`: `#c8e6c9`
  - `200`: `#a5d6a7`
  - `300`: `#81c784`
  - `400`: `#4caf50`
  - `500`: `#00a322`
  - `600`: `#00891D` (Primary Brand Green)
  - `700`: `#006b17`
  - `800`: `#005212`
  - `900`: `#003d0e`
  - `950`: `#002909`
- **Color Mapping Alias**: Both `teal` and `cyan` color sets are mapped to the same green shades in configuration.
- **Neutral Backgrounds & Surfaces**:
  - **Light Mode**: Pure white (`bg-white`), cool grey borders (`border-gray-200`), primary text (`text-gray-900`), and subtext (`text-gray-600` / `text-gray-500`).
  - **Dark Mode** (Class-based): Dark slate surface (`bg-gray-800`), deep background (`bg-gray-900`), border gray (`border-gray-700`), primary text (`text-white` / `text-gray-100`), and subtext (`text-gray-400` / `text-gray-500`).

## 3. Key Layout and Component Settings
- **Border Radii**:
  - Input fields, Select fields, Buttons, and Cards: `rounded-lg` (8px radius) or `rounded-xl` (12px radius).
  - Status badges/pills: `rounded-full`.
- **Form Inputs & Interactive States**:
  - Padding: `px-3 py-2.5` or `px-4 py-2`.
  - Focus borders & Rings: `focus:ring-1 focus:ring-[#00891D] focus:border-[#00891D]`.
  - Disabled states: `disabled:bg-gray-50` (Light mode), `dark:bg-gray-700/50` (Dark mode) with text gray out.
- **Scrollbars**: Thin scrollbars customized inside CSS for `.sidebar-scrollbar`, `.table-scrollbar`, and `.tabs-scrollbar` to prevent bulky default scrollbars.
- **Icons**: Powered by `lucide-react` (typically sized at `size={18}` or `size={20}`).
