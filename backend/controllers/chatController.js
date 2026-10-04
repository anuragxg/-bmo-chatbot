import { Ollama } from "ollama";
import { detectEmotion } from "./emotionEngine.js";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";
const ollama = new Ollama({ host: OLLAMA_HOST });

const BMO_SYSTEM_PROMPT = `You are BMO, a small living game console who is cheerful, curious,
a little literal-minded, and endlessly loyal. You speak in short, warm, playful sentences.
You get excited about games, math, friendship, and helping your person with whatever they're
working on. Keep replies brief (1-3 sentences) - this is a chat bubble, not an essay.`;

const CANNED_RESPONSES = [
  "BMO is listening! Tell BMO more!",
  "Ooooh, that sounds like a quest! What happens next?",
  "BMO does not have hands for that, but BMO has heart!",
  "Beep boop... processing... BMO thinks that's neat!",
  "Is this a game? BMO loves games!",
  "BMO believes in you! You can do the thing!",
];

function cannedReply() {
  return CANNED_RESPONSES[Math.floor(Math.random() * CANNED_RESPONSES.length)];
}

/**
 * Streams BMO's reply from the local Ollama model.
 *
 * - `history` is the PAST conversation only (do not include `userText` in it;
 *   it's appended here as the final user turn).
 * - `onToken(token)` is called for every chunk as the model generates it.
 * - Resolves to { text, source } where source is "ollama" or "canned".
 *
 * If Ollama is unreachable (not installed / not running / model not pulled),
 * resolves with a canned line instead, so the chat never breaks. The reason is
 * logged on every failure so it's easy to spot in the terminal.
 */
export async function streamBmoReply(userText, history = [], onToken = () => {}) {
  const messages = [
    { role: "system", content: BMO_SYSTEM_PROMPT },
    ...history.slice(-10).map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text,
    })),
    { role: "user", content: userText },
  ];

  let full = "";
  try {
    const stream = await ollama.chat({
      model: OLLAMA_MODEL,
      messages,
      stream: true,
      options: { num_predict: 200 }, // keep replies chat-bubble sized
    });

    for await (const part of stream) {
      const token = part?.message?.content ?? "";
      if (!token) continue;
      full += token;
      onToken(token);
    }

    if (!full.trim()) throw new Error("empty response from Ollama");
    return { text: full.trim(), source: "ollama" };
  } catch (err) {
    console.error(`[chatController] Ollama failed (${OLLAMA_HOST}, model "${OLLAMA_MODEL}"): ${err.message}`);
    console.error(`[chatController] Is Ollama running, and did you run: ollama pull ${OLLAMA_MODEL} ?`);
    // If the stream died midway, keep what was already shown to the user.
    if (full.trim()) return { text: full.trim(), source: "ollama" };
    return { text: cannedReply(), source: "canned" };
  }
}

export function classifyEmotion(text) {
  return detectEmotion(text);
}
