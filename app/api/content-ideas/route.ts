import { generateText } from "ai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { mentions } = await request.json();

    if (!process.env.AI_GATEWAY_API_KEY) {
      return NextResponse.json(
        { error: "AI_GATEWAY_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Summarize the mentions for the prompt
    const mentionsSummary = mentions
      .slice(0, 20)
      .map(
        (m: { title: string; platform: string; content?: string }) =>
          `- [${m.platform}] ${m.title}${m.content ? `: ${m.content.slice(0, 100)}...` : ""}`
      )
      .join("\n");

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4.5",
      prompt: `You are a social media content strategist for a developer-focused company.

Analyze these recent mentions about Vercel and v0 from across the web:

${mentionsSummary}

Based on these trends and discussions, suggest exactly 3 compelling LinkedIn post ideas. Each idea should:
1. Be relevant to developers and tech leaders
2. Provide value (insight, education, or inspiration)
3. Be based on real trends you see in the data
4. Work well for LinkedIn's professional audience

Format your response as JSON:
{
  "ideas": [
    {
      "title": "Short catchy title (5-8 words)",
      "hook": "The compelling first line that grabs attention",
      "angle": "What makes this interesting - the unique perspective",
      "basedOn": "What trend/mention inspired this"
    }
  ]
}

Return ONLY the JSON, no other text.`,
    });

    // Parse the JSON response
    const ideas = JSON.parse(text);

    return NextResponse.json(ideas);
  } catch (error) {
    console.error("Content ideas error:", error);
    return NextResponse.json(
      { error: "Failed to generate content ideas", details: String(error) },
      { status: 500 }
    );
  }
}
