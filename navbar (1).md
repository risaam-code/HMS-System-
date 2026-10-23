# Navbar Component

**File:** `src/components/Navbar.tsx`

## Overview

The SESOC Navbar is a responsive, floating navigation bar built with **React**, **Framer Motion**, and **Tailwind CSS**. It adapts its appearance based on scroll position and screen size, providing a modern "floating pill" effect inspired by the [Header-2](https://21st.dev/r/sshahaider/header-2) design pattern.

---

## Behaviour

### Scroll State

| State | Appearance |
|---|---|
| **At top** (scrollY ≤ 10px) | Full-width · edge-to-edge · transparent frosted glass · no rounded corners |
| **Scrolled** (scrollY > 10px) | Floats with `pt-3` offset · shrinks to `max-w-5xl` · `rounded-2xl` corners · shadow |

The transition uses `duration-300 ease-out` for a smooth feel.

### Active Link Highlighting

The current route is detected via `useLocation()` from React Router. The active link receives:
- Text color: `#049bdb` (SESOC blue)
- Background: `#049bdb/10` (subtle tint)
- Inactive links: `text-white/75`, turn full white on hover

### Mobile Menu

- Triggered by a hamburger `Menu` icon (hidden on `lg:` and above)
- Opens a **full-screen overlay** (`fixed inset-0`) with a `#011e36/95` backdrop
- Nav links stagger in from the left with a 60ms delay between each
- A **Join Membership** CTA button appears at the bottom of the overlay
- The icon animates: `Menu` rotates out, `X` rotates in (using `AnimatePresence`)

### Scroll Lock

When the mobile menu is open, `document.body.style.overflow = 'hidden'` prevents the page behind from scrolling. This is cleaned up on unmount.

### Auto-close on Navigation

The mobile menu closes automatically whenever the route changes (`location.pathname`), so users don't need to manually dismiss it after tapping a link.

---

## Navigation Links

Defined in the `navItems` array at the top of the component. To add, remove, or reorder links, edit this array:

```tsx
const navItems = [
  { href: '/',            label: 'Home' },
  { href: '/feeds',       label: 'Feeds' },
  { href: '/projects',    label: 'Projects' },
  { href: '/committee',   label: 'Committee' },
  { href: '/merchandise', label: 'Merchandise' },
  { href: '/contact',     label: 'Contact' },
]
```

---

## Color Tokens

| Token | Value | Usage |
|---|---|---|
| `#011e36` | Deep navy | Background, mobile overlay |
| `#049bdb` | SESOC blue | Active links, CTA button, hover accents |
| `#93ceff` | Light blue | Secondary accents (CTA gradient) |
| `white/75` | Semi-white | Inactive nav link text |
| `white/10` | Semi-white | Hamburger button background |

---

## Dependencies

| Package | Purpose |
|---|---|
| `react-router-dom` | `Link`, `useLocation` for routing and active state |
| `framer-motion` | `motion`, `AnimatePresence` for all animations |
| `lucide-react` | `Menu`, `X` icons for the hamburger toggle |

> No shadcn/ui or external component libraries are used.

---

## Structure

```
<header>                          ← Fixed positioned shell, handles scroll padding
  <nav>                           ← Floating pill container (transitions on scroll)
    Logo (OUSL + SESOC)
    Desktop links                 ← Hidden below lg breakpoint
    Desktop CTA (Membership)      ← Hidden below lg breakpoint
    Mobile hamburger button       ← Visible below lg breakpoint
  </nav>
</header>

<AnimatePresence>
  Mobile overlay (fixed inset-0)  ← Full-screen, z-40, sits below header (z-50)
    Staggered nav links
    Join Membership button
</AnimatePresence>
```

---

## Customisation

### Change scroll threshold

The navbar switches state when `window.scrollY > 10`. To adjust:

```tsx
// src/components/Navbar.tsx — line 22
const onScroll = () => setScrolled(window.scrollY > 10)
//                                              ^^^ change this value
```

### Change floating width

When scrolled, the navbar shrinks to `max-w-5xl`. To make it wider or narrower:

```tsx
// change max-w-5xl to any Tailwind max-width class
'max-w-5xl rounded-2xl bg-[#011e36]/90 ...'
```

### Add a new nav link

Append to the `navItems` array and create the corresponding route in `src/App.tsx`:

```tsx
{ href: '/events', label: 'Events' },
```
