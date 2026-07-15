# BMO — Interactive Chat Companion

A full-stack MERN project: a chat app with a 3D console-style companion character
(original design, in the spirit of BMO from Adventure Time) that tracks your cursor
and reacts with emotions as you chat.

## Stack

- **Frontend**: React + Vite, `@react-three/fiber` / `@react-three/drei` (Three.js) for the
  3D character, `@react-three/postprocessing` for bloom/vignette, GSAP for choreographed
  gestures, Framer Motion for chat UI animation, Socket.IO client for real-time chat.
- **Backend**: Node.js + Express + Socket.IO, MongoDB (Mongoose) for chat history,
  Ollama (local LLM, tried first) falling through to Gemini API (cloud, used automatically
  once deployed) for the bot's replies, with a canned-response fallback if neither works
  if no API key is set.

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
- Socket.IO handles three events: `user_message` (you → server), `bmo_reaction`
  (immediate emotion ping), and `bmo_message` (the final reply + emotion).

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

Ollama needs real local compute (RAM/CPU/GPU), so it can't run on typical free
cloud hosting - which is exactly why the chat controller tries Ollama first,
then automatically falls through to Gemini. For a public link, you'll deploy
the app normally and let it use Gemini in production (Ollama simply won't be
reachable there, and the code handles that gracefully).

### 1. Database - MongoDB Atlas (free)
Already covered above. Make sure you have your `MONGO_URI` connection string.

### 2. Chat brain for production - Gemini (free)
Get a key at **aistudio.google.com** (no card needed). You'll set this as an
environment variable on your hosting provider, not in a committed `.env` file.

### 3. Backend - Render or Railway (free tier)
1. Push this project to a GitHub repo
2. On Render: New → Web Service → connect the repo → set **root directory** to
   `backend` → build command `npm install` → start command `npm start`
3. Add environment variables in Render's dashboard (not a `.env` file):
   - `MONGO_URI` - your Atlas connection string
   - `GEMINI_API_KEY` - your Gemini key
   - `CLIENT_ORIGIN` - your frontend's URL (you'll get this in step 4 - you
     can come back and update it after)
4. Deploy - you'll get a URL like `https://bmo-backend.onrender.com`

**Free-tier heads-up**: Render's free web services spin down after inactivity
and take ~30-60 seconds to wake up on the next request. Fine for a portfolio
project, just don't be surprised by the first message being slow after the
link's been idle a while.

### 4. Frontend - Netlify or Vercel
1. Locally: this needs a production build, not the raw source -
   `cd frontend && npm run build` creates a `dist/` folder
2. On Netlify: either drag-and-drop that `dist/` folder, or (better) connect
   the GitHub repo and set: base directory `frontend`, build command
   `npm run build`, publish directory `frontend/dist`
3. Add an environment variable: `VITE_SERVER_URL` = your Render backend URL
   from step 3. Vite bakes env vars in at build time, so set this *before*
   building/deploying, not after.
4. Deploy - you'll get your public link here

### 5. Wire them together
Go back to Render and update `CLIENT_ORIGIN` to your actual Netlify URL (for
CORS), then redeploy the backend. Test the full flow on the public link.

## Extending this project

Some natural next steps if you want to build this out further for your portfolio:

- Swap the canned-response fallback for a smaller local model if you want zero API cost.
- Add more emotion states (e.g. "excited", "confused") and expand the keyword lexicon,
  or replace it with a real sentiment analysis model.
- Persist per-user sessions with actual auth instead of a random session ID.
- Add voice input/output (Web Speech API) so you can talk to BMO out loud.
- Deploy: frontend to Vercel/Netlify, backend to Render/Railway, DB to MongoDB Atlas.
