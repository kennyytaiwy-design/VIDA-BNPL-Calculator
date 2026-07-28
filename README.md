# VIDA BNPL Loan Calculator

A standalone, client-side Progressive Web App (PWA) for calculating Buy Now, Pay Later (BNPL) repayment plans for VIDA. 

This app allows users to enter an item cost, down payment, and tenor to instantly see their monthly repayment breakdown. It is purely informational and offline-capable, featuring no backend, databases, or complex API routes.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)

## Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd bnpl-loan-calculator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Copy the example environment file to create your local environment configuration:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and replace the placeholder values with your real PostHog Project API Key and Host URL. **Note:** `.env.local` is already ignored in `.gitignore` to prevent leaking analytics credentials.

4. **Fonts:**
   The required brand fonts (`Clash Display` and `Clash Grotesk`) are self-hosted via `next/font/local`. The font asset files (`.woff2`) are already committed to the repository under `public/fonts/` and explicitly referenced in `app/fonts.ts`. No additional font setup is required.

## Local Development

To run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app will hot-reload as you make changes.

## Production Build & Offline PWA Testing

This app uses a **custom service worker** (`public/sw.js`) to provide robust offline PWA support (caching the app shell, styling, and the logo). 

**Important:** The service worker caching logic will *only* activate and function correctly in a true production build, not via the development server.

To test the offline features or verify production performance:

```bash
npm run build && npm run start
```
*After the server starts, open the app, hard refresh twice to populate the service worker cache, then simulate offline mode in your browser's Network tab to confirm it works without an internet connection.*

## Deployment to Vercel

1. Push your code to a Git provider (GitHub, GitLab, or Bitbucket).
2. Import the project into Vercel.
3. In the Vercel project settings, navigate to **Environment Variables** and add your real PostHog credentials:
   - `NEXT_PUBLIC_POSTHOG_KEY`
   - `NEXT_PUBLIC_POSTHOG_HOST`
4. Deploy! Vercel will automatically run `npm run build` and host the static assets seamlessly.
