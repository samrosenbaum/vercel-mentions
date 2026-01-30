# Vercel Mentions Dashboard

Track what people are saying about **Vercel** and **v0** across the web. See what developers are building, sharing, and discussing.

![Dashboard Preview](https://vercel.com/button)

## What It Does

- **Aggregates mentions** from Reddit, Hacker News, GitHub, Dev.to, and blogs
- **Shows projects** people are building and deploying on Vercel
- **Filters** by platform and keyword (Vercel vs v0)
- **Generates LinkedIn content** based on trends (AI-powered)
- **Voice training** - teach the AI to write in your style

## Data Sources

| Source | What it finds | Cost |
|--------|--------------|------|
| Reddit | Discussions from r/nextjs, r/webdev, r/reactjs | Free |
| Hacker News | Tech discussions and Show HN posts | Free |
| GitHub | Projects with vercel.app in README | Free |
| Dev.to | Tutorial articles | Free |
| Exa | Blog posts across the web | Free tier |

## Quick Start

```bash
git clone https://github.com/samrosenbaum/vercel-mentions.git
cd vercel-mentions
npm install
```

Add your API keys to `.env.local`:

```
EXA_API_KEY=your_key        # from exa.ai
ANTHROPIC_API_KEY=your_key  # from Anthropic or Vercel AI Gateway
```

```bash
npm run dev
```

**[Full Setup Guide →](./SETUP.md)**

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/samrosenbaum/vercel-mentions&env=EXA_API_KEY,ANTHROPIC_API_KEY)

## Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **AI**: Vercel AI SDK + Anthropic Claude
- **Search**: Exa.ai
- **Database**: Vercel Postgres (optional)

## License

MIT
