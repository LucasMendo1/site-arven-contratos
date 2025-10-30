# Design Guidelines - ARVEN Contract Capture System

## Design Approach
**Reference-Based Approach**: Inspiração em plataformas modernas de SaaS como Linear e Stripe, com foco em clareza, confiança e profissionalismo. O design prioriza conversão de formulário e experiência administrativa eficiente.

## Brand Colors (ARVEN Identity)
Based on the provided brand image:
- **Primary Navy**: #1a2332 (dark blue/navy from logo)
- **Accent Blue**: #2563eb (vibrant blue for CTAs and highlights)
- **White/Light**: #ffffff (backgrounds, text on dark)
- **Gray Scale**: 
  - Light: #f3f4f6 (subtle backgrounds)
  - Medium: #6b7280 (secondary text)
  - Dark: #111827 (primary text)
- **Success Green**: #10b981 (form success states)
- **Error Red**: #ef4444 (validation errors)

## Typography System
- **Primary Font**: Inter (via Google Fonts CDN)
- **Headings**: 
  - H1: 2.5rem (40px), font-weight 700, tracking tight
  - H2: 2rem (32px), font-weight 600
  - H3: 1.5rem (24px), font-weight 600
- **Body**: 
  - Large: 1.125rem (18px), font-weight 400, leading relaxed
  - Regular: 1rem (16px), font-weight 400
  - Small: 0.875rem (14px), font-weight 400
- **Labels**: 0.875rem (14px), font-weight 500, uppercase tracking

## Layout & Spacing System
**Tailwind Units**: Use consistent spacing primitives of 2, 4, 6, 8, 12, 16, 20, 24
- **Section Padding**: py-16 md:py-24 (vertical breathing room)
- **Component Spacing**: space-y-6 to space-y-8 (between form elements)
- **Container**: max-w-md for forms, max-w-7xl for dashboard
- **Grid Gaps**: gap-4 to gap-6 for card layouts

## Landing Page - Contract Capture Form

### Layout Structure
**Single-column centered form** (not full viewport height - natural content flow):

1. **Header Section** (py-8, bg-navy-primary):
   - ARVEN logo (left-aligned, h-8 to h-10)
   - Minimal navigation (logout if authenticated)
   - Full-width with max-w-7xl container

2. **Hero/Introduction Section** (py-12 to py-16, bg-gradient from navy to darker navy):
   - Centered content, max-w-2xl
   - Headline: "Formalize Seu Contrato" (H1, white text)
   - Subheading: Brief explanation of the process (body-large, white/80% opacity)
   - No background image - clean gradient background

3. **Form Container** (py-12, bg-white or light-gray):
   - Centered card with shadow-xl, max-w-md
   - White background with rounded-2xl borders
   - Padding: p-8 to p-12

### Form Design Elements

**Progressive Multi-Step Visual** (numbered steps 1-5):
- Step indicators at top of form (horizontal stepper)
- Active step in accent-blue, completed in success-green, upcoming in gray
- Clear visual progression to reduce abandonment

**Input Fields** (consistent styling across all):
- Label: Uppercase, tracking-wide, text-sm, font-medium, gray-dark, mb-2
- Input: 
  - Border: 2px solid gray-light, rounded-lg
  - Focus: border-accent-blue, ring-4 ring-accent-blue/10
  - Padding: px-4 py-3
  - Font-size: text-base
  - Error state: border-red, with error message below in text-red text-sm

**Field Specifications**:

1. **Nome do Cliente**: 
   - Full-width text input
   - Placeholder: "Digite o nome completo"

2. **Número do Cliente**:
   - Tel input with masking (format display)
   - Placeholder: "(00) 00000-0000"

3. **Tempo de Contrato**:
   - Radio button group styled as cards
   - 2x2 grid on mobile, 4 columns on desktop
   - Each option: 
     - Rounded-lg border, p-4
     - Selected: border-accent-blue bg-accent-blue/5
     - Hover: border-accent-blue/50
   - Options: "3 Meses", "6 Meses", "1 Ano", "2 Anos"

4. **Produto Comprado**:
   - Dropdown select with custom styling
   - Chevron down icon (Heroicons)

5. **Upload de Contrato**:
   - Drag-and-drop zone with dashed border
   - Icon: Document icon (Heroicons, text-6xl)
   - Text: "Arraste o PDF ou clique para selecionar"
   - Accepted: .pdf only
   - After upload: Show filename with remove button
   - Visual: rounded-lg, border-2 border-dashed, py-8, text-center

**Submit Button**:
- Full-width (w-full)
- Background: accent-blue with gradient
- Text: White, font-semibold, text-lg
- Padding: py-4
- Rounded-lg
- Hover: Slightly darker blue
- Loading state: Spinner icon with "Enviando..." text
- Text: "Enviar Contrato"

