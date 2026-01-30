"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface VoiceSample {
  id: string;
  content: string;
  source: "manual" | "twitter" | "linkedin" | "blog";
  sourceUrl?: string;
  addedAt: string;
}

interface VoiceProfile {
  samples: VoiceSample[];
  analysis?: {
    avgLength: number;
    usesEmojis: boolean;
    commonEmojis: string[];
    tone: string;
    sentenceStyle: string;
    openingPatterns: string[];
    closingPatterns: string[];
  };
}

interface VoiceTrainingProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceTraining({ isOpen, onClose }: VoiceTrainingProps) {
  const [profile, setProfile] = useState<VoiceProfile>({ samples: [] });
  const [newSample, setNewSample] = useState("");
  const [blogUrl, setBlogUrl] = useState("");
  const [loadingBlog, setLoadingBlog] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"samples" | "import" | "analysis">("samples");

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("voiceProfile");
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch {
        // Use default
      }
    }
  }, [isOpen]);

  const saveProfile = (newProfile: VoiceProfile) => {
    setProfile(newProfile);
    localStorage.setItem("voiceProfile", JSON.stringify(newProfile));
    // Also save samples in the old format for backward compatibility
    localStorage.setItem(
      "voiceSamples",
      JSON.stringify(newProfile.samples.map((s) => s.content))
    );
  };

  const addSample = (content: string, source: VoiceSample["source"], sourceUrl?: string) => {
    if (!content.trim()) return;

    const sample: VoiceSample = {
      id: Date.now().toString(),
      content: content.trim(),
      source,
      sourceUrl,
      addedAt: new Date().toISOString(),
    };

    saveProfile({
      ...profile,
      samples: [...profile.samples, sample],
      analysis: undefined, // Clear analysis when samples change
    });
  };

  const removeSample = (id: string) => {
    saveProfile({
      ...profile,
      samples: profile.samples.filter((s) => s.id !== id),
      analysis: undefined,
    });
  };

  const handleAddManualSample = () => {
    addSample(newSample, "manual");
    setNewSample("");
  };

  const handleImportBlog = async () => {
    if (!blogUrl.trim()) return;

    setLoadingBlog(true);
    try {
      const res = await fetch("/api/import-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: blogUrl }),
      });

      if (!res.ok) throw new Error("Failed to import blog");

      const data = await res.json();

      // Add each blog post as a sample
      for (const post of data.posts) {
        addSample(post.content, "blog", post.url);
      }

      setBlogUrl("");
    } catch (error) {
      console.error("Blog import error:", error);
      alert("Failed to import blog. Make sure the URL is correct.");
    } finally {
      setLoadingBlog(false);
    }
  };

  const analyzeVoice = async () => {
    if (profile.samples.length < 3) {
      alert("Add at least 3 samples to analyze your voice");
      return;
    }

    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ samples: profile.samples.map((s) => s.content) }),
      });

      if (!res.ok) throw new Error("Failed to analyze voice");

      const analysis = await res.json();
      saveProfile({ ...profile, analysis });
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Failed to analyze voice. Make sure ANTHROPIC_API_KEY is configured.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 md:inset-10 bg-background border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold">Voice Training</h2>
            <p className="text-sm text-muted-foreground">
              Train the AI to write in your style ({profile.samples.length} samples)
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-4">
          {[
            { id: "samples", label: "My Samples" },
            { id: "import", label: "Import Content" },
            { id: "analysis", label: "Voice Analysis" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "samples" && (
            <div className="space-y-4">
              {/* Add Sample */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Add a Sample Post</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={newSample}
                    onChange={(e) => setNewSample(e.target.value)}
                    placeholder="Paste one of your LinkedIn posts, tweets, or blog excerpts..."
                    className="w-full min-h-[120px] p-3 text-sm border rounded-md bg-background resize-none"
                  />
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-xs text-muted-foreground">
                      Tip: Add 5-10 samples for best results
                    </p>
                    <Button onClick={handleAddManualSample} disabled={!newSample.trim()}>
                      Add Sample
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Existing Samples */}
              {profile.samples.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">
                    Your Samples ({profile.samples.length})
                  </h3>
                  {profile.samples.map((sample) => (
                    <Card key={sample.id} className="bg-muted/30">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {sample.source}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(sample.addedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm line-clamp-3">{sample.content}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSample(sample.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            ✕
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No samples yet</p>
                  <p className="text-sm">Add your posts to train the AI on your voice</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "import" && (
            <div className="space-y-4">
              {/* Blog Import */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Import from Blog</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Enter your blog URL and we'll extract your writing samples
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={blogUrl}
                      onChange={(e) => setBlogUrl(e.target.value)}
                      placeholder="https://yourblog.com or RSS feed URL"
                      className="flex-1"
                    />
                    <Button onClick={handleImportBlog} disabled={loadingBlog || !blogUrl.trim()}>
                      {loadingBlog ? "Importing..." : "Import"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Twitter Import */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Import from Twitter</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    To import your tweets automatically, you need a Twitter API key ($100/month).
                  </p>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Manual Alternative:</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Go to your Twitter profile</li>
                      <li>Copy your best tweets one by one</li>
                      <li>Paste them in the "My Samples" tab</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* LinkedIn Import */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Import from LinkedIn</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    LinkedIn doesn't allow automated exports, but you can manually add your posts.
                  </p>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">How to export:</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Go to your LinkedIn profile → Activity → Posts</li>
                      <li>Click on each post you want to use</li>
                      <li>Copy the text and paste in "My Samples" tab</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "analysis" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Analyze Your Voice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    AI will analyze your samples and identify your writing patterns.
                  </p>
                  <Button
                    onClick={analyzeVoice}
                    disabled={analyzing || profile.samples.length < 3}
                    className="w-full"
                  >
                    {analyzing
                      ? "Analyzing..."
                      : profile.samples.length < 3
                      ? `Add ${3 - profile.samples.length} more samples`
                      : "Analyze My Voice"}
                  </Button>
                </CardContent>
              </Card>

              {profile.analysis && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Your Voice Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Avg. Post Length</p>
                        <p className="text-lg font-semibold">{profile.analysis.avgLength} words</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Tone</p>
                        <p className="text-lg font-semibold capitalize">{profile.analysis.tone}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Emoji Usage</p>
                      <p className="text-sm">
                        {profile.analysis.usesEmojis
                          ? `Yes - commonly uses: ${profile.analysis.commonEmojis.join(" ")}`
                          : "Rarely uses emojis"}
                      </p>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Sentence Style</p>
                      <p className="text-sm">{profile.analysis.sentenceStyle}</p>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Common Opening Patterns</p>
                      <ul className="text-sm space-y-1">
                        {profile.analysis.openingPatterns.map((p, i) => (
                          <li key={i}>• {p}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Common Closing Patterns</p>
                      <ul className="text-sm space-y-1">
                        {profile.analysis.closingPatterns.map((p, i) => (
                          <li key={i}>• {p}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!profile.analysis && profile.samples.length >= 3 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Click "Analyze My Voice" to see your writing patterns</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Voice data is saved locally in your browser
          </p>
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}
