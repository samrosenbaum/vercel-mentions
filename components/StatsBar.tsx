"use client";

import { Card, CardContent } from "@/components/ui/card";

interface Stats {
  total: number;
  byPlatform: { platform: string; count: string }[];
  byKeyword: { keyword: string; count: string }[];
}

const platformIcons: Record<string, string> = {
  twitter: "𝕏",
  linkedin: "in",
  reddit: "r/",
  hackernews: "Y",
  youtube: "▶",
  github: "⌘",
  medium: "M",
  devto: "⌨",
  app: "▲",
  blog: "📝",
};

interface StatsBarProps {
  stats: Stats | null;
  onKeywordClick?: (keyword: string) => void;
  activeKeyword?: string;
}

export function StatsBar({ stats, onKeywordClick, activeKeyword }: StatsBarProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const vercelCount = stats.byKeyword.find((k) => k.keyword === "vercel")?.count ?? "0";
  const v0Count = stats.byKeyword.find((k) => k.keyword === "v0")?.count ?? "0";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-card to-muted/30">
        <CardContent className="pt-6">
          <div className="text-3xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Mentions</div>
        </CardContent>
      </Card>

      <Card
        className={`border-black/10 dark:border-white/10 cursor-pointer transition-all hover:shadow-md ${
          activeKeyword === "vercel" ? "ring-2 ring-black dark:ring-white" : ""
        }`}
        onClick={() => onKeywordClick?.(activeKeyword === "vercel" ? "all" : "vercel")}
      >
        <CardContent className="pt-6">
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold">{vercelCount}</div>
            <div className="w-6 h-6 rounded bg-black flex items-center justify-center">
              <svg viewBox="0 0 76 65" fill="white" className="w-3 h-3">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">Vercel mentions</div>
        </CardContent>
      </Card>

      <Card
        className={`border-violet-500/20 cursor-pointer transition-all hover:shadow-md ${
          activeKeyword === "v0" ? "ring-2 ring-violet-500" : ""
        }`}
        onClick={() => onKeywordClick?.(activeKeyword === "v0" ? "all" : "v0")}
      >
        <CardContent className="pt-6">
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold">{v0Count}</div>
            <span className="text-xs font-mono bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded">
              v0
            </span>
          </div>
          <div className="text-sm text-muted-foreground">v0 mentions</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-3xl font-bold">{stats.byPlatform.length}</div>
          <div className="text-sm text-muted-foreground mb-2">Platforms</div>
          <div className="flex flex-wrap gap-1">
            {stats.byPlatform.slice(0, 5).map(({ platform }) => (
              <span
                key={platform}
                className="text-xs bg-muted px-1.5 py-0.5 rounded"
                title={platform}
              >
                {platformIcons[platform] ?? "🔗"}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
