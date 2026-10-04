# BMO — Interactive Chat Companion

A full-stack MERN project: a chat app with a 3D console-style companion character
(original design, in the spirit of BMO from Adventure Time) that tracks your cursor
and reacts with emotions as you chat.

## Stack

- **Frontend**: React + Vite, `@react-three/fiber` / `@react-three/drei` (Three.js) for the
  3D character, `@react-three/postprocessing` for bloom/vignette, GSAP for choreographed
  gestures, Framer Motion for chat UI animation, Socket.IO client for real-time chat.
- **Backend**: Node.js + Express + Socket.IO, MongoDB (Mongoose) for chat history, and
  **Ollama** (a local LLM, no API key) for the bot's replies, streamed token-by-token to
  the browser. If Ollama isn't reachable, BMO falls back to canned lines and logs why.

## How it works

- **Face**: drawn on a low-res canvas (42×42) then upscaled with smoothing disabled -
  this is what gives the LED/dot-matrix console look. 9 expressions: happy, sad, sleepy,
  surprised, thinking, curious, confused, excited, dizzy.
- **Idle system**: continuous breathing/sway every frame, plus a random micro-action
  (head tilt, look away, hand twitch, leg shift, happy bounce, blink) every 4-8s -
  see `src/utils/bmoAnimations.js`.
- **Gestures**: click detection distinguishes single/double/triple(+) clicks
  (300ms window) and plays a random GSAP timeline from the matching set - jump, wave,
  spin, dance, or the triple-click "lose balance and fall" gag.
- **Hover**: scale-up + emissive glow + eyes track the cursor.
- **Chat-reactive**: sending a message triggers a look-at-panel + nod + blink; BMO's
  reply triggers a random celebration animation (jump, clap, wave, bounce...).
- **Scene**: soft studio environment lighting, floating Sparkles particles, contact
  shadow, subtle mouse-parallax camera, bloom + vignette post-processing.
- Every message you send is run through a lightweight keyword-based emotion classifier
  (`backend/controllers/emotionEngine.js`) - this drives BMO's live reaction before the
  reply even streams back, plus classifies BMO's own reply for its expression.
- Socket.IO events: `user_message` (you → server), `bmo_reaction` (immediate emotion
  ping), `bmo_token` (one chunk of BMO's reply as the local LLM generates it, so text
  appears live), and `bmo_message` (the final reply + emotion, which replaces the
  streaming bubble).

## Screen Display

BMO's screen currently plays a looping video (`frontend/public/videos/bmo-display.mp4`,
muted, center-cropped to fit the roughly-square screen) instead of the emotion-based
canvas face. The face-drawing system (`useFaceTexture` in `BMOCharacter.jsx`) is still
in the file, just unwired - swap `videoTexture` back to `texture` in the screen mesh
setup if you want the reactive emoticon face back, or want to blend the two (e.g.
video during idle, emoticon during chat reactions).

**Note**: the video file is ~50MB, which is large for a web asset - fine for local
dev/demo, but worth compressing (e.g. `ffmpeg -i in.mp4 -vcodec libx264 -crf 28 -vf
scale=720:-2 out.mp4`) before deploying anywhere public.

## 3D Model

The character uses a real rigged GLB model instead of procedural geometry:

