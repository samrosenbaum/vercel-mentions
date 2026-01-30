"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface UserProfile {
  name: string;
  role: string;
  company: string;
  context: string; // Additional context like "I build developer tools"
}

export interface DashboardSettings {
  topics: string[];
  sources: {
    id: string;
    name: string;
    enabled: boolean;
    description: string;
  }[];
}

// FORKERS: Update this with your own info!
const DEFAULT_PROFILE: UserProfile = {
  name: "Sam",
  role: "on the v0 team",
  company: "Vercel",
  context: "I help developers build and ship faster. I'm genuinely excited about what people create with our tools.",
};

const DEFAULT_SETTINGS: DashboardSettings = {
  topics: ["vercel", "v0"],
  sources: [
    { id: "reddit", name: "Reddit", enabled: true, description: "r/nextjs, r/webdev, r/reactjs discussions" },
    { id: "hackernews", name: "Hacker News", enabled: true, description: "Tech discussions and Show HN" },
    { id: "github", name: "GitHub", enabled: true, description: "Projects with topics in README" },
    { id: "devto", name: "Dev.to", enabled: true, description: "Developer articles and tutorials" },
    { id: "exa", name: "Exa (Web)", enabled: true, description: "Blog posts and articles across the web" },
    { id: "youtube", name: "YouTube", enabled: true, description: "Tutorial videos (via Invidious)" },
  ],
};

// Premium sources that require paid API keys
const PREMIUM_SOURCES = [
  {
    id: "twitter",
    name: "Twitter/X",
    description: "Real-time tweets and discussions",
    cost: "$100/month",
    setup: "Requires Twitter API v2 Basic tier. Add TWITTER_API_KEY to env.",
    link: "https://developer.twitter.com/en/products/twitter-api",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Professional posts and articles",
    cost: "$10-50/month",
    setup: "Requires Apify LinkedIn Actor. Add APIFY_API_KEY to env.",
    link: "https://apify.com/anchor/linkedin-scraper",
  },
];

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: DashboardSettings) => void;
}

export function Settings({ isOpen, onClose, onSave }: SettingsProps) {
  const [settings, setSettings] = useState<DashboardSettings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [newTopic, setNewTopic] = useState("");

  // Load settings and profile from localStorage
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

    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      try {
        setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(savedProfile) });
      } catch {
        // Use defaults
      }
    }
  }, [isOpen]);

  const saveSettings = () => {
    localStorage.setItem("dashboardSettings", JSON.stringify(settings));
    localStorage.setItem("userProfile", JSON.stringify(profile));
    onSave(settings);
    onClose();
  };

  const addTopic = () => {
    const topic = newTopic.trim().toLowerCase();
    if (topic && !settings.topics.includes(topic)) {
      setSettings((s) => ({ ...s, topics: [...s.topics, topic] }));
      setNewTopic("");
    }
  };

  const removeTopic = (topic: string) => {
    if (settings.topics.length > 1) {
      setSettings((s) => ({ ...s, topics: s.topics.filter((t) => t !== topic) }));
    }
  };

  const toggleSource = (sourceId: string) => {
    setSettings((s) => ({
      ...s,
      sources: s.sources.map((source) =>
        source.id === sourceId ? { ...source, enabled: !source.enabled } : source
      ),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-background border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">Dashboard Settings</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Topics Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Topics to Track</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {settings.topics.map((topic) => (
                  <Badge
                    key={topic}
                    variant="secondary"
                    className="px-3 py-1 text-sm flex items-center gap-1"
                  >
                    {topic}
                    {settings.topics.length > 1 && (
                      <button
                        onClick={() => removeTopic(topic)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Add a topic (e.g., nextjs, turborepo)"
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && addTopic()}
                />
                <Button onClick={addTopic} disabled={!newTopic.trim()}>
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Topics are searched across all enabled sources
              </p>
            </CardContent>
          </Card>

          {/* Profile Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Your Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Your name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Company</label>
                  <Input
                    value={profile.company}
                    onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))}
                    placeholder="Your company"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Role</label>
                <Input
                  value={profile.role}
                  onChange={(e) => setProfile((p) => ({ ...p, role: e.target.value }))}
                  placeholder="e.g., on the v0 team, engineering lead"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Context for AI</label>
                <textarea
                  value={profile.context}
                  onChange={(e) => setProfile((p) => ({ ...p, context: e.target.value }))}
                  placeholder="What should the AI know about you? e.g., I build developer tools and care about DX"
                  className="mt-1 w-full min-h-[60px] p-2 text-sm border rounded-md bg-background resize-none"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This context helps generate content that sounds like you
              </p>
            </CardContent>
          </Card>

          {/* Sources Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {settings.sources.map((source) => (
                <div
                  key={source.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    source.enabled ? "bg-background" : "bg-muted/50 opacity-60"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{source.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {source.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {source.description}
                    </p>
                  </div>
                  <Button
                    variant={source.enabled ? "outline" : "secondary"}
                    size="sm"
                    onClick={() => toggleSource(source.id)}
                  >
                    {source.enabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              ))}

              {/* Premium Sources (not available yet) */}
              <div className="pt-3 mt-3 border-t">
                <p className="text-xs text-muted-foreground mb-2 font-medium">
                  Premium Sources (Requires API Key)
                </p>
                {PREMIUM_SOURCES.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 opacity-60"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{source.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {source.cost}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {source.description}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {source.setup}
                      </p>
                    </div>
                    <a
                      href={source.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Learn more →
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* For Forkers */}
          <Card className="border-dashed border-amber-500/50 bg-amber-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="text-amber-600">Fork Setup Guide</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p className="text-muted-foreground">
                Settings here are stored in your browser's local storage, which is great for quick testing.
              </p>
              <p className="text-muted-foreground">
                <strong>For your own deployment:</strong>
              </p>
              <ol className="text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Fork the repo to your GitHub account</li>
                <li>Create a new Vercel project from your fork</li>
                <li>Add your API keys (EXA_API_KEY, AI_GATEWAY_API_KEY) in Vercel</li>
                <li>Use Claude Code to customize:
                  <ul className="ml-5 mt-1 space-y-1 list-disc">
                    <li>Default topics in <code className="text-xs bg-muted px-1 rounded">components/Settings.tsx</code></li>
                    <li>Voice training samples</li>
                    <li>AI writing rules in <code className="text-xs bg-muted px-1 rounded">app/api/generate-post/route.ts</code></li>
                  </ul>
                </li>
                <li>Push to git and Vercel auto-deploys</li>
              </ol>
              <p className="text-xs text-muted-foreground/70 pt-2 border-t">
                Hardcoded changes persist across browsers and users. LocalStorage is per-browser only.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t bg-muted/30">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={saveSettings}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
}

// Hook to get settings
export function useSettings(): DashboardSettings {
  const [settings, setSettings] = useState<DashboardSettings>(DEFAULT_SETTINGS);

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

  return settings;
}

// Hook to get profile
export function useProfile(): UserProfile {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    const saved = localStorage.getItem("userProfile");
    if (saved) {
      try {
        setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(saved) });
      } catch {
        // Use defaults
      }
    }
  }, []);

  return profile;
}

export { DEFAULT_SETTINGS, DEFAULT_PROFILE };
