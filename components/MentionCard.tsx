"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { Mention } from "@/lib/db";

const platformConfig: Record<string, { color: string; icon: string; label: string }> = {
  twitter: { color: "bg-black text-white", icon: "𝕏", label: "Twitter" },
  linkedin: { color: "bg-blue-600 text-white", icon: "in", label: "LinkedIn" },
  reddit: { color: "bg-orange-500 text-white", icon: "●", label: "Reddit" },
  hackernews: { color: "bg-orange-400 text-white", icon: "Y", label: "HN" },
  youtube: { color: "bg-red-600 text-white", icon: "▶", label: "YouTube" },
  github: { color: "bg-gray-800 text-white", icon: "◉", label: "GitHub" },
  medium: { color: "bg-green-600 text-white", icon: "M", label: "Medium" },
  devto: { color: "bg-violet-600 text-white", icon: "⌨", label: "Dev.to" },
  app: { color: "bg-gradient-to-r from-black to-gray-700 text-white", icon: "▲", label: "App" },
  blog: { color: "bg-gray-500 text-white", icon: "✎", label: "Blog" },
};

// Clean up text by removing markdown artifacts and excessive formatting
function cleanText(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [link](url) -> link
    .replace(/\[([^\]]+)\]/g, "$1") // [text] -> text
    .replace(/#{1,6}\s*/g, "") // Remove markdown headers
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1") // Remove bold/italic
    .replace(/\|/g, " · ") // Tables to dots
    .replace(/\s+/g, " ") // Multiple spaces to single
    .replace(/\.{3,}/g, "...") // Normalize ellipsis
    .trim();
}

// Extract domain from URL
function getDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// Validate date is real and recent (not epoch or year 2000)
function isValidRecentDate(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const d = new Date(date);
  const time = d.getTime();
  // Must be valid, after 2015 (when Vercel/Zeit started), and not in the future
  return !isNaN(time) && d.getFullYear() >= 2015 && time <= Date.now();
}

// Get a clean excerpt from content or highlights
function getExcerpt(mention: Mention): string | null {
  // Prefer the first highlight if available
  if (mention.highlights && mention.highlights.length > 0) {
    const cleaned = cleanText(mention.highlights[0]);
    if (cleaned.length > 20) {
      return cleaned.length > 200 ? cleaned.slice(0, 200) + "..." : cleaned;
    }
  }

  // Fall back to content
  if (mention.content) {
    const cleaned = cleanText(mention.content);
    if (cleaned.length > 20) {
      return cleaned.length > 200 ? cleaned.slice(0, 200) + "..." : cleaned;
    }
  }

  return null;
}

export function MentionCard({ mention }: { mention: Mention }) {
  const config = platformConfig[mention.platform] ?? platformConfig.blog;
  const excerpt = getExcerpt(mention);
  const domain = getDomain(mention.url);

  return (
    <Card className="group hover:shadow-md hover:border-foreground/20 transition-all duration-200">
      <CardContent className="p-5">
        {/* Top row: Platform badge + keyword + time */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Badge className={`${config.color} text-xs px-2 py-0.5`}>
              {config.icon} {config.label}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs px-2 py-0.5 ${
                mention.keyword === "v0"
                  ? "border-violet-400 text-violet-600 dark:text-violet-400"
                  : ""
              }`}
            >
              {mention.keyword === "v0" ? "v0" : "Vercel"}
            </Badge>
          </div>
          {isValidRecentDate(mention.published_at) && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(mention.published_at!), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>

        {/* Title */}
        {mention.title && (
          <h3 className="font-semibold text-base leading-snug mb-2">
            <a
              href={mention.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              {cleanText(mention.title)}
            </a>
          </h3>
        )}

        {/* Excerpt - single clean paragraph */}
        {excerpt && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {excerpt}
          </p>
        )}

        {/* Bottom row: domain + author */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <a
            href={mention.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 truncate"
          >
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="truncate">{domain}</span>
          </a>
          {mention.author && (
            <span className="text-xs text-muted-foreground truncate max-w-[150px] ml-2">
              {mention.author}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
