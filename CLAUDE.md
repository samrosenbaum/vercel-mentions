# Project Instructions for Claude

## AI Gateway Setup (IMPORTANT)

This project uses **Vercel AI Gateway**, NOT direct Anthropic API.

### Correct setup:

```typescript
// Import gateway from ai package
import { generateText, gateway } from "ai";
// or
import { streamText, gateway } from "ai";

// Use gateway() wrapper around model string
const result = await generateText({
  model: gateway("anthropic/claude-sonnet-4.5"),
  prompt: "...",
});
```

### Environment variable:
- Use `AI_GATEWAY_API_KEY` (NOT `ANTHROPIC_API_KEY`)
- Check with: `process.env.AI_GATEWAY_API_KEY`

### Common mistakes to avoid:
- ❌ `import { anthropic } from "@ai-sdk/anthropic"` - WRONG
- ❌ `model: "anthropic/claude-sonnet-4.5"` - WRONG (string alone doesn't work)
- ❌ `ANTHROPIC_API_KEY` - WRONG env var name
- ✅ `import { gateway } from "ai"` - CORRECT
- ✅ `model: gateway("anthropic/claude-sonnet-4.5")` - CORRECT
- ✅ `AI_GATEWAY_API_KEY` - CORRECT env var name

## Streaming Responses

When streaming text to the frontend, `toTextStreamResponse()` returns plain text chunks.
The frontend should just append chunks directly:

```typescript
// Frontend - simple approach
const chunk = decoder.decode(value);
setGeneratedPost((prev) => prev + chunk);
```

Don't try to parse SSE format with `0:` prefixes - just use raw text.