**"BMO Cute Model 3D"** by [Lunar](https://sketchfab.com/Luna4r) on Sketchfab,
licensed [CC-BY-4.0](http://creativecommons.org/licenses/by/4.0/). Attribution is
already included in the UI (below the chat title) and here in this README — if you
reuse this project, keep that credit intact per the license.

The model lives at `frontend/public/models/bmo.glb` and is loaded via
`@react-three/drei`'s `useGLTF`/`useAnimations`. A few integration notes:

- It ships with its own baked **"Idle" animation** (breathing/sway across the whole
  rig) - the app plays this continuously and only pauses it (via `action.paused`)
  during click gestures or the "thinking" pose, so GSAP/manual tweens on the same
  bones don't fight the mixer. It un-pauses automatically afterward.
- The GLB contained a redundant **static (non-rigged) duplicate of the body** sitting
  next to the actual skinned/animated one - the code hides it (`visible = false`) to
  avoid a frozen ghost body overlapping the animated one.
- The **screen mesh** (`BMO-Body_BMO-Screen_0`) is re-parented onto the body bone
  (`BMO-Rig-Body`) so it stays glued to the torso as it sways, and its baked texture
  is swapped for the same dynamically-drawn canvas face used before (the emotion
  system needs a texture it can redraw every frame).
- Click/hover/chat gestures are wired to the model's actual bones
  (`BMO-Rig-Arm-L1_08`, `BMO-Rig-Leg-R1_03`, etc.) via `src/utils/bmoAnimations.js`.

**Known caveat - this needs your eyes**: I integrated this without being able to
render/preview it (no browser in my sandbox), so two things are best-effort guesses
you'll likely want to tune once you see it live in `npm run dev`:
- **Scale/position** (`scale={0.13}`, `position={[0, -1.9, 0]}` in
  `BMOCharacter.jsx`) - computed from the model's raw bounding box, not visually
  confirmed. If BMO looks too big/small or off-center, adjust these two numbers.
- **Gesture bone axes** - each gesture in `bmoAnimations.js` rotates a specific axis
  (e.g. `rotation.z` for arm swings) based on typical rig conventions. If an arm/leg
  moves the wrong way or doesn't move at all during a gesture, that bone's actual
  hinge axis is probably different - try swapping to `rotation.x` or `rotation.y`,
  or flipping the sign, for that specific tween.

## Setup

### 0. Install Ollama (one-time, for real AI replies)

1. Download and install from **https://ollama.com** (Mac/Windows/Linux)
2. Pull a model - pick one based on your hardware:
   ```bash
   ollama pull llama3.2      # ~3B params, good balance, needs ~8GB RAM
   ollama pull gemma2:2b     # smaller/faster, needs less RAM
   ```
3. Ollama runs as a background service automatically after install (listens on
   `http://localhost:11434`). No API key, no rate limits, fully offline.
4. Quick sanity check it's working: `ollama run llama3.2` and type something -
   if you get a reply in the terminal, the backend will be able to reach it too.

**Hardware note**: local LLMs are much slower than a cloud API unless you have
a decent CPU (or ideally a GPU Ollama can use). On a modest laptop, expect
replies to take a few seconds rather than the ~1 second you'd get from a cloud
API. If it feels too slow, `gemma2:2b` or `llama3.2:1b` are lighter/faster
trade-offs for reply quality.

If you'd rather skip local LLM setup entirely, that's fine too - just don't
install Ollama, and BMO will use the canned response fallback (no errors,
no setup required).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env if you want to change the model or Ollama's host/port (defaults are usually fine)
npm run dev
```

Backend runs on `http://localhost:5000` by default.

If you don't have MongoDB running locally, either:
- install MongoDB Community Server and start it, or
- use a free MongoDB Atlas cluster and paste its connection string into `MONGO_URI`.

The app still works without Mongo connected — it just won't persist chat history
across refreshes.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173`. Open it in your browser and start chatting.

## Deployment

BMO uses a local model, so the **backend has to run on a machine with Ollama** - cloud
free tiers can't run an LLM. That still leaves two good ways to share it, both free and
with no API:

**Option A - Demo mode (simplest).** Run everything locally and record a short demo
video/GIF for your README and LinkedIn. Deploy only the frontend if you like; the live
link will show BMO offline unless your backend is reachable.

**Option B - Live link from your own machine.** Deploy the frontend, and expose your
local backend through a free tunnel:

1. Start Ollama, MongoDB (or an Atlas free cluster) and the backend (`npm start`)
2. Install `cloudflared` and run `cloudflared tunnel --url http://localhost:5000` -
   it prints a public `https://....trycloudflare.com` URL (WebSockets work through it)
3. Deploy the frontend (Vercel/Netlify): base directory `frontend`, build command
   `npm run build`, publish directory `frontend/dist`, and set
   `VITE_SERVER_URL` to the tunnel URL **before** building (Vite bakes it in)
4. Set `CLIENT_ORIGIN` in `backend/.env` to your deployed frontend URL and restart the
   backend (CORS)

The link only works while your machine, Ollama and the tunnel are running - which is the
trade-off of zero API cost.

## Extending this project

Some natural next steps if you want to build this out further for your portfolio:

- Add RAG memory: embed past chats with a local embedding model (e.g. `nomic-embed-text` via Ollama) and retrieve relevant context before each reply.
- Add more emotion states (e.g. "excited", "confused") and expand the keyword lexicon,
  or replace it with a real sentiment analysis model.
- Persist per-user sessions with actual auth instead of a random session ID.
- Add voice input/output (Web Speech API) so you can talk to BMO out loud.
- Add Whisper (speech-to-text) and Piper (text-to-speech) for a fully local voice pipeline.
