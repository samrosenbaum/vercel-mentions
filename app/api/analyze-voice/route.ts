import { NextResponse } from "next/server";
import { generateText, gateway } from "ai";

interface VoiceAnalysis {
  avgLength: number;
  usesEmojis: boolean;
  commonEmojis: string[];
  tone: string;
  sentenceStyle: string;
  openingPatterns: string[];
  closingPatterns: string[];
}

export async function POST(request: Request) {
  try {
    const { samples } = await request.json();

    if (!samples || !Array.isArray(samples) || samples.length < 3) {
      return NextResponse.json(
        { error: "At least 3 writing samples are required" },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.AI_GATEWAY_API_KEY) {
      // Return basic analysis without AI
      return NextResponse.json(analyzeBasic(samples));
    }

    const prompt = `Analyze these writing samples and identify the author's writing style patterns. Return a JSON object with these exact fields:

{
  "avgLength": <average word count per sample as integer>,
  "usesEmojis": <true/false>,
  "commonEmojis": [<array of commonly used emojis, empty if none>],
  "tone": "<one word: professional, casual, enthusiastic, technical, conversational, etc>",
  "sentenceStyle": "<brief description of sentence structure, e.g., 'Short, punchy sentences' or 'Long, flowing paragraphs'>",
  "openingPatterns": [<3 common ways they start posts, e.g., "Asking a question", "Bold statement", "Personal anecdote">],
  "closingPatterns": [<3 common ways they end posts, e.g., "Call to action", "Question to audience", "Key takeaway">]
}

Writing samples to analyze:

${samples.map((s: string, i: number) => `--- Sample ${i + 1} ---\n${s}\n`).join("\n")}

Return ONLY the JSON object, no other text.`;

    const { text } = await generateText({
      model: gateway("anthropic/claude-sonnet-4.5"),
      prompt,
    });

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Fall back to basic analysis
      return NextResponse.json(analyzeBasic(samples));
    }

    const analysis: VoiceAnalysis = JSON.parse(jsonMatch[0]);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Voice analysis error:", error);
    // Return basic analysis on error
    return NextResponse.json(
      { error: "Failed to analyze voice" },
      { status: 500 }
    );
  }
}

// Basic analysis without AI
function analyzeBasic(samples: string[]): VoiceAnalysis {
  const allText = samples.join(" ");
  const words = allText.split(/\s+/).filter((w) => w.length > 0);
  const avgLength = Math.round(words.length / samples.length);

  // Check for emojis
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojis = allText.match(emojiRegex) || [];
  const uniqueEmojis = [...new Set(emojis)].slice(0, 5);

  // Analyze sentence length
  const sentences = allText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLength =
    sentences.length > 0
      ? Math.round(words.length / sentences.length)
      : avgLength;

  let sentenceStyle: string;
  if (avgSentenceLength < 10) {
    sentenceStyle = "Short, punchy sentences";
  } else if (avgSentenceLength < 20) {
    sentenceStyle = "Medium-length, balanced sentences";
  } else {
    sentenceStyle = "Long, detailed sentences";
  }

  // Detect tone based on punctuation and keywords
  const exclamations = (allText.match(/!/g) || []).length;
  const questions = (allText.match(/\?/g) || []).length;
  const hasEmojis = emojis.length > 0;

  let tone: string;
  if (exclamations > samples.length * 2 || hasEmojis) {
    tone = "enthusiastic";
  } else if (questions > samples.length) {
    tone = "conversational";
  } else if (
    allText.includes("API") ||
    allText.includes("code") ||
    allText.includes("deploy")
  ) {
    tone = "technical";
  } else {
    tone = "professional";
  }

  return {
    avgLength,
    usesEmojis: emojis.length > 0,
    commonEmojis: uniqueEmojis,
    tone,
    sentenceStyle,
    openingPatterns: [
      "Direct statement",
      "Context setting",
      "Personal perspective",
    ],
    closingPatterns: ["Summary point", "Forward-looking statement", "Invitation to engage"],
  };
}
