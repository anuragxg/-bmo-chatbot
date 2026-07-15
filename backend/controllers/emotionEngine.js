/**
 * Lightweight keyword/heuristic emotion classifier.
 * Maps a piece of text to one of BMO's expression states.
 * This runs on BOTH the user's message (to react live) and BMO's own reply
 * (so the character's face matches what it's "saying").
 */

const LEXICON = {
  excited: [
    "can't wait", "so excited", "let's go", "hyped", "pumped", "yesss", "woohoo",
    "amazing news", "best day",
  ],
  happy: [
    "happy", "great", "awesome", "love", "yay", "nice", "cool", "fun",
    "thanks", "thank you", "lol", "haha", "amazing", "win", "yes!",
  ],
  surprised: [
    "what", "really", "whoa", "wow", "no way", "seriously", "wtf", "omg",
    "!", "cannot believe", "can't believe", "shocked",
  ],
  confused: [
    "confused", "don't understand", "dont understand", "what do you mean",
    "unclear", "lost", "huh", "makes no sense",
  ],
  sad: [
    "sad", "sorry", "unfortunately", "cry", "bad", "fail", "broke", "hurt",
    "lost", "miss", "lonely", "upset", "bug", "error", "crash",
  ],
  sleepy: [
    "tired", "sleepy", "bored", "yawn", "night", "bed", "exhausted", "meh",
  ],
  thinking: [
    "how", "why", "explain", "think", "code", "debug", "function", "algorithm",
    "?", "help me understand", "not sure",
  ],
  curious: [
    "what if", "wonder", "curious", "tell me", "who is", "where", "when",
    "which", "idea",
  ],
};

export function detectEmotion(text = "") {
  const lower = text.toLowerCase();
  const scores = {};

  for (const [emotion, keywords] of Object.entries(LEXICON)) {
    scores[emotion] = keywords.reduce(
      (count, kw) => (lower.includes(kw) ? count + 1 : count),
      0
    );
  }

  let best = "neutral";
  let bestScore = 0;
  for (const [emotion, score] of Object.entries(scores)) {
    if (score > bestScore) {
      best = emotion;
      bestScore = score;
    }
  }

  return best;
}
