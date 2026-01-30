"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddMentionProps {
  onAdd: (mention: {
    url: string;
    platform: string;
    title: string;
    keyword: string;
  }) => void;
}

function detectPlatform(url: string): string {
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.includes("linkedin.com")) return "linkedin";
  if (url.includes("reddit.com")) return "reddit";
  if (url.includes("news.ycombinator.com")) return "hackernews";
  if (url.includes("youtube.com")) return "youtube";
  if (url.includes(".vercel.app")) return "app";
  return "blog";
}

export function AddMention({ onAdd }: AddMentionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [keyword, setKeyword] = useState<"vercel" | "v0">("vercel");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    onAdd({
      url,
      platform: detectPlatform(url),
      title: title || "Manual mention",
      keyword,
    });

    setUrl("");
    setTitle("");
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add mention
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
      <Input
        type="url"
        placeholder="Paste URL (LinkedIn, Twitter, etc.)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="flex-1 min-w-[200px]"
        required
      />
      <Input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-[180px]"
      />
      <select
        value={keyword}
        onChange={(e) => setKeyword(e.target.value as "vercel" | "v0")}
        className="h-9 px-3 rounded-md border bg-background text-sm"
      >
        <option value="vercel">Vercel</option>
        <option value="v0">v0</option>
      </select>
      <Button type="submit" size="sm">Add</Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
    </form>
  );
}
