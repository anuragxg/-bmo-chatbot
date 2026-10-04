import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

function getOrCreateSessionId() {
  let id = sessionStorage.getItem("bmo_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("bmo_session_id", id);
  }
  return id;
}

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [emotion, setEmotion] = useState("neutral");
  const [isThinking, setIsThinking] = useState(false);
  const [chatSentSignal, setChatSentSignal] = useState(0);
  const [chatReceivedSignal, setChatReceivedSignal] = useState(0);
  const sessionId = useRef(getOrCreateSessionId());

  useEffect(() => {
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join_session", sessionId.current);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("bmo_reaction", ({ emotion: e, phase }) => {
      setEmotion(e);
      setIsThinking(phase === "thinking");
    });

    // Streaming: tokens arrive one by one while the local LLM generates.
    // The first token creates BMO's bubble; later tokens append to it.
    socket.on("bmo_token", ({ token }) => {
      setIsThinking(false);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.streaming) {
          return [...prev.slice(0, -1), { ...last, text: last.text + token }];
        }
        return [...prev, { sender: "bmo", text: token, streaming: true, createdAt: new Date() }];
      });
    });

    // Final message: replaces the streaming bubble with the complete reply
    // (or is appended as-is for canned replies, which never stream).
    socket.on("bmo_message", (msg) => {
      setIsThinking(false);
      setEmotion(msg.emotion);
      setChatReceivedSignal((n) => n + 1);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        const final = { sender: "bmo", ...msg };
        if (last?.streaming) return [...prev.slice(0, -1), final];
        return [...prev, final];
      });
    });

    // Load prior history for this session, if the backend/db is available
    fetch(`${SERVER_URL}/api/chat/${sessionId.current}`)
      .then((r) => r.json())
      .then((history) => {
        if (Array.isArray(history) && history.length) {
          setMessages(history);
        }
      })
      .catch(() => {
        /* backend or db not reachable yet - app still works live */
      });

    return () => socket.disconnect();
  }, []);

  const sendMessage = useCallback((text) => {
    if (!text.trim() || !socketRef.current) return;
    const outgoing = { sender: "user", text, createdAt: new Date() };
    setMessages((prev) => [...prev, outgoing]);
    setChatSentSignal((n) => n + 1);
    socketRef.current.emit("user_message", { sessionId: sessionId.current, text });
  }, []);

  return {
    connected,
    messages,
    emotion,
    isThinking,
    sendMessage,
    chatSentSignal,
    chatReceivedSignal,
  };
}
