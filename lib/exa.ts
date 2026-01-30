import Exa from "exa-js";

function getExaClient() {
  if (!process.env.EXA_API_KEY) {
    throw new Error("EXA_API_KEY environment variable is required");
  }
  return new Exa(process.env.EXA_API_KEY);
}

export interface ExaSearchResult {
  url: string;
  title: string | null;
  text: string | null;
  author: string | null;
  publishedDate: string | null;
  score: number;
  highlights: string[];
}

function detectPlatform(url: string): string {
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.includes("linkedin.com")) return "linkedin";
  if (url.includes("reddit.com")) return "reddit";
  if (url.includes("news.ycombinator.com")) return "hackernews";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("github.com")) return "github";
  if (url.includes("medium.com")) return "medium";
  if (url.includes("dev.to")) return "devto";
  if (url.includes(".vercel.app")) return "app";
  return "blog";
}

async function search(query: string, numResults = 25): Promise<ExaSearchResult[]> {
  const exa = getExaClient();

  try {
    const result = await exa.searchAndContents(query, {
      type: "neural",
      useAutoprompt: true,
      numResults,
      text: { maxCharacters: 500 },
      highlights: {
        numSentences: 2,
        highlightsPerUrl: 2,
      },
    });

    return result.results.map((r) => ({
      url: r.url,
      title: r.title ?? null,
      text: r.text ?? null,
      author: r.author ?? null,
      publishedDate: r.publishedDate ?? null,
      score: r.score ?? 0,
      highlights: r.highlights ?? [],
    }));
  } catch (error) {
    console.error(`Search failed for "${query}":`, error);
    return [];
  }
}

export async function searchAllMentions() {
  // Multiple search strategies to get diverse results
  const searches = await Promise.all([
    // Vercel-focused searches
    search("vercel nextjs deployment website launched", 20),
    search("deployed my app on vercel hosting", 15),
    search("vercel developer experience frontend", 15),

    // v0-focused searches
    search("v0.dev AI generate UI components", 20),
    search("v0 by vercel code generation", 15),

    // Project sharing searches
    search("check out my project vercel.app live demo", 15),
    search("just shipped launched vercel", 15),
  ]);

  const allResults = searches.flat();

  // Tag with keyword based on content
  const mentions = allResults.map((r) => {
    const text = `${r.title} ${r.text}`.toLowerCase();
    const isV0 = text.includes("v0.dev") || text.includes("v0 by vercel") ||
                 (text.includes("v0") && text.includes("generate"));

    return {
      ...r,
      keyword: isV0 ? "v0" as const : "vercel" as const,
      platform: detectPlatform(r.url),
    };
  });

  // Filter out Vercel-owned domains (we want third-party mentions only)
  const thirdParty = mentions.filter((m) => {
    const vercelOwned = [
      "vercel.com",
      "vercel.app/", // main vercel.app site, not subdomains
      "nextjs.org",
      "v0.dev",
      "v0.app",
      "turborepo.org",
    ];
    // Keep .vercel.app subdomains (user projects) but filter vercel-owned sites
    if (m.url.includes(".vercel.app") && !m.url.includes("www.vercel.app")) {
      return true;
    }
    return !vercelOwned.some((d) => m.url.includes(d));
  });

  // Dedupe by URL
  const seen = new Set<string>();
  const deduped = thirdParty.filter((m) => {
    if (seen.has(m.url)) return false;
    seen.add(m.url);
    return true;
  });

  // Sort by date (newest first)
  deduped.sort((a, b) => {
    const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
    const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
    return dateB - dateA;
  });

  return deduped;
}
