import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble.jsx";
import { soundEngine } from "../utils/soundEngine.js";

function TypingIndicator() {
  return (
    <motion.div
      className="typing-indicator"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
    >
      <span className="typing-label">BMO is thinking</span>
      <span className="typing-dots">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="typing-dot"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </span>
    </motion.div>
  );
}

export default function ChatWindow({ messages, isThinking, connected, onSend }) {
  const [draft, setDraft] = useState("");
  const historyRef = useRef(null);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft);
    setDraft("");
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <span>BMO CHAT LOG</span>
        <span className="online-indicator">
          <motion.span
            className="online-dot"
            animate={{ opacity: connected ? [1, 0.4, 1] : 1 }}
            transition={{ duration: 1.6, repeat: connected ? Infinity : 0 }}
            style={{ background: connected ? undefined : "#c9c2ae" }}
          />
          {connected ? "ONLINE" : "OFFLINE"}
        </span>
      </div>

      <div className="chat-history" ref={historyRef}>
        {messages.length === 0 && (
          <div className="msg-row bmo">
            <div className="msg-group bmo">
              <div className="msg-bubble bmo">
                Hi! BMO is here! Say something and I'll react~
              </div>
            </div>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <MessageBubble key={i} sender={m.sender} text={m.text} createdAt={m.createdAt} />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>{isThinking && <TypingIndicator />}</AnimatePresence>

      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Talk to BMO..."
          maxLength={500}
        />
        <motion.button
          type="submit"
          disabled={!draft.trim()}
          whileHover={draft.trim() ? { scale: 1.05 } : {}}
          whileTap={draft.trim() ? { scale: 0.92 } : {}}
        >
          SEND
        </motion.button>
      </form>
    </div>
  );
}
