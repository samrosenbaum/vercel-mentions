"use client";

import { useEffect, useState, useCallback } from "react";
import { MentionCard } from "@/components/MentionCard";
import { FilterBar } from "@/components/FilterBar";
import { StatsBar } from "@/components/StatsBar";
import { ContentGenerator } from "@/components/ContentGenerator";
import { Settings, useSettings, DEFAULT_SETTINGS, type DashboardSettings } from "@/components/Settings";
import { VoiceTraining } from "@/components/VoiceTraining";
import { AddMentions } from "@/components/AddMentions";
import { Welcome } from "@/components/Welcome";
import { Button } from "@/components/ui/button";
import type { Mention } from "@/lib/db";

interface Stats {
  total: number;
  byPlatform: { platform: string; count: string }[];
  byKeyword: { keyword: string; count: string }[];
}

interface ApiResponse {
  mentions: Mention[];
  stats: Stats;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function Home() {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [platform, setPlatform] = useState("all");
  const [keyword, setKeyword] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showContentGenerator, setShowContentGenerator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVoiceTraining, setShowVoiceTraining] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [settings, setSettings] = useState<DashboardSettings>(DEFAULT_SETTINGS);

  // Check if user has already been welcomed
  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    if (savedName) {
      setUserName(savedName);
      setShowWelcome(false);
    }
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("dashboardSettings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          sources: DEFAULT_SETTINGS.sources.map((s) => ({
            ...s,
            enabled: parsed.sources?.find((ps: { id: string; enabled: boolean }) => ps.id === s.id)?.enabled ?? s.enabled,
          })),
        });
      } catch {
        // Use defaults
      }
    }
  }, []);

  const fetchMentions = useCallback(
    async (reset = false) => {
      const currentOffset = reset ? 0 : offset;
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        // Build query params from settings
        const enabledSources = settings.sources
          .filter((s) => s.enabled)
          .map((s) => s.id)
          .join(",");
        const topics = settings.topics.join(",");

        // Try database first, fall back to live API
        let res = await fetch(`/api/mentions?limit=50&offset=0`);

        // If database fails, use live API with settings
        if (!res.ok) {
          res = await fetch(`/api/test?topics=${encodeURIComponent(topics)}&sources=${encodeURIComponent(enabledSources)}`);
        }

        if (!res.ok) throw new Error("Failed to fetch mentions");

        const data: ApiResponse = await res.json();

        // Client-side filtering
        let filtered = data.mentions;
        if (platform !== "all") {
          filtered = filtered.filter((m) => m.platform === platform);
        }
        if (keyword !== "all") {
          filtered = filtered.filter((m) => m.keyword === keyword);
        }

        // Sort by newest first
        filtered.sort((a, b) => {
          const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
          const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
          return dateB - dateA;
        });

        setMentions(filtered);
        setStats(data.stats);
        setHasMore(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [platform, keyword, offset, settings]
  );

  useEffect(() => {
    fetchMentions(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, keyword, settings]);

  const platforms = stats?.byPlatform.map((p) => p.platform) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-black border border-green-500/50 flex items-center justify-center font-mono text-green-400 text-lg">
              &gt;_
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono">
                <span className="text-green-500">&gt;</span> vercel<span className="text-muted-foreground">/</span>socials
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                tracking mentions across the web
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://x.com/search?q=.vercel.app&src=typed_query"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border bg-background hover:bg-muted transition-colors"
            >
              <span className="font-bold">𝕏</span>
              .vercel.app
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkImport(true)}
            >
              Add Mentions
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVoiceTraining(true)}
            >
              Train Voice
            </Button>
            <Button
              onClick={() => setShowContentGenerator(true)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              Content Ideas
            </Button>
                        <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMentions(true)}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Stats */}
          <StatsBar
            stats={stats}
            onKeywordClick={(k) => setKeyword(k)}
            activeKeyword={keyword}
          />

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <FilterBar
              platform={platform}
              keyword={keyword}
              onPlatformChange={(v) => setPlatform(v)}
              onKeywordChange={(v) => setKeyword(v)}
              platforms={platforms}
            />
            {stats && (
              <p className="text-sm text-muted-foreground">
                Showing {mentions.length} of {stats.total} mentions
              </p>
            )}
          </div>

          {/* Error state */}
          {error && (
            <div className="p-6 bg-destructive/5 border border-destructive/20 text-destructive rounded-xl">
              <p className="font-medium">{error}</p>
              <p className="text-sm mt-1 opacity-80">
                Make sure you have set up Vercel Postgres and run the fetch
                endpoint to populate data.
              </p>
            </div>
          )}

          {/* Loading state */}
          {loading ? (
            <div className="grid gap-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-36 bg-muted/50 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : mentions.length === 0 ? (
            /* Empty state */
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">No mentions yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Run the fetch endpoint to start collecting mentions of Vercel
                and v0 from across the web.
              </p>
              <Button
                onClick={() => window.open("/api/cron/fetch", "_blank")}
                variant="default"
              >
                Fetch mentions now
              </Button>
            </div>
          ) : (
            /* Mentions grid */
            <div className="grid gap-4">
              {mentions.map((mention) => (
                <MentionCard key={mention.id} mention={mention} />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && !loading && mentions.length > 0 && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => fetchMentions(false)}
                disabled={loadingMore}
                className="px-8"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  "Load more mentions"
                )}
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Fork CTA */}
          <div className="mb-8 p-6 rounded-xl border-2 border-dashed border-green-500/30 bg-green-500/5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg mb-1">Want your own socials tracker?</h3>
                <p className="text-sm text-muted-foreground">
                  Fork this repo and deploy your own version in minutes.
                </p>
              </div>
              <a
                href="https://github.com/samrosenbaum/vercel-mentions"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Fork on GitHub
              </a>
            </div>
            <div className="mt-4 pt-4 border-t border-green-500/20">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Quick setup:</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Fork the repo to your GitHub</li>
                <li>Create a new Vercel project from your fork</li>
                <li>Add <code className="bg-muted px-1 rounded">EXA_API_KEY</code> and <code className="bg-muted px-1 rounded">AI_GATEWAY_API_KEY</code> in Vercel</li>
                <li>Deploy - customize topics and voice with Claude Code</li>
              </ol>
            </div>
          </div>

          {/* Credits */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Powered by{" "}
              <a
                href="https://exa.ai"
                className="underline hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                Exa
              </a>{" "}
              &bull; Built with{" "}
              <a
                href="https://nextjs.org"
                className="underline hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                Next.js
              </a>{" "}
              &bull; Deployed on{" "}
              <a
                href="https://vercel.com"
                className="underline hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                Vercel
              </a>
            </p>
          </div>
        </div>
      </footer>
      {/* Content Generator Modal */}
      <ContentGenerator
        mentions={mentions}
        isOpen={showContentGenerator}
        onClose={() => setShowContentGenerator(false)}
      />

      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={(newSettings) => setSettings(newSettings)}
      />

      {/* Voice Training Modal */}
      <VoiceTraining
        isOpen={showVoiceTraining}
        onClose={() => setShowVoiceTraining(false)}
      />

      {/* Add Mentions Modal */}
      <AddMentions
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onAdd={(items) => {
          const newMentions = items.map((t, i) => ({
            id: Date.now() + i,
            platform: t.platform,
            external_id: null,
            url: t.url,
            title: t.title,
            content: t.content,
            author: null,
            published_at: new Date(),
            fetched_at: new Date(),
            keyword: t.keyword,
            score: null,
            highlights: null,
          }));
          setMentions((prev) => [...newMentions, ...prev]);
        }}
      />

      {/* Welcome Screen */}
      {showWelcome && (
        <Welcome
          onComplete={(name) => {
            setUserName(name);
            setShowWelcome(false);
          }}
        />
      )}
    </div>
  );
}
