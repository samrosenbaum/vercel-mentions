import { NextResponse } from "next/server";

interface BlogPost {
  content: string;
  url: string;
  title?: string;
}

// Parse RSS/Atom feed to extract blog posts
function parseFeed(xml: string, baseUrl: string): BlogPost[] {
  const posts: BlogPost[] = [];

  // Try RSS format first
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];

    const getContent = (s: string) => {
      // Try content:encoded first (full content)
      const encoded = s.match(/<content:encoded>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/);
      if (encoded) return encoded[1];

      // Try description
      const desc = s.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
      if (desc) return desc[1];

      return "";
    };

    const getLink = (s: string) => {
      const link = s.match(/<link>([^<]+)<\/link>/);
      return link?.[1] || "";
    };

    const getTitle = (s: string) => {
      const title = s.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
      return title?.[1] || "";
    };

    const content = getContent(item);
    const url = getLink(item);
    const title = getTitle(item);

    if (content && content.length > 100) {
      // Clean HTML tags and decode entities
      const cleanContent = content
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 2000); // Limit sample size

      posts.push({
        content: cleanContent,
        url: url || baseUrl,
        title,
      });
    }
  }

  // Try Atom format if RSS didn't find anything
  if (posts.length === 0) {
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;

    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];

      const getContent = (s: string) => {
        const content = s.match(/<content[^>]*>([\s\S]*?)<\/content>/);
        if (content) return content[1];

        const summary = s.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
        return summary?.[1] || "";
      };

      const getLink = (s: string) => {
        const link = s.match(/<link[^>]*href="([^"]+)"[^>]*\/>/);
        return link?.[1] || "";
      };

      const getTitle = (s: string) => {
        const title = s.match(/<title[^>]*>([\s\S]*?)<\/title>/);
        return title?.[1] || "";
      };

      const content = getContent(entry);
      const url = getLink(entry);
      const title = getTitle(entry);

      if (content && content.length > 100) {
        const cleanContent = content
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 2000);

        posts.push({
          content: cleanContent,
          url: url || baseUrl,
          title,
        });
      }
    }
  }

  return posts.slice(0, 10); // Max 10 posts
}

// Try to find RSS feed from a webpage
async function findRSSFeed(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "VercelSocialTracker/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Look for RSS link in HTML
    const rssLink = html.match(
      /<link[^>]*type=["']application\/rss\+xml["'][^>]*href=["']([^"']+)["']/i
    );
    if (rssLink) {
      const feedUrl = rssLink[1];
      return feedUrl.startsWith("http") ? feedUrl : new URL(feedUrl, url).href;
    }

    // Look for Atom link
    const atomLink = html.match(
      /<link[^>]*type=["']application\/atom\+xml["'][^>]*href=["']([^"']+)["']/i
    );
    if (atomLink) {
      const feedUrl = atomLink[1];
      return feedUrl.startsWith("http") ? feedUrl : new URL(feedUrl, url).href;
    }

    // Try common feed paths
    const baseUrl = new URL(url).origin;
    const commonPaths = ["/feed", "/rss", "/feed.xml", "/rss.xml", "/atom.xml", "/index.xml"];

    for (const path of commonPaths) {
      try {
        const feedRes = await fetch(baseUrl + path, {
          method: "HEAD",
          signal: AbortSignal.timeout(3000),
        });
        if (feedRes.ok) {
          return baseUrl + path;
        }
      } catch {
        continue;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Check if URL is already a feed
    let feedUrl = url;
    const isLikelyFeed =
      url.includes("/feed") ||
      url.includes("/rss") ||
      url.endsWith(".xml") ||
      url.includes("atom");

    if (!isLikelyFeed) {
      // Try to find the RSS feed
      const foundFeed = await findRSSFeed(url);
      if (foundFeed) {
        feedUrl = foundFeed;
      } else {
        return NextResponse.json(
          { error: "Could not find RSS feed for this URL. Try providing the direct feed URL." },
          { status: 400 }
        );
      }
    }

    // Fetch the feed
    const res = await fetch(feedUrl, {
      headers: { "User-Agent": "VercelSocialTracker/1.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch feed: ${res.status}` },
        { status: 400 }
      );
    }

    const xml = await res.text();
    const posts = parseFeed(xml, url);

    if (posts.length === 0) {
      return NextResponse.json(
        { error: "No posts found in the feed. Make sure it's a valid RSS or Atom feed." },
        { status: 400 }
      );
    }

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Blog import error:", error);
    return NextResponse.json(
      { error: "Failed to import blog. Please check the URL and try again." },
      { status: 500 }
    );
  }
}
