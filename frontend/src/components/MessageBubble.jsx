import { motion } from "framer-motion";

export default function MessageBubble({ sender, text, createdAt }) {
  const time = createdAt
    ? new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className={`msg-row ${sender}`}>
      <motion.div
        className={`msg-group ${sender}`}
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        <div className={`msg-bubble ${sender}`}>{text}</div>
        {time && <div className="msg-meta">{sender === "bmo" ? "BMO" : "You"} · {time}</div>}
      </motion.div>
    </div>
  );
}
