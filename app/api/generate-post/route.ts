import { streamText, gateway } from "ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { idea, voiceSamples, mentions, format = "linkedin", profile } = await request.json();

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
`
      : format === "tweet"
        ? "Write in a casual, engaging tone suitable for Twitter."
        : "Write in a professional but approachable tone suitable for LinkedIn.";

    // Build profile context
    const profileContext = profile
      ? `You are writing for ${profile.name}, who works ${profile.role} at ${profile.company}. ${profile.context}`
      : "You are writing for a tech professional.";

    // Get relevant mentions for context
    const relevantMentions = mentions
      ?.slice(0, 10)
      .map((m: { title: string; url: string }) => `- ${m.title} (${m.url})`)
      .join("\n");

    const formatInstructions = format === "tweet"
      ? `Write a compelling tweet based on this idea. The tweet should:
1. Be under 280 characters (STRICT LIMIT)
2. Be punchy and attention-grabbing
3. Feel natural and conversational
4. Optionally include 1 relevant link if it fits`
      : `Write a compelling LinkedIn post based on this idea. The post should:
1. Start with a strong hook (the first line people see before "see more")
2. Provide real value - insight, education, or a fresh perspective
3. Be 150-250 words (LinkedIn sweet spot)
4. End with a question or call-to-action to drive engagement
5. Include relevant line breaks for readability
6. Optionally reference 1-2 of the recent mentions/links if relevant`;

    const result = streamText({
      model: gateway("anthropic/claude-sonnet-4.5"),
      prompt: `${profileContext}

POST IDEA:
Title: ${idea.title}
Hook: ${idea.hook}
Angle: ${idea.angle}

VOICE GUIDELINES:
${voiceContext}

RECENT RELEVANT CONTENT (for context/links):
${relevantMentions || "No specific mentions provided"}

${formatInstructions}

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

Write ONLY the ${format === "tweet" ? "tweet" : "post"} content, ready to copy-paste. No explanations or meta-commentary.`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Generate post error:", error);
    return new Response("Failed to generate post: " + String(error), {
      status: 500,
    });
  }
}
