// Reddit RSS feeds - free, no auth needed

interface RedditPost {
  id: string;
  title: string;
  url: string;
  author: string;
  content: string;
  publishedDate: string;
  subreddit: string;
  score: number;
}

// Parse Reddit RSS XML
function parseRedditRSS(xml: string): RedditPost[] {
  const posts: RedditPost[] = [];

  // Simple regex parsing for RSS items
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];

    const getId = (s: string) => s.match(/<id>([^<]+)<\/id>/)?.[1] || "";
    const getTitle = (s: string) => s.match(/<title>([^<]+)<\/title>/)?.[1] || "";
    const getLink = (s: string) => s.match(/<link href="([^"]+)"/)?.[1] || "";
    const getAuthor = (s: string) => s.match(/<name>([^<]+)<\/name>/)?.[1] || "";
    const getContent = (s: string) => {
      const content = s.match(/<content type="html">([^]*?)<\/content>/)?.[1] || "";
      // Decode HTML entities and strip tags
      return content
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 500);
    };
    const getUpdated = (s: string) => s.match(/<updated>([^<]+)<\/updated>/)?.[1] || "";
    const getCategory = (s: string) => s.match(/<category[^>]*term="([^"]+)"/)?.[1] || "";

    const id = getId(entry);
    const link = getLink(entry);

    // Skip if it's just a link to another site (we want discussions)
    const isDiscussion = link.includes("reddit.com/r/");

    posts.push({
      id: id.split("/").pop() || id,
      title: getTitle(entry).replace(/&amp;/g, "&"),
      url: link,
      author: getAuthor(entry).replace("/u/", ""),
      content: getContent(entry),
      publishedDate: getUpdated(entry),
      subreddit: getCategory(entry),
      score: 0, // RSS doesn't include score
    });
  }

  return posts;
}

async function fetchRedditRSS(url: string): Promise<RedditPost[]> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "VercelSocialTracker/1.0",
      },
    });

    if (!res.ok) {
      console.error(`Reddit RSS failed: ${res.status}`);
      return [];
    }

    const xml = await res.text();
    return parseRedditRSS(xml);
  } catch (error) {
    console.error("Reddit fetch error:", error);
    return [];
  }
}

export async function searchReddit(topics: string[] = ["vercel", "v0"]) {
  // Build search URLs for each topic
  const feedPromises: Promise<RedditPost[]>[] = [];

  for (const topic of topics) {
    // General search
    feedPromises.push(fetchRedditRSS(`https://www.reddit.com/search.rss?q=${encodeURIComponent(topic)}&sort=new&limit=20`));
    // Subreddit searches
    feedPromises.push(fetchRedditRSS(`https://www.reddit.com/r/nextjs/search.rss?q=${encodeURIComponent(topic)}&sort=new&restrict_sr=1&limit=15`));
    feedPromises.push(fetchRedditRSS(`https://www.reddit.com/r/webdev/search.rss?q=${encodeURIComponent(topic)}&sort=new&restrict_sr=1&limit=10`));
  }

  // Search for .vercel.app links (people sharing their deployed projects)
  feedPromises.push(fetchRedditRSS(`https://www.reddit.com/search.rss?q=${encodeURIComponent(".vercel.app")}&sort=new&limit=25`));
  feedPromises.push(fetchRedditRSS(`https://www.reddit.com/r/SideProject/search.rss?q=${encodeURIComponent("vercel")}&sort=new&restrict_sr=1&limit=15`));
  feedPromises.push(fetchRedditRSS(`https://www.reddit.com/r/webdev/search.rss?q=${encodeURIComponent("vercel.app")}&sort=new&restrict_sr=1&limit=15`));
  feedPromises.push(fetchRedditRSS(`https://www.reddit.com/r/reactjs/search.rss?q=${encodeURIComponent("vercel.app")}&sort=new&restrict_sr=1&limit=15`));

  const feeds = await Promise.all(feedPromises);
  const allPosts = feeds.flat();

  // Dedupe by ID
  const seen = new Set<string>();
  return allPosts.filter((post) => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });
}
