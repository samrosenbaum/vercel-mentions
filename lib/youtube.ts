// YouTube Data API v3 - free quota: 10,000 units/day (search = 100 units)
// Without API key, we can use the RSS feed approach

interface YouTubeRSSItem {
  id: string;
  title: string;
  url: string;
  author: string;
  publishedDate: string;
  description: string;
}

export interface YouTubeMention {
  id: string;
  url: string;
  title: string;
  description: string;
  author: string;
  publishedDate: string;
}

// Parse YouTube RSS/Atom feed
function parseYouTubeRSS(xml: string): YouTubeRSSItem[] {
  const items: YouTubeRSSItem[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];

    const getId = (s: string) => {
      const match = s.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      return match?.[1] || "";
    };
    const getTitle = (s: string) => {
      const match = s.match(/<title>([^<]+)<\/title>/);
      return match?.[1] || "";
    };
    const getAuthor = (s: string) => {
      const match = s.match(/<name>([^<]+)<\/name>/);
      return match?.[1] || "";
    };
    const getPublished = (s: string) => {
      const match = s.match(/<published>([^<]+)<\/published>/);
      return match?.[1] || "";
    };
    const getDescription = (s: string) => {
      const match = s.match(/<media:description>([^]*?)<\/media:description>/);
      return match?.[1]?.slice(0, 300) || "";
    };

    const videoId = getId(entry);
    if (videoId) {
      items.push({
        id: videoId,
        title: getTitle(entry),
        url: `https://www.youtube.com/watch?v=${videoId}`,
        author: getAuthor(entry),
        publishedDate: getPublished(entry),
        description: getDescription(entry),
      });
    }
  }

  return items;
}

// Search YouTube via Invidious (YouTube frontend with API)
async function searchInvidious(query: string): Promise<YouTubeMention[]> {
  // Invidious instances that allow API access
  const instances = [
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
    "https://invidious.jing.rocks",
  ];

  for (const instance of instances) {
    try {
      const res = await fetch(
        `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort=upload_date`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (!res.ok) continue;

      const data = await res.json();

      return data.slice(0, 20).map((video: {
        videoId: string;
        title: string;
        author: string;
        description?: string;
        published?: number;
      }) => ({
        id: video.videoId,
        url: `https://www.youtube.com/watch?v=${video.videoId}`,
        title: video.title,
        description: video.description || "",
        author: video.author,
        publishedDate: video.published
          ? new Date(video.published * 1000).toISOString()
          : new Date().toISOString(),
      }));
    } catch (error) {
      console.error(`Invidious ${instance} failed:`, error);
      continue;
    }
  }

  return [];
}

export async function searchYouTube(): Promise<YouTubeMention[]> {
  const [vercelVideos, v0Videos, nextjsVideos] = await Promise.all([
    searchInvidious("vercel tutorial deploy"),
    searchInvidious("v0 dev AI"),
    searchInvidious("nextjs vercel"),
  ]);

  const all = [...vercelVideos, ...v0Videos, ...nextjsVideos];

  // Dedupe
  const seen = new Set<string>();
  return all.filter((video) => {
    if (seen.has(video.id)) return false;
    seen.add(video.id);
    return true;
  });
}
