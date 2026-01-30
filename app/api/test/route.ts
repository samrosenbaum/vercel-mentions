import { NextResponse } from "next/server";
import { searchAllMentions } from "@/lib/exa";
import { searchHackerNews } from "@/lib/hackernews";
import { searchReddit } from "@/lib/reddit";
import { searchGitHubProjects } from "@/lib/github";
import { searchDevTo } from "@/lib/devto";
import { searchYouTube } from "@/lib/youtube";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Get custom topics from query params (comma-separated)
  const topicsParam = searchParams.get("topics");
  const topics = topicsParam ? topicsParam.split(",").map(t => t.trim()) : ["vercel", "v0"];

  // Get enabled sources from query params (comma-separated)
  const sourcesParam = searchParams.get("sources");
  const enabledSources = sourcesParam
    ? sourcesParam.split(",").map(s => s.trim())
    : ["reddit", "hackernews", "github", "devto", "exa", "youtube"];

  try {
    // Build fetch promises based on enabled sources
    const fetchPromises: Promise<{ source: string; data: unknown[] }>[] = [];

    if (enabledSources.includes("exa")) {
      fetchPromises.push(
        searchAllMentions(topics).then(data => ({ source: "exa", data })).catch(() => ({ source: "exa", data: [] }))
      );
    }
    if (enabledSources.includes("hackernews")) {
      fetchPromises.push(
        searchHackerNews(topics).then(data => ({ source: "hackernews", data })).catch(() => ({ source: "hackernews", data: [] }))
      );
    }
    if (enabledSources.includes("reddit")) {
      fetchPromises.push(
        searchReddit(topics).then(data => ({ source: "reddit", data })).catch(() => ({ source: "reddit", data: [] }))
      );
    }
    if (enabledSources.includes("github")) {
      fetchPromises.push(
        searchGitHubProjects(topics).then(data => ({ source: "github", data })).catch(() => ({ source: "github", data: [] }))
      );
    }
    if (enabledSources.includes("devto")) {
      fetchPromises.push(
        searchDevTo(topics).then(data => ({ source: "devto", data })).catch(() => ({ source: "devto", data: [] }))
      );
    }
    if (enabledSources.includes("youtube")) {
      fetchPromises.push(
        searchYouTube(topics).then(data => ({ source: "youtube", data })).catch(() => ({ source: "youtube", data: [] }))
      );
    }

    const results = await Promise.all(fetchPromises);

    // Process results from each source
    const allMentions: Array<{
      id: number;
      platform: string;
      external_id: string | null;
      url: string;
      title: string | null;
      content: string | null;
      author: string | null;
      published_at: string | null;
      fetched_at: string;
      keyword: string;
      score: number;
      highlights: string[];
    }> = [];

    let idCounter = 0;

    for (const { source, data } of results) {
      if (source === "reddit") {
        const redditData = data as Array<{ id: string; url: string; title: string; content: string; author: string; publishedDate: string }>;
        redditData.forEach((m) => {
          allMentions.push({
            id: idCounter++,
            platform: "reddit",
            external_id: m.id,
            url: m.url,
            title: m.title,
            content: m.content,
            author: m.author,
            published_at: m.publishedDate,
            fetched_at: new Date().toISOString(),
            keyword: detectKeyword(m.title + m.content, topics),
            score: 0,
            highlights: m.content ? [m.content.slice(0, 200)] : [],
          });
        });
      } else if (source === "hackernews") {
        const hnData = data as Array<{ id: string; url: string; title: string; content: string | null; author: string; publishedDate: string; points: number }>;
        hnData.forEach((m) => {
          allMentions.push({
            id: idCounter++,
            platform: "hackernews",
            external_id: m.id,
            url: m.url,
            title: m.title,
            content: m.content,
            author: m.author,
            published_at: m.publishedDate,
            fetched_at: new Date().toISOString(),
            keyword: detectKeyword(m.title + (m.content || ""), topics),
            score: m.points / 100,
            highlights: m.content ? [m.content.slice(0, 200)] : [],
          });
        });
      } else if (source === "github") {
        const ghData = data as Array<{ id: string; url: string; title: string; description: string | null; author: string; publishedDate: string; stars: number }>;
        ghData.forEach((m) => {
          allMentions.push({
            id: idCounter++,
            platform: "github",
            external_id: m.id,
            url: m.url,
            title: m.title,
            content: m.description,
            author: m.author,
            published_at: m.publishedDate,
            fetched_at: new Date().toISOString(),
            keyword: detectKeyword(m.title + (m.description || ""), topics),
            score: m.stars / 100,
            highlights: m.description ? [m.description] : [],
          });
        });
      } else if (source === "devto") {
        const devtoData = data as Array<{ id: string; url: string; title: string; description: string; author: string; publishedDate: string; reactions: number; tags: string[] }>;
        devtoData.forEach((m) => {
          allMentions.push({
            id: idCounter++,
            platform: "devto",
            external_id: m.id,
            url: m.url,
            title: m.title,
            content: m.description,
            author: m.author,
            published_at: m.publishedDate,
            fetched_at: new Date().toISOString(),
            keyword: detectKeyword(m.title + m.description + m.tags.join(" "), topics),
            score: m.reactions / 50,
            highlights: m.description ? [m.description] : [],
          });
        });
      } else if (source === "youtube") {
        const ytData = data as Array<{ id: string; url: string; title: string; description: string; author: string; publishedDate: string }>;
        ytData.forEach((m) => {
          allMentions.push({
            id: idCounter++,
            platform: "youtube",
            external_id: m.id,
            url: m.url,
            title: m.title,
            content: m.description,
            author: m.author,
            published_at: m.publishedDate,
            fetched_at: new Date().toISOString(),
            keyword: detectKeyword(m.title + m.description, topics),
            score: 0,
            highlights: m.description ? [m.description.slice(0, 200)] : [],
          });
        });
      } else if (source === "exa") {
        const exaData = data as Array<{ url: string; title: string | null; text: string | null; author: string | null; publishedDate: string | null; score: number; highlights: string[]; keyword: string; platform: string }>;
        exaData.forEach((m) => {
          allMentions.push({
            id: idCounter++,
            platform: m.platform,
            external_id: null,
            url: m.url,
            title: m.title,
            content: m.text,
            author: m.author,
            published_at: m.publishedDate,
            fetched_at: new Date().toISOString(),
            keyword: m.keyword,
            score: m.score,
            highlights: m.highlights,
          });
        });
      }
    }

    // Sort by date (newest first)
    allMentions.sort((a, b) => {
      const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
      const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
      return dateB - dateA;
    });

    // Calculate stats
    const stats = {
      total: allMentions.length,
      byPlatform: Object.entries(
        allMentions.reduce((acc, m) => {
          acc[m.platform] = (acc[m.platform] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      )
        .map(([platform, count]) => ({ platform, count: String(count) }))
        .sort((a, b) => parseInt(b.count) - parseInt(a.count)),
      byKeyword: Object.entries(
        allMentions.reduce((acc, m) => {
          acc[m.keyword] = (acc[m.keyword] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([keyword, count]) => ({ keyword, count: String(count) })),
    };

    return NextResponse.json({
      success: true,
      mentions: allMentions,
      stats,
      topics,
      enabledSources,
      pagination: {
        limit: 200,
        offset: 0,
        hasMore: false,
      },
    });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch mentions",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Detect which topic a mention is about
function detectKeyword(text: string, topics: string[]): string {
  const lowerText = text.toLowerCase();
  for (const topic of topics) {
    if (lowerText.includes(topic.toLowerCase())) {
      return topic;
    }
  }
  return topics[0] || "unknown";
}
