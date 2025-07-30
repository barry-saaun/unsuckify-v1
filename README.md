# Unsuckify

Rediscover your Spotify playlists with AI-powered recommendations. This application analyzes your existing playlists and suggests new tracks to enhance your listening experience.

## Core Features

- **Spotify Integration:** Securely connect to your Spotify account to access and manage your playlists.
- **AI-Powered Recommendations:** Leverages Google's Gemini AI to analyze the tracks in a selected playlist and generate a list of new, relevant song recommendations.
- **Dynamic Playlist Management:**
  - Create new playlists, either empty or pre-filled with recommended tracks.
  - Seamlessly add recommended tracks to your existing playlists.
  - Remove tracks that don't fit the vibe.
- **Intelligent Caching:** Recommendations for a playlist are cached for 24 hours, allowing you to revisit them without waiting for the AI to re-process.
- **Browse and Discover:**
  - View your existing Spotify playlists directly within the app.
  - Explore AI-generated recommendations with an infinite-scrolling interface.
  - Each recommendation card includes album art and track details.

## Tech Stack

This project is built with a modern, full-stack TypeScript architecture.

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **UI:** [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), and [shadcn/ui](https://ui.shadcn.com/)
- **API Layer:** [tRPC](https://trpc.io/) for end-to-end typesafe APIs
- **Database:** [Neon](https://neon.tech/) (Serverless Postgres)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **AI:** [Google AI SDK](https://ai.google.dev/) (`gemini-2.0-flash`)
- **Authentication:** Spotify OAuth 2.0
- **Form Management:** [React Hook Form](https://react-hook-form.com/)
- **Environment Variables:** [T3 Env](https://env.t3.gg/)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- [Bun](https://bun.sh/) (or npm/yarn)
- A Spotify Developer App for API credentials.

### Installation

1.  Clone the repo:
    ```sh
    git clone https://github.com/your_username/unsuckify-v1.git
    ```
2.  Install dependencies:
    ```sh
    bun install
    ```
3.  Set up your environment variables by copying `.env.example` to `.env` and filling in the required values (Spotify credentials, database URL, etc.).
4.  Run the development server:
    ```sh
    bun dev
    ```

The application should now be running on [http://localhost:3000](http://localhost:3000).