import { streamText, gateway } from "ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { currentPost, feedback, format = "linkedin", profile, voiceSamples } = await request.json();

    if (!process.env.AI_GATEWAY_API_KEY) {
      return new Response("AI_GATEWAY_API_KEY not configured", { status: 500 });
    }

    // Build profile context
    const profileContext = profile
      ? `You are writing for ${profile.name}, who works ${profile.role} at ${profile.company}. ${profile.context}`
      : "You are writing for a tech professional.";

    // Build voice context from samples
    const voiceContext = voiceSamples?.length
      ? `
Match this writing style:
${voiceSamples.map((s: string, i: number) => `Example ${i + 1}:\n${s}`).join("\n\n")}
`
      : "";

    const formatConstraints = format === "tweet"
      ? "Keep it under 280 characters."
      : "Keep it 150-250 words with good line breaks for readability.";

    const result = streamText({
      model: gateway("anthropic/claude-sonnet-4.5"),
      prompt: `${profileContext}

You are refining a ${format === "tweet" ? "tweet" : "LinkedIn post"} based on user feedback.

CURRENT POST:
${currentPost}

USER FEEDBACK:
${feedback}

${voiceContext}

Apply the user's feedback to improve the post. ${formatConstraints}

CRITICAL RULES:
- NEVER use em dashes (—). Use commas, periods, or parentheses instead.
- NEVER use "delve", "dive into", "game-changer", "unlock", "harness", "leverage", "elevate"
- NEVER start with "In today's..."
- Write like a real human, not a corporate robot
- NEVER make up statistics or numbers

Write ONLY the refined ${format === "tweet" ? "tweet" : "post"} content. No explanations.`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Refine post error:", error);
    return new Response("Failed to refine post: " + String(error), {
      status: 500,
    });
  }
}
