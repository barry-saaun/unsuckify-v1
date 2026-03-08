# Unsuckify 🎵

> **"Stop listening to the same 67 songs."**

Unsuckify is a high-performance music discovery engine built to break the "feedback loop" of traditional streaming algorithms. Instead of relying on popularity-based filters, Unsuckify uses high-dimensional vector embeddings to analyze the semantic and sonic profile of your Spotify playlists, delivering recommendations that actually fit your vibe.

This project serves as a technical showcase of **event-driven architecture**, **vector similarity search**, and **type-safe full-stack engineering**.

---

## 🛠️ Tech Stack & Architecture

This application is built with the **T3 Stack** and extended with modern infrastructure for high-scale data processing.

### **Core Infrastructure**

- **Framework:** [Next.js 15 (App Router)](https://nextjs.org/)
- **API Layer:** [tRPC v11](https://trpc.io/) for end-to-end type safety.
- **Database (SQL):** [Neon](https://neon.tech/) (Serverless Postgres) with [Drizzle ORM](https://orm.drizzle.team/).
- **Vector Database:** [Pinecone](https://www.pinecone.io/) for high-performance similarity search on track embeddings.
- **Event Orchestration:** [Inngest](https://www.inngest.com/) for handling complex, asynchronous ingestion pipelines.
- **AI/LLM:** [Vercel AI SDK](https://sdk.vercel.ai/) + OpenAI for generating semantic song embeddings.

### **Architecture Highlights**

#### 📡 **Event-Driven Ingestion Pipeline**

Unsuckify uses **Inngest** to manage a robust background processing system. When a user requests a playlist "unsuckification":

1.  **Fan-out Pattern:** The system triggers a parent function that fans out individual "embed-song" events for every track in the playlist.
2.  **Idempotent Processing:** Tracks are checked against a Postgres cache (Drizzle) to avoid redundant AI embedding calls.
3.  **Concurrency Management:** Inngest handles rate-limiting and retries for Spotify and OpenAI API calls, ensuring system stability under load.

#### 🧠 **Vector Similarity Engine**

Rather than matching by basic genre tags (which are often inaccurate), Unsuckify:

1.  **Weighted Metadata Construction:** Generates a semantic profile for each track by combining track/artist tags and "Similar Artist" data, using a weighting system based on frequency and match-scores to ensure the most relevant influences are captured.
2.  **Semantic Embedding:** Transforms this weighted metadata into a **1536-dimensional vector** using OpenAI's `text-embedding-3-small` model.
3.  **Vector Store:** Stores and indexes these vectors in a **Pinecone index**.
4.  **Cosine Similarity:** Performs high-speed similarity queries to find "hidden gems" that share a deep semantic profile with the user's seed playlist.

#### 🛡️ **End-to-End Type Safety**

By leveraging **tRPC** and **Zod**, the project eliminates a whole class of runtime errors. The frontend components "know" the exact shape of the backend responses, allowing for a seamless developer experience and robust UI state management.

---

## ✨ Features

- **Spotify OAuth Integration:** Securely connect your account to fetch private and public playlists.
- **Playlist Analysis:** Deep-dive into your listening habits beyond basic "Wrapped" statistics.
- **AI Recommendation Engine:** Get a curated list of tracks that bridge the gap between your favorite genres.
- **Minimalist "Mono" UI:** A brutalist, typography-first design built with **Tailwind CSS** and **Radix UI**.

---

## 📂 Project Structure

```text
src/
├── app/              # Next.js App Router (Pages & API Routes)
│   ├── api/inngest/  # Background job definitions
│   └── dashboard/    # Main application workspace
├── components/       # Shadcn/UI & custom React components
├── hooks/            # Custom React hooks (Auth, Recommendations)
├── lib/              # Core logic (Music APIs, Vector Search, Ingestion)
├── server/           # Backend logic (tRPC Routers, Database Schema)
└── trpc/             # tRPC configuration & client utilities
```

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js** (v20+)
- **pnpm**
- **Docker** (Optional, for local Inngest development)

### 2. Environment Setup

Create a `.env` file based on the provided schema:

```bash
# Database
DATABASE_URL=

# Spotify API
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=

# AI & Vectors
OPENAI_API_KEY=
PINECONE_API_KEY=
PINECONE_INDEX=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
```

### 3. Installation

```bash
pnpm install
pnpm db:push
pnpm dev
```

### 4. Running Background Jobs

In a separate terminal, start the Inngest dev server:

```bash
pnpm server:inngest
```

---

## 👨‍💻 Author

**[Your Name]**

- **GitHub:** [@yourusername](https://github.com/yourusername)
- **LinkedIn:** [linkedin.com/in/yourprofile](https://linkedin.com/in/yourprofile)

---

_This project was developed as a technical deep-dive into AI-integrated SaaS architectures._
