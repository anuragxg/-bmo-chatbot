import { Ollama } from "ollama";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { detectEmotion } from "./emotionEngine.js";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";
const ollama = new Ollama({ host: OLLAMA_HOST });

const geminiKey = process.env.GEMINI_API_KEY;
const genAI = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;

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

let warnedOllamaOnce = false;
let warnedGeminiOnce = false;

async function tryOllama(userText, history) {
  const messages = [
    { role: "system", content: BMO_SYSTEM_PROMPT },
    ...history.slice(-10).map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text,
    })),
    { role: "user", content: userText },
  ];

  const response = await ollama.chat({ model: OLLAMA_MODEL, messages, stream: false });
  const text = response?.message?.content;
  if (!text || !text.trim()) throw new Error("empty response from Ollama");
  return text.trim();
}

async function tryGemini(userText, history) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: BMO_SYSTEM_PROMPT,
  });

  const mappedHistory = history.slice(-10).map((m) => ({
    role: m.sender === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));

  const chat = model.startChat({ history: mappedHistory });
  const result = await chat.sendMessage(userText);
  const text = result.response.text();
  if (!text || !text.trim()) throw new Error("empty response from Gemini");
  return text.trim();
}

/**
 * Generates BMO's reply, trying Ollama (local) first, then Gemini (cloud)
 * if Ollama isn't reachable, then a canned response as the last resort.
 * This means the same code works great locally (free, private, no limits
 * via Ollama) and still works once deployed somewhere Ollama isn't installed
 * (falls through to Gemini automatically).
 */
export async function generateBmoReply(userText, history = []) {
  try {
    return await tryOllama(userText, history);
  } catch (ollamaErr) {
    if (!warnedOllamaOnce) {
      warnedOllamaOnce = true;
      console.error(`[chatController] Ollama unreachable at ${OLLAMA_HOST}: ${ollamaErr.message}`);
      console.error("[chatController] (expected if Ollama isn't installed here, e.g. on a cloud host) Trying Gemini next...");
    }
  }

  if (genAI) {
    try {
      return await tryGemini(userText, history);
    } catch (geminiErr) {
      if (!warnedGeminiOnce) {
        warnedGeminiOnce = true;
        console.error("[chatController] Gemini API error:", geminiErr.message);
        const isRateLimit = /429|quota|rate.?limit|resource_exhausted/i.test(geminiErr.message || "");
        if (isRateLimit) {
          console.error("[chatController] That's a rate-limit hit, not a real failure - back off request frequency.");
        }
      }
    }
  }

  return cannedReply();
}

export function classifyEmotion(text) {
  return detectEmotion(text);
}
