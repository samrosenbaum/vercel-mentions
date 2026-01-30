"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AddMentionsProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (mentions: {
    url: string;
    platform: string;
    title: string;
    content: string;
    keyword: string;
  }[]) => void;
}

function detectPlatform(text: string): string {
  if (text.includes("twitter.com") || text.includes("x.com")) return "twitter";
  if (text.includes("linkedin.com")) return "linkedin";
  if (text.includes("reddit.com")) return "reddit";
  if (text.includes(".vercel.app")) return "app";
  return "other";
}

export function AddMentions({ isOpen, onClose, onAdd }: AddMentionsProps) {
  const [text, setText] = useState("");

  const handleAdd = () => {
    if (!text.trim()) return;

    // Split by double newlines to get separate mentions
    const chunks = text
      .split(/\n{2,}/)
      .map((c) => c.trim())
      .filter((c) => c.length > 10);

    if (chunks.length === 0) {
      // If no double newlines, treat whole thing as one mention
      chunks.push(text.trim());
    }

    const mentions = chunks.map((chunk) => {
      // Extract any URL from the chunk
      const urlMatch = chunk.match(/https?:\/\/[^\s]+/);
      const url = urlMatch?.[0] || "";

      return {
        url: url || `#manual-${Date.now()}`,
        platform: detectPlatform(chunk),
        title: chunk.slice(0, 100) + (chunk.length > 100 ? "..." : ""),
        content: chunk,
        keyword: "vercel",
      };
    });

    onAdd(mentions);
    setText("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-background border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold">Add Mentions</h2>
            <p className="text-sm text-muted-foreground">
              Paste content from Twitter, LinkedIn, or anywhere
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste posts or content here...

Separate multiple items with blank lines.

Example:
Just shipped a new feature using Vercel!

Another post about v0 goes here..."
            className="w-full min-h-[200px] p-3 text-sm border rounded-lg bg-background resize-none"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t bg-muted/30">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!text.trim()}>
            Add Mentions
          </Button>
        </div>
      </div>
    </div>
  );
}
