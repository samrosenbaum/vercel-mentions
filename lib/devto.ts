// Dev.to API - free, no auth needed

interface DevToArticle {
  id: number;
  title: string;
  description: string;
  url: string;
  published_at: string;
  user: {
    name: string;
    username: string;
  };
  positive_reactions_count: number;
  comments_count: number;
  tag_list: string[];
}

export interface DevToMention {
  id: string;
  url: string;
  title: string;
  description: string;
  author: string;
  publishedDate: string;
  reactions: number;
  comments: number;
  tags: string[];
}

async function searchDevToByTag(tag: string): Promise<DevToMention[]> {
  try {
    const res = await fetch(
      `https://dev.to/api/articles?tag=${tag}&per_page=30&top=7`,
      {
        headers: {
          "User-Agent": "VercelSocialTracker",
        },
      }
    );

    if (!res.ok) {
      console.error("Dev.to API error:", res.status);
      return [];
    }

    const articles: DevToArticle[] = await res.json();

    return articles.map((a) => ({
      id: String(a.id),
      url: a.url,
      title: a.title,
      description: a.description,
      author: a.user.name || a.user.username,
      publishedDate: a.published_at,
      reactions: a.positive_reactions_count,
      comments: a.comments_count,
      tags: a.tag_list,
    }));
  } catch (error) {
    console.error("Dev.to search error:", error);
    return [];
  }
}

async function searchDevToQuery(query: string): Promise<DevToMention[]> {
  try {
    // Dev.to doesn't have a search endpoint, but we can use their articles endpoint
    // with page parameter to get recent articles and filter client-side
    const res = await fetch(
      `https://dev.to/api/articles?per_page=100&top=30`,
      {
        headers: {
          "User-Agent": "VercelSocialTracker",
        },
      }
    );

    if (!res.ok) return [];

    const articles: DevToArticle[] = await res.json();
    const queryLower = query.toLowerCase();

    // Filter for articles mentioning the query
    const filtered = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(queryLower) ||
        a.description?.toLowerCase().includes(queryLower) ||
        a.tag_list.some((t) => t.toLowerCase().includes(queryLower))
    );

    return filtered.map((a) => ({
      id: String(a.id),
      url: a.url,
      title: a.title,
      description: a.description,
      author: a.user.name || a.user.username,
      publishedDate: a.published_at,
      reactions: a.positive_reactions_count,
      comments: a.comments_count,
      tags: a.tag_list,
    }));
  } catch (error) {
    console.error("Dev.to search error:", error);
    return [];
  }
}

export async function searchDevTo() {
  const [vercelTag, nextjsTag, vercelQuery] = await Promise.all([
    searchDevToByTag("vercel"),
    searchDevToByTag("nextjs"),
    searchDevToQuery("vercel"),
  ]);

  const all = [...vercelTag, ...nextjsTag, ...vercelQuery];

  // Dedupe
  const seen = new Set<string>();
  return all.filter((article) => {
    if (seen.has(article.id)) return false;
    seen.add(article.id);
    return true;
  });
}
