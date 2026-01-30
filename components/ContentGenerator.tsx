"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Mention } from "@/lib/db";

interface ContentIdea {
  title: string;
  hook: string;
  angle: string;
  basedOn: string;
}

interface ContentGeneratorProps {
  mentions: Mention[];
  isOpen: boolean;
  onClose: () => void;
}

export function ContentGenerator({ mentions, isOpen, onClose }: ContentGeneratorProps) {
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
  const [generatedPost, setGeneratedPost] = useState("");
  const [loadingPost, setLoadingPost] = useState(false);
  const [voiceSamples, setVoiceSamples] = useState<string[]>([]);
  const [newSample, setNewSample] = useState("");
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load voice samples from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("voiceSamples");
    if (saved) {
      setVoiceSamples(JSON.parse(saved));
    }
  }, []);

  // Save voice samples to localStorage
  const saveVoiceSamples = (samples: string[]) => {
    setVoiceSamples(samples);
    localStorage.setItem("voiceSamples", JSON.stringify(samples));
  };

  const generateIdeas = async () => {
    setLoadingIdeas(true);
    setError(null);
    setIdeas([]);
    setSelectedIdea(null);
    setGeneratedPost("");

    try {
      const res = await fetch("/api/content-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentions }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate ideas");
      }

      const data = await res.json();
      setIdeas(data.ideas);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate ideas");
    } finally {
      setLoadingIdeas(false);
    }
  };

  const generatePost = async (idea: ContentIdea) => {
    setSelectedIdea(idea);
    setLoadingPost(true);
    setGeneratedPost("");
    setError(null);

    try {
      const res = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, voiceSamples, mentions }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate post");
      }

      // Stream the response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No reader available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        // Parse SSE data chunks
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            // Text chunk
            const text = JSON.parse(line.slice(2));
            setGeneratedPost((prev) => prev + text);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate post");
    } finally {
      setLoadingPost(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPost);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 md:inset-10 bg-background border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold">LinkedIn Content Generator</h2>
            <p className="text-sm text-muted-foreground">
              Generate content ideas from {mentions.length} recent mentions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            >
              {voiceSamples.length > 0 ? `Voice (${voiceSamples.length} samples)` : "Train Voice"}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        {/* Voice Settings Panel */}
        {showVoiceSettings && (
          <div className="p-4 border-b bg-muted/30">
            <h3 className="font-medium mb-2">Train Your Voice</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Paste examples of your LinkedIn posts so the AI can match your writing style.
            </p>
            <div className="flex gap-2 mb-3">
              <textarea
                value={newSample}
                onChange={(e) => setNewSample(e.target.value)}
                placeholder="Paste a sample LinkedIn post you've written..."
                className="flex-1 min-h-[80px] p-2 text-sm border rounded-md bg-background"
              />
              <Button
                onClick={() => {
                  if (newSample.trim()) {
                    saveVoiceSamples([...voiceSamples, newSample.trim()]);
                    setNewSample("");
                  }
                }}
                disabled={!newSample.trim()}
              >
                Add
              </Button>
            </div>
            {voiceSamples.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Your voice samples:</p>
                {voiceSamples.map((sample, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-background rounded text-sm">
                    <span className="flex-1 line-clamp-2">{sample}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => saveVoiceSamples(voiceSamples.filter((_, j) => j !== i))}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Ideas */}
          <div className="w-1/2 border-r p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Content Ideas</h3>
              <Button onClick={generateIdeas} disabled={loadingIdeas}>
                {loadingIdeas ? "Analyzing..." : ideas.length ? "Refresh Ideas" : "Generate Ideas"}
              </Button>
            </div>

            {error && (
              <div className="p-3 mb-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            {loadingIdeas && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            )}

            {ideas.length > 0 && (
              <div className="space-y-3">
                {ideas.map((idea, i) => (
                  <Card
                    key={i}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedIdea === idea ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => generatePost(idea)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{idea.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className="font-medium text-primary mb-1">"{idea.hook}"</p>
                      <p className="text-muted-foreground text-xs mb-2">{idea.angle}</p>
                      <p className="text-xs text-muted-foreground/70">
                        Based on: {idea.basedOn}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!loadingIdeas && ideas.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Click "Generate Ideas" to analyze recent mentions</p>
                <p className="text-sm mt-1">and get LinkedIn post suggestions</p>
              </div>
            )}
          </div>

          {/* Right Panel - Generated Post */}
          <div className="w-1/2 p-4 overflow-y-auto bg-muted/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Generated Post</h3>
              {generatedPost && (
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  Copy to Clipboard
                </Button>
              )}
            </div>

            {loadingPost && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Writing post...
              </div>
            )}

            {generatedPost ? (
              <div className="bg-background rounded-lg p-4 shadow-sm">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {generatedPost}
                </div>
                <div className="mt-4 pt-4 border-t flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectedIdea && generatePost(selectedIdea)}
                  >
                    Regenerate
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      window.open(
                        `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(generatedPost)}`,
                        "_blank"
                      );
                    }}
                  >
                    Open in LinkedIn
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Select an idea from the left</p>
                <p className="text-sm mt-1">to generate a LinkedIn post</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
