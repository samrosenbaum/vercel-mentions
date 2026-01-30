"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ParsedTweet {
  id: string;
  text: string;
  author?: string;
  tweetUrl?: string;
  vercelAppLinks: string[];
}

interface BulkTweetImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (tweets: {
    url: string;
    platform: string;
    title: string;
    content: string;
    keyword: string;
  }[]) => void;
}

// Parse pasted content to extract tweets
function parseTweets(text: string): ParsedTweet[] {
  const tweets: ParsedTweet[] = [];

  // Split by common tweet separators (double newlines, or tweet URL patterns)
  const chunks = text.split(/\n{2,}|(?=https:\/\/(twitter\.com|x\.com)\/\w+\/status)/);

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed || trimmed.length < 10) continue;

    // Extract tweet URL if present
    const tweetUrlMatch = trimmed.match(/https:\/\/(twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/);
    const tweetUrl = tweetUrlMatch?.[0];
    const author = tweetUrlMatch?.[2];

    // Extract .vercel.app links
    const vercelAppLinks = trimmed.match(/https?:\/\/[a-zA-Z0-9-]+\.vercel\.app[^\s)"]*/g) || [];

    // Clean up the text (remove the URL if at the end)
    let tweetText = trimmed
      .replace(/https:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+\S*/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // If we only have a URL and no text, use the vercel.app link as context
    if (!tweetText && vercelAppLinks.length > 0) {
      tweetText = `Shared: ${vercelAppLinks[0]}`;
    }

    if (tweetText || vercelAppLinks.length > 0) {
      tweets.push({
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        text: tweetText || "Twitter mention",
        author,
        tweetUrl,
        vercelAppLinks,
      });
    }
  }

  return tweets;
}

export function BulkTweetImport({ isOpen, onClose, onImport }: BulkTweetImportProps) {
  const [rawText, setRawText] = useState("");
  const [parsedTweets, setParsedTweets] = useState<ParsedTweet[]>([]);
  const [step, setStep] = useState<"paste" | "review">("paste");

  const handleParse = () => {
    const tweets = parseTweets(rawText);
    setParsedTweets(tweets);
    setStep("review");
  };

  const handleImport = () => {
    const mentions = parsedTweets.map((tweet) => ({
      url: tweet.tweetUrl || tweet.vercelAppLinks[0] || `https://twitter.com/search?q=${encodeURIComponent(tweet.text.slice(0, 50))}`,
      platform: "twitter",
      title: tweet.text.slice(0, 100) + (tweet.text.length > 100 ? "..." : ""),
      content: tweet.text,
      keyword: tweet.vercelAppLinks.length > 0 ? "vercel" : "vercel",
    }));

    onImport(mentions);
    handleClose();
  };

  const handleClose = () => {
    setRawText("");
    setParsedTweets([]);
    setStep("paste");
    onClose();
  };

  const removeTweet = (id: string) => {
    setParsedTweets((prev) => prev.filter((t) => t.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 md:inset-10 bg-background border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold">Bulk Tweet Import</h2>
            <p className="text-sm text-muted-foreground">
              Paste tweets from Twitter to import .vercel.app mentions
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            ✕
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === "paste" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">How to use</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>1. Go to <a href="https://x.com/search?q=.vercel.app&f=live" target="_blank" rel="noopener noreferrer" className="text-primary underline">Twitter search for .vercel.app</a></p>
                  <p>2. Select and copy the tweets you want (text + URLs)</p>
                  <p>3. Paste everything below</p>
                  <p className="text-xs text-muted-foreground/70 pt-2">
                    Tip: You can copy multiple tweets at once. The parser will try to separate them.
                  </p>
                </CardContent>
              </Card>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Paste tweets here...

Example:
Just launched my portfolio! Check it out: https://mysite.vercel.app

Built a cool AI tool this weekend
https://ai-tool.vercel.app
https://x.com/user/status/123456789`}
                className="w-full min-h-[300px] p-4 text-sm border rounded-lg bg-background resize-none font-mono"
              />

              <div className="flex justify-end">
                <Button onClick={handleParse} disabled={!rawText.trim()}>
                  Parse Tweets ({rawText.trim() ? "ready" : "paste first"})
                </Button>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found {parsedTweets.length} tweets. Review and import:
                </p>
                <Button variant="outline" size="sm" onClick={() => setStep("paste")}>
                  Back to edit
                </Button>
              </div>

              {parsedTweets.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  <p>No tweets detected. Try pasting the content again.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {parsedTweets.map((tweet) => (
                    <Card key={tweet.id} className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {tweet.author && (
                              <p className="text-xs text-muted-foreground mb-1">
                                @{tweet.author}
                              </p>
                            )}
                            <p className="text-sm">{tweet.text}</p>
                            {tweet.vercelAppLinks.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {tweet.vercelAppLinks.map((link, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs font-mono">
                                    {link.replace(/^https?:\/\//, "").slice(0, 40)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTweet(tweet.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            ✕
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Imported tweets will appear in your mentions and can be used for content generation
          </p>
          {step === "review" && parsedTweets.length > 0 && (
            <Button onClick={handleImport}>
              Import {parsedTweets.length} tweets
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
