import { streamText, gateway } from "ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { idea, voiceSamples, mentions } = await request.json();

    if (!process.env.AI_GATEWAY_API_KEY) {
      return new Response("AI_GATEWAY_API_KEY not configured", { status: 500 });
    }

    // Build voice context from samples
    const voiceContext = voiceSamples?.length
      ? `
The user writes in this style. Match their voice, tone, and formatting:

${voiceSamples.map((s: string, i: number) => `Example ${i + 1}:\n${s}`).join("\n\n")}

Key patterns to match:
- Their use of emojis (or lack thereof)
- Sentence length and structure
- How they open and close posts
- Their level of formality
- How they use line breaks and formatting
`
      : "Write in a professional but approachable tone suitable for LinkedIn.";

    // Get relevant mentions for context
    const relevantMentions = mentions
      ?.slice(0, 10)
      .map((m: { title: string; url: string }) => `- ${m.title} (${m.url})`)
      .join("\n");

    const result = streamText({
      model: gateway("anthropic/claude-sonnet-4.5"),
      prompt: `You are writing a LinkedIn post for a tech professional.

POST IDEA:
Title: ${idea.title}
Hook: ${idea.hook}
Angle: ${idea.angle}

VOICE GUIDELINES:
${voiceContext}

RECENT RELEVANT CONTENT (for context/links):
${relevantMentions || "No specific mentions provided"}

Write a compelling LinkedIn post based on this idea. The post should:
1. Start with a strong hook (the first line people see before "see more")
2. Provide real value - insight, education, or a fresh perspective
3. Be 150-250 words (LinkedIn sweet spot)
4. End with a question or call-to-action to drive engagement
5. Include relevant line breaks for readability
6. Optionally reference 1-2 of the recent mentions/links if relevant

CRITICAL WRITING RULES (do NOT break these):
- NEVER use em dashes (—). Use commas, periods, or parentheses instead.
- NEVER use the word "delve" or "dive into"
- NEVER use phrases like "game-changer", "unlock", "harness", "leverage", "elevate"
- NEVER start sentences with "In today's..."
- Avoid overusing "I" at the start of sentences
- Use contractions naturally (don't, isn't, it's)
- Write like a real human, not a corporate robot
- NEVER make up statistics, numbers, or percentages. Only use real data if explicitly provided.
- NEVER claim specific results or outcomes you can't verify
- Focus on genuine opinions, observations, and thought leadership
- It's better to be vague ("many developers") than to fabricate ("73% of developers")

Write ONLY the post content, ready to copy-paste to LinkedIn. No explanations or meta-commentary.`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Generate post error:", error);
    return new Response("Failed to generate post: " + String(error), {
      status: 500,
    });
  }
}
