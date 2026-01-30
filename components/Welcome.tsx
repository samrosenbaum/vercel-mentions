"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WelcomeProps {
  onComplete: (name: string) => void;
}

export function Welcome({ onComplete }: WelcomeProps) {
  const [step, setStep] = useState<"loading" | "ask" | "welcome" | "done">("loading");
  const [name, setName] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    if (savedName) {
      setName(savedName);
      setStep("welcome");
    } else {
      setStep("ask");
    }
  }, []);

  // Cursor blink effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Typewriter effect for welcome message
  useEffect(() => {
    if (step !== "welcome") return;

    const messages = [
      `> welcome, ${name.toLowerCase()}`,
      "",
      "> i'm your socials assistant",
      "> let's see what people are building",
    ];

    const fullText = messages.join("\n");
    let index = 0;

    const interval = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
        // Auto-dismiss after typing completes
        setTimeout(() => {
          setStep("done");
          onComplete(name);
        }, 1500);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [step, name, onComplete]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cleanName = name.trim();
    localStorage.setItem("userName", cleanName);
    setName(cleanName);
    setStep("welcome");
  };

  if (step === "loading" || step === "done") return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="w-full max-w-lg p-8">
        {step === "ask" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="font-mono text-green-400 text-sm space-y-1">
              <p>&gt; initializing socials dashboard...</p>
              <p>&gt; connection established</p>
              <p className="pt-4">&gt; what should i call you?</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 font-mono">
                  &gt;
                </span>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="enter your name"
                  className="bg-transparent border-green-400/50 text-green-400 font-mono pl-8 placeholder:text-green-400/40 focus-visible:ring-green-400/50"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                disabled={!name.trim()}
                className="bg-green-400 text-black hover:bg-green-300 font-mono"
              >
                enter
              </Button>
            </div>
          </form>
        )}

        {step === "welcome" && (
          <div className="font-mono text-green-400 text-lg whitespace-pre-line">
            {displayedText}
            <span className={`${showCursor ? "opacity-100" : "opacity-0"} transition-opacity`}>
              █
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook to get user name
export function useUserName(): string | null {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    setName(localStorage.getItem("userName"));
  }, []);

  return name;
}
