# Vercel Mentions Dashboard - Setup Guide

Track what people are saying about Vercel and v0 across Reddit, Hacker News, GitHub, Dev.to, and more. Generate LinkedIn content ideas based on trends.

## Quick Start (5 minutes)

### 1. Fork & Clone

```bash
# Fork this repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/vercel-mentions.git
cd vercel-mentions
npm install
```

### 2. Get API Keys

You need **2 API keys** (both have free tiers):

#### Exa API Key (Required)
Exa powers the web search for mentions.

1. Go to [exa.ai](https://exa.ai)
2. Sign up for free
3. Copy your API key from the dashboard

**Free tier:** 1,000 searches/month (plenty for this app)

#### Anthropic API Key (Required for Content Generator)
Powers the LinkedIn content idea generator.

**Option A: Vercel AI Gateway (Recommended for Vercel employees)**

No manual key needed! Vercel auto-injects the API key.

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **AI Gateway**
3. Click **Enable** next to Anthropic
4. Deploy - that's it! `ANTHROPIC_API_KEY` is automatically available

**Option B: Direct from Anthropic**

If you're not using AI Gateway:

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up and add billing (pay-as-you-go)
3. Go to **API Keys** → **Create Key**
4. Add to your environment variables

**Cost:** ~$3 per 1M tokens. Typical usage: $1-5/month.

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
# Required - Exa.ai for web search
EXA_API_KEY=your_exa_key_here

# Required for content generator - Anthropic
ANTHROPIC_API_KEY=your_anthropic_key_here

# Optional - Vercel Postgres for data persistence
# (Without this, data is fetched fresh on each load)
# POSTGRES_URL=your_postgres_connection_string
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel
```

Or use the Vercel Dashboard:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your forked repo
3. Add environment variables in the dashboard
4. Deploy!

## Features

### Data Sources (All Free)
| Source | What it finds |
|--------|--------------|
| Reddit | Discussions from r/nextjs, r/webdev, r/reactjs |
| Hacker News | Tech discussions and Show HN posts |
| GitHub | Projects deployed on Vercel, repos mentioning vercel.app |
| Dev.to | Tutorial articles tagged vercel/nextjs |
| Exa | Blog posts and articles across the web |

### Content Generator
1. Click **"Content Ideas"** button
2. AI analyzes recent mentions and suggests 3 LinkedIn post topics
3. Click any idea to generate a full post draft
4. **Train Voice**: Paste your past LinkedIn posts so AI matches your writing style
5. Copy to clipboard or open directly in LinkedIn

### Filtering
- Filter by platform (Reddit, HN, GitHub, etc.)
- Filter by keyword (Vercel vs v0)
- Click stat cards to quick-filter

## Optional: Add Vercel Postgres

For data persistence (so you don't re-fetch on every page load):

1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database** → **Postgres**
3. Connect it to your project
4. `POSTGRES_URL` will be automatically added

The cron job at `/api/cron/fetch` will run every 6 hours to update data.

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `EXA_API_KEY` | Yes | Exa.ai API key for web search |
| `ANTHROPIC_API_KEY` | Yes* | Anthropic API key for content generator |
| `POSTGRES_URL` | No | Vercel Postgres connection string |
| `CRON_SECRET` | No | Secret to protect cron endpoint |

*Only required if using the Content Generator feature

## Troubleshooting

**"Failed to fetch mentions"**
- Check that `EXA_API_KEY` is set correctly
- The app falls back to live API calls if Postgres isn't configured

**Content Generator not working**
- Verify `ANTHROPIC_API_KEY` is set
- Check the Vercel function logs for errors

**No Twitter/LinkedIn results**
- These platforms block public APIs
- Use the "Add Mention" button to manually add posts you find
- Consider adding SocialData.tools ($19/mo) for Twitter access

## Contributing

PRs welcome! Some ideas:
- Add more data sources
- Improve the UI
- Add Twitter integration via paid API
- Add email digest feature