**Success State** (after submission):
- Replace form with success message
- Large checkmark icon (success-green)
- Heading: "Contrato Enviado com Sucesso!"
- Subtext: "Você receberá uma confirmação em breve"

## Login Page

### Layout
**Centered authentication card**:
- Full viewport height with centered content (min-h-screen flex items-center justify-center)
- Background: Subtle gradient from light-gray to white
- ARVEN logo at top of card

### Login Card Design
- max-w-md, white background
- shadow-2xl, rounded-2xl
- Padding: p-10

**Elements**:
1. Logo section (mb-8, text-center)
2. Heading: "Área Administrativa" (H2, navy-primary, text-center, mb-2)
3. Subheading: "Acesse o painel de contratos" (text-gray-medium, text-center, mb-8)
4. Email input (same style as form inputs)
5. Password input (with show/hide toggle icon)
6. "Esqueceu a senha?" link (text-accent-blue, text-sm, underline on hover)
7. Login button (same style as submit button, text: "Entrar")

## Admin Dashboard

### Layout Structure
**Sidebar + Main Content** layout:

**Sidebar** (fixed, h-screen, w-64, bg-navy-primary):
- ARVEN logo at top (p-6)
- Navigation items:
  - "Contratos" (with document icon)
  - "Configurações" (with cog icon)
  - "Webhooks" (with link icon)
- Logout button at bottom
- Active nav item: bg-white/10, border-l-4 border-accent-blue

**Main Content Area**:
- Full width minus sidebar
- Top bar: 
  - Breadcrumb navigation
  - User profile dropdown (right-aligned)
  - Background: white, border-b
  - Padding: px-8 py-4

### Contracts Dashboard
**Header Section** (px-8 py-6):
- H1: "Contratos Capturados"
- Stats cards (3-column grid):
  - Total Contratos
  - Contratos Este Mês
  - Pendentes de Revisão
- Each card: white bg, rounded-xl, shadow, p-6, with icon and number

**Table Section** (px-8 py-6):
- Search bar (top, w-full md:w-96)
- Filters: Dropdown for contract duration, date range picker
- Data table:
  - Columns: Nome, Número, Produto, Duração, Data, PDF, Ações
  - Row style: hover:bg-gray-light/50
  - Alternating row backgrounds for readability
  - PDF: Download icon button
  - Ações: View details icon, Delete icon (red)
  - Pagination at bottom

**Detail Modal** (when viewing contract):
- Overlay: backdrop-blur, bg-black/50
- Modal: max-w-2xl, white, rounded-2xl, shadow-2xl
- All contract details displayed
- PDF preview or download button
- Close button (top-right)

## Component Library

### Buttons
- **Primary**: bg-accent-blue, text-white, rounded-lg, px-6 py-3, hover:bg-accent-blue/90
- **Secondary**: border-2 border-gray-medium, text-gray-dark, hover:bg-gray-light
- **Danger**: bg-error-red, text-white
- **Icon buttons**: rounded-full, p-2, hover:bg-gray-light

### Cards
- **Default**: bg-white, rounded-xl, shadow-md, p-6
- **Hover**: shadow-lg transition
- **Interactive**: cursor-pointer, border-2 transparent, hover:border-accent-blue

### Icons
**Use Heroicons** (via CDN) consistently throughout:
- Document icon for contracts
- User icon for profile
- Cog icon for settings
- Check icon for success
- X icon for close/delete
- Upload icon for file upload
- Download icon for PDF download

## Animations
**Minimal, purposeful animations**:
- Form submission: Button loading spinner
- Page transitions: Subtle fade-in (200ms)
- Hover states: Scale 1.02 for cards
- Modal: Fade in with slight scale-up
- **No** scroll-triggered animations or excessive motion

## Responsive Behavior
- **Mobile (<768px)**: Single column, full-width forms, stacked stats, sidebar becomes bottom nav
- **Tablet (768px-1024px)**: 2-column stats, sidebar remains
- **Desktop (>1024px)**: Full multi-column layouts, optimal spacing

## Accessibility
- All inputs have visible labels and proper focus states
- Error messages announced to screen readers
- Keyboard navigation throughout
- Color contrast ratio minimum 4.5:1 for text
- Skip to content link for dashboard

## Images
**No hero images needed** - The design relies on clean gradients and professional typography to establish trust. The ARVEN logo serves as the primary visual brand element.

**Logo placement**:
- Landing page header: Left-aligned, h-10
- Login card: Centered at top, h-12
- Dashboard sidebar: Top of sidebar, h-8