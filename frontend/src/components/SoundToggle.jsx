import { useState } from "react";
import { motion } from "framer-motion";
import { soundEngine } from "../utils/soundEngine.js";

export default function SoundToggle() {
  const [muted, setMutedState] = useState(false);

  const toggle = () => {
    const next = !muted;
    setMutedState(next);
    soundEngine.setMuted(next);
  };

  return (
    <motion.button
      className="sound-toggle"
      onClick={toggle}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
      title={muted ? "Unmute sound effects" : "Mute sound effects"}
    >
      {muted ? "🔇" : "🔊"}
    </motion.button>
  );
}
