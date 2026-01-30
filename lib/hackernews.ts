// Hacker News Algolia API - free, no auth needed
const HN_API = "https://hn.algolia.com/api/v1";

interface HNHit {
  objectID: string;
  title?: string;
  url?: string;
  author: string;
  created_at: string;
  story_text?: string;
  comment_text?: string;
  points?: number;
  num_comments?: number;
  story_id?: number;
}

interface HNSearchResult {
  hits: HNHit[];
}

export interface HNMention {
  id: string;
  url: string;
  title: string;
  content: string | null;
  author: string;
  publishedDate: string;
  points: number;
  comments: number;
  type: "story" | "comment";
}

async function searchHN(query: string, tags = "story"): Promise<HNMention[]> {
  try {
    const params = new URLSearchParams({
      query,
      tags,
      hitsPerPage: "30",
      numericFilters: "created_at_i>" + Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000), // Last 30 days
    });

    const res = await fetch(`${HN_API}/search?${params}`);
    if (!res.ok) return [];

    const data: HNSearchResult = await res.json();

    return data.hits.map((hit) => ({
      id: hit.objectID,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      title: hit.title || "HN Discussion",
      content: hit.story_text || hit.comment_text || null,
      author: hit.author,
      publishedDate: hit.created_at,
      points: hit.points || 0,
      comments: hit.num_comments || 0,
      type: tags.includes("comment") ? "comment" as const : "story" as const,
    }));
  } catch (error) {
    console.error("HN search failed:", error);
    return [];
  }
}

export async function searchHackerNews(topics: string[] = ["vercel", "v0"]) {
  // Build search promises for each topic
  const searchPromises: Promise<HNMention[]>[] = [];

  for (const topic of topics) {
    searchPromises.push(searchHN(topic, "story"));
    searchPromises.push(searchHN(topic, "comment"));
  }

  // Search for .vercel.app links (Show HN posts with deployed projects)
  searchPromises.push(searchHN("vercel.app", "story"));
  searchPromises.push(searchHN("Show HN vercel", "story"));

  const results = await Promise.all(searchPromises);
  const all = results.flat();

  // Dedupe
  const seen = new Set<string>();
  return all.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
