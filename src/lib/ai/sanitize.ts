// Sanitize user input before injecting into AI prompts
// Prevents prompt injection attacks where users try to override system instructions

// Strip sequences that could trick the model into treating user text as instructions
export function sanitizeForAI(input: string): string {
  // Cap length — no single user message needs more than 2000 chars for fashion advice
  const trimmed = input.slice(0, 2000);

  // Remove common prompt injection patterns
  return trimmed
    // Strip markdown-style system/instruction delimiters
    .replace(/```(system|instruction|prompt|context)[\s\S]*?```/gi, "[removed]")
    // Strip XML-style system tags
    .replace(/<\/?(?:system|instruction|prompt|context|SYSTEM|INSTRUCTION)[^>]*>/gi, "[removed]")
    // Strip "ignore previous instructions" patterns
    .replace(/ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi, "[removed]")
    // Strip "you are now" role reassignment
    .replace(/you\s+are\s+now\s+(?:a|an|the)\s+/gi, "[removed]")
    // Strip "new system prompt" / "override" patterns
    .replace(/(new\s+)?system\s+prompt\s*[:=]/gi, "[removed]")
    .replace(/override\s+(system|instructions?|rules?)/gi, "[removed]");
}
