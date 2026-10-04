import BMOScene from "./components/BMOScene.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import SoundToggle from "./components/SoundToggle.jsx";
import { useSocket } from "./hooks/useSocket.js";

export default function App() {
  const {
    connected,
    messages,
    emotion,
    isThinking,
    sendMessage,
    chatSentSignal,
    chatReceivedSignal,
  } = useSocket();

  return (
    <div className="app-shell">
      <div className="scene-panel">
        <SoundToggle />
        <BMOScene
          emotion={emotion}
          isThinking={isThinking}
          chatSentSignal={chatSentSignal}
          chatReceivedSignal={chatReceivedSignal}
        />
      </div>

      <div className="chat-panel-outer">
        <div className="chat-heading">
          <h1>BMO — An Interactive Chatbot</h1>
          <p>by @anuragxg</p>
          <p className="model-credit">
           ___________________________________________________________________________________
          </p>
        </div>

        <ChatWindow
          messages={messages}
          isThinking={isThinking}
          connected={connected}
          onSend={sendMessage}
        />
      </div>
    </div>
  );
}
