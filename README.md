# UNLOCKED Web — Escape Room Platform

The web frontend for the **UNLOCKED** escape room discovery and booking platform. Built with **Next.js 14**, **Tailwind CSS**, and **Convex** (shared backend with the mobile app).

## Pages

| Route           | Description                                       |
|-----------------|---------------------------------------------------|
| `/`             | Landing page — hero, featured rooms, themes, how it works, testimonials, business CTA |
| `/about`        | About page — mission, values, timeline, business partnership info |
| `/login`        | Player/company login with email + Apple Sign In   |
| `/signup`       | Player registration with password strength meter  |
| `/leaderboard`  | Player leaderboard, top rooms, badges gallery     |
| `/contact`      | Contact form, FAQ accordion, business CTA         |

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (dark theme matching the mobile app)
- **Lucide React** (icons)
- **Convex** (real-time backend — shared with `escape-app`)
- **Framer Motion** (animations, available for enhancement)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Convex URL

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## Connecting to Convex Backend

This web app is designed to use the **same Convex backend** as the `escape-app` mobile project. To connect:

1. Copy `CONVEX_URL` from your escape-app's `.env.local`
2. Set `NEXT_PUBLIC_CONVEX_URL` in this project's `.env.local`
3. Copy the `convex/` folder from escape-app into this project root
4. Run `npx convex dev` to generate TypeScript types
5. Update the hooks in `src/lib/convex.ts` to use the generated API

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (Navbar + Footer + Convex)
│   ├── page.tsx            # Home page
│   ├── about/page.tsx      # About page
│   ├── login/page.tsx      # Login page
│   ├── signup/page.tsx     # Signup page
│   ├── leaderboard/page.tsx # Leaderboard page
│   └── contact/page.tsx    # Contact page
├── components/
│   ├── home/               # Home page sections
│   ├── layout/             # Navbar, Footer
│   └── providers/          # Convex provider
└── lib/
    ├── auth.tsx            # Authentication context
    ├── convex.ts           # Convex types & hook stubs
    └── i18n.tsx            # EN/EL translations
```

## Design System

- **Background**: `#1A0D0D` (dark)
- **Accent**: `#FF1E1E` (red)
- **Cards**: `#2A1515` with `#4A2A2A` borders
- **Font**: Inter (body), Poppins (headings)
- **Style**: Glass morphism, glow effects, smooth transitions
