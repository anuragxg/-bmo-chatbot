import { useRef, useState, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import {
  SINGLE_CLICK_ANIMS,
  DOUBLE_CLICK_ANIMS,
  CELEBRATE_ANIMS,
  playFall,
  playNod,
  idleHeadTilt,
  idleLookAway,
  idleHandTwitch,
  idleLegShift,
  idleHappyBounce,
} from "../utils/bmoAnimations.js";
import { soundEngine } from "../utils/soundEngine.js";

const MODEL_URL = "/models/bmo.glb";
const COLORS = { screenBg: "#101d18", dotOn: "#eafff2" };

const FACE_RES = 42;
const FACE_OUT = 480;

function useFaceTexture() {
  const smallCanvas = useRef(document.createElement("canvas"));
  const bigCanvas = useRef(document.createElement("canvas"));
  const textureRef = useRef(null);

  if (!textureRef.current) {
    smallCanvas.current.width = FACE_RES;
    smallCanvas.current.height = FACE_RES;
    bigCanvas.current.width = FACE_OUT;
    bigCanvas.current.height = FACE_OUT;
    textureRef.current = new THREE.CanvasTexture(bigCanvas.current);
    textureRef.current.colorSpace = THREE.SRGBColorSpace;
    textureRef.current.magFilter = THREE.NearestFilter;
  }

  const draw = (emotion, pupilX, pupilY, blink) => {
    const ctx = smallCanvas.current.getContext("2d");
    const W = FACE_RES, H = FACE_RES;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = COLORS.screenBg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = COLORS.dotOn;

    const eyeY = W * 0.4;
    const spacing = W * 0.24;
    const leftX = W / 2 - spacing;
    const rightX = W / 2 + spacing;
    const squint = Math.max(0.08, 1 - blink);

    const circle = (x, y, r) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };
    const ring = (x, y, r, lw) => {
      ctx.lineWidth = lw;
      ctx.strokeStyle = COLORS.dotOn;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    };

    if (emotion === "happy" || emotion === "excited") {
      const r = emotion === "excited" ? W * 0.09 : W * 0.075;
      [leftX, rightX].forEach((x) => {
        ctx.lineWidth = W * 0.045;
        ctx.strokeStyle = COLORS.dotOn;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(x, eyeY + r * 0.6, r, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      });
    } else if (emotion === "sad") {
      [leftX, rightX].forEach((x) => {
        ring(x, eyeY, W * 0.09, W * 0.02);
        circle(x + pupilX * (W * 0.03), eyeY + (W * 0.02) + pupilY * (W * 0.02), W * 0.045 * squint);
      });
    } else if (emotion === "sleepy") {
      [leftX, rightX].forEach((x) => {
        ctx.lineWidth = W * 0.04;
        ctx.strokeStyle = COLORS.dotOn;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - W * 0.09, eyeY);
        ctx.lineTo(x + W * 0.09, eyeY);
        ctx.stroke();
      });
    } else if (emotion === "surprised") {
      [leftX, rightX].forEach((x) => circle(x, eyeY, W * 0.1 * squint));
    } else if (emotion === "dizzy") {
      [leftX, rightX].forEach((x) => {
        ctx.lineWidth = W * 0.035;
        ctx.strokeStyle = COLORS.dotOn;
        ctx.lineCap = "round";
        const r = W * 0.07;
        ctx.beginPath();
        ctx.moveTo(x - r, eyeY - r);
        ctx.lineTo(x + r, eyeY + r);
        ctx.moveTo(x + r, eyeY - r);
        ctx.lineTo(x - r, eyeY + r);
        ctx.stroke();
      });
    } else if (emotion === "confused") {
      ring(leftX, eyeY, W * 0.09, W * 0.02);
      circle(leftX + pupilX * (W * 0.03), eyeY + pupilY * (W * 0.02), W * 0.045 * squint);
      ring(rightX, eyeY - W * 0.02, W * 0.07, W * 0.02);
      circle(rightX + pupilX * (W * 0.03), eyeY - W * 0.02 + pupilY * (W * 0.02), W * 0.04 * squint);
    } else {
      [leftX, rightX].forEach((x) => {
        ring(x, eyeY, W * 0.09, W * 0.02);
        circle(x + pupilX * (W * 0.03), eyeY + pupilY * (W * 0.02), W * 0.045 * squint);
      });
    }

    if (emotion === "curious" || emotion === "thinking") {
      ctx.strokeStyle = COLORS.dotOn;
      ctx.lineWidth = W * 0.035;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(leftX - W * 0.08, eyeY - W * 0.16);
      ctx.lineTo(leftX + W * 0.03, eyeY - W * 0.19);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rightX - W * 0.03, eyeY - W * 0.19);
      ctx.lineTo(rightX + W * 0.08, eyeY - W * 0.14);
      ctx.stroke();
    }

    const mouthY = W * 0.68;
    ctx.strokeStyle = COLORS.dotOn;
    ctx.fillStyle = COLORS.dotOn;
    ctx.lineWidth = W * 0.035;
    ctx.lineCap = "round";
    ctx.beginPath();

    switch (emotion) {
      case "happy":
        ctx.arc(W / 2, mouthY - W * 0.06, W * 0.14, Math.PI * 0.1, Math.PI * 0.9);
        ctx.stroke();
        break;
      case "excited":
        ctx.ellipse(W / 2, mouthY, W * 0.09, W * 0.11, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "sad":
        ctx.arc(W / 2, mouthY + W * 0.1, W * 0.12, Math.PI * 1.2, Math.PI * 1.8, true);
        ctx.stroke();
        break;
      case "surprised":
        ctx.ellipse(W / 2, mouthY, W * 0.06, W * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "sleepy":
        ctx.ellipse(W / 2, mouthY, W * 0.04, W * 0.025, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "dizzy":
        ctx.moveTo(W / 2 - W * 0.1, mouthY);
        ctx.quadraticCurveTo(W / 2 - W * 0.05, mouthY + W * 0.05, W / 2, mouthY);
        ctx.quadraticCurveTo(W / 2 + W * 0.05, mouthY - W * 0.05, W / 2 + W * 0.1, mouthY);
        ctx.stroke();
        break;
      case "confused":
        ctx.moveTo(W / 2 - W * 0.09, mouthY + W * 0.02);
        ctx.lineTo(W / 2, mouthY - W * 0.02);
        ctx.lineTo(W / 2 + W * 0.09, mouthY + W * 0.03);
        ctx.stroke();
        break;
      case "thinking":
        ctx.moveTo(W / 2 - W * 0.09, mouthY);
        ctx.quadraticCurveTo(W / 2 - W * 0.02, mouthY - W * 0.04, W / 2 + W * 0.04, mouthY);
        ctx.quadraticCurveTo(W / 2 + W * 0.09, mouthY + W * 0.02, W / 2 + W * 0.11, mouthY);
        ctx.stroke();
        break;
      case "curious":
        ctx.ellipse(W / 2, mouthY, W * 0.03, W * 0.04, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      default:
        ctx.moveTo(W / 2 - W * 0.1, mouthY);
        ctx.lineTo(W / 2 + W * 0.1, mouthY);
        ctx.stroke();
    }

    const bctx = bigCanvas.current.getContext("2d");
    bctx.imageSmoothingEnabled = false;
    bctx.clearRect(0, 0, FACE_OUT, FACE_OUT);
    bctx.drawImage(smallCanvas.current, 0, 0, W, H, 0, 0, FACE_OUT, FACE_OUT);

    bctx.globalAlpha = 0.06;
    bctx.strokeStyle = "#000000";
    bctx.lineWidth = 1;
    const cell = FACE_OUT / W;
    for (let i = 1; i < W; i++) {
      bctx.beginPath();
      bctx.moveTo(i * cell, 0);
      bctx.lineTo(i * cell, FACE_OUT);
      bctx.stroke();
      bctx.beginPath();
      bctx.moveTo(0, i * cell);
      bctx.lineTo(FACE_OUT, i * cell);
      bctx.stroke();
    }
    bctx.globalAlpha = 1;

    textureRef.current.needsUpdate = true;
  };

  return { texture: textureRef.current, draw };
}

function useScreenVideoTexture() {
  const textureRef = useRef(null);
  const videoRef = useRef(null);

  if (!textureRef.current) {
    const video = document.createElement("video");
    video.src = "/videos/bmo-display.mp4";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.play().catch(() => {
      // Autoplay can still be blocked in some browsers even when muted -
      // BMOCharacter retries this on the first click, see handleClick below.
    });
    videoRef.current = video;

    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;

    // The recording is widescreen (~16:9) but BMO's screen is roughly square -
    // center-crop horizontally instead of stretching the footage.
    const videoAspect = 2556 / 1426;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(1 / videoAspect, 1);
    tex.offset.set((1 - 1 / videoAspect) / 2, 0);

    textureRef.current = tex;
  }

  return { texture: textureRef.current, video: videoRef.current };
}

function idleHandTwitchGesture(refs, opts) {
  opts.onStart();
  idleHandTwitch(refs);
  setTimeout(opts.onDone, 500);
}
function idleLegShiftGesture(refs, opts) {
  opts.onStart();
  idleLegShift(refs);
  setTimeout(opts.onDone, 700);
}

export default function BMOCharacter({
  emotion = "neutral",
  isThinking = false,
  chatSentSignal = 0,
  chatReceivedSignal = 0,
}) {
  const groupRef = useRef();
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions } = useAnimations(animations, groupRef);
  const { texture: videoTexture, video } = useScreenVideoTexture();
  const { texture: faceTexture, draw } = useFaceTexture();
  const screenMeshRef = useRef(null);
  const showingFace = useRef(false);

  const bones = useRef({});
  const [hovered, setHovered] = useState(false);
  const gestureActive = useRef(false);
  const expressionOverride = useRef(null);
  const manualLookX = useRef(0);
  const manualLookY = useRef(0);

  const blinkState = useRef({ next: 2 + Math.random() * 3, t: 0, blinking: false });
  const idleState = useRef({ next: 4 + Math.random() * 4, t: 0 });
  const prevSent = useRef(chatSentSignal);
  const prevReceived = useRef(chatReceivedSignal);

  useEffect(() => {
    if (!scene) return;
    const found = {};
    scene.traverse((obj) => {
      found[obj.name] = obj;
    });
    bones.current = found;

    const screenMesh = found["BMO-Body_BMO-Screen_0"];
    if (screenMesh) {
      screenMesh.material = screenMesh.material.clone();
      screenMesh.material.map = videoTexture;
      screenMesh.material.emissiveMap = videoTexture;
      screenMesh.material.emissive = new THREE.Color("#ffffff");
      screenMesh.material.emissiveIntensity = 0.6;
      screenMesh.material.needsUpdate = true;
      screenMeshRef.current = screenMesh;
    }
  }, [scene, videoTexture]);

  useEffect(() => {
    const idle = actions?.Idle;
    if (idle) {
      idle.reset().fadeIn(0.3).play();
      idle.setLoop(THREE.LoopRepeat, Infinity);
    }
  }, [actions]);

  useEffect(() => {
    if (isThinking) soundEngine.playThinkingStart();
  }, [isThinking]);

  const getRefs = useCallback(() => {
    const b = bones.current;
    return {
      group: groupRef.current,
      head: b["BMO-Body_BMO-Screen_0"],
      leftArm: b["BMO-Rig-Arm-L1_08"],
      rightArm: b["BMO-Rig-Arm-R1_06"],
      leftLeg: b["BMO-Rig-Leg-L1_00"],
      rightLeg: b["BMO-Rig-Leg-R1_03"],
    };
  }, []);

  const runGesture = useCallback(
    (fn) => {
      const refs = getRefs();
      if (gestureActive.current || !refs.group || !refs.leftArm) return;
      fn(refs, {
        onStart: (expr) => {
          gestureActive.current = true;
          if (expr) expressionOverride.current = expr;
        },
        onDone: () => {
          gestureActive.current = false;
          expressionOverride.current = null;
        },
        onBlink: () => {
          blinkState.current.blinking = true;
          blinkState.current.t = 0;
        },
      });
    },
    [getRefs]
  );

  if (chatSentSignal !== prevSent.current) {
    prevSent.current = chatSentSignal;
    soundEngine.playMessageSent();
    manualLookX.current = 0.85;
    blinkState.current.blinking = true;
    blinkState.current.t = 0;
    runGesture((refs, opts) =>
      playNod(refs, {
        ...opts,
        onDone: () => {
          opts.onDone();
          manualLookX.current = 0;
        },
      })
    );
  }

  if (chatReceivedSignal !== prevReceived.current) {
    prevReceived.current = chatReceivedSignal;
    soundEngine.playReceiveChime();
    const anim = CELEBRATE_ANIMS[Math.floor(Math.random() * CELEBRATE_ANIMS.length)];
    runGesture(anim);
  }

  const clickCount = useRef(0);
  const clickTimer = useRef(null);
  const handleClick = useCallback(() => {
    if (video && video.paused) video.play().catch(() => {});
    clickCount.current += 1;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      const n = clickCount.current;
      clickCount.current = 0;
      if (gestureActive.current) return;
      if (n === 1) {
        soundEngine.playSingleClick();
        const anim = SINGLE_CLICK_ANIMS[Math.floor(Math.random() * SINGLE_CLICK_ANIMS.length)];
        runGesture(anim);
      } else if (n === 2) {
        soundEngine.playDoubleClick();
        const anim = DOUBLE_CLICK_ANIMS[Math.floor(Math.random() * DOUBLE_CLICK_ANIMS.length)];
        runGesture(anim);
      } else if (n >= 3) {
        soundEngine.playFallSequence();
        runGesture(playFall);
      }
    }, 300);
  }, [runGesture, video]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const pointer = state.pointer;
    if (!groupRef.current) return;

    if (actions?.Idle) {
      actions.Idle.paused = gestureActive.current || isThinking;
    }

    const targetScale = hovered && !gestureActive.current ? 1.06 : 1;
    if (!gestureActive.current) {
      groupRef.current.scale.set(
        THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.1),
        THREE.MathUtils.lerp(groupRef.current.scale.y, targetScale, 0.1),
        THREE.MathUtils.lerp(groupRef.current.scale.z, targetScale, 0.1)
      );
    }

    const refs = getRefs();

    const idle = idleState.current;
    idle.t += delta;
    if (idle.t > idle.next && !gestureActive.current && !isThinking) {
      idle.t = 0;
      idle.next = 4 + Math.random() * 4;
      const pick = Math.random();
      if (refs.head) {
        if (pick < 0.25) idleHeadTilt(refs);
        else if (pick < 0.5) idleLookAway(refs, (x) => (manualLookX.current = x));
        else if (pick < 0.65) runGesture(idleHandTwitchGesture);
        else if (pick < 0.8) runGesture(idleLegShiftGesture);
        else if (pick < 0.92) idleHappyBounce(refs);
        else {
          blinkState.current.blinking = true;
          blinkState.current.t = 0;
        }
      }
    }

    if (isThinking && !gestureActive.current && refs.head && refs.rightArm) {
      refs.head.rotation.x = THREE.MathUtils.lerp(refs.head.rotation.x, -0.12 + Math.sin(t * 3) * 0.04, 0.1);
      refs.rightArm.rotation.z = THREE.MathUtils.lerp(refs.rightArm.rotation.z, Math.sin(t * 6) * 0.08, 0.15);
    }

    const lookX = manualLookX.current !== 0 ? manualLookX.current : pointer.x;
    const lookY = manualLookX.current !== 0 ? manualLookY.current : -pointer.y;
    const targetPupilX = THREE.MathUtils.clamp(lookX, -1, 1);
    const targetPupilY = THREE.MathUtils.clamp(lookY, -1, 1);

    // (No longer rotating the screen mesh itself here - it caused the mesh to
    // pull away from flush contact with the body, exposing the interior. The
    // pupil offset drawn into the face texture already sells "looking at you".)

    const b = blinkState.current;
    b.t += delta;
    if (!b.blinking && b.t > b.next) {
      b.blinking = true;
      b.t = 0;
    }
    let blinkAmount = 0;
    if (b.blinking) {
      blinkAmount = b.t < 0.08 ? b.t / 0.08 : Math.max(0, 1 - (b.t - 0.08) / 0.08);
      if (b.t > 0.16) {
        b.blinking = false;
        b.next = 2 + Math.random() * 3;
        b.t = 0;
      }
    }

    const wantFace = gestureActive.current || isThinking;
    if (wantFace !== showingFace.current && screenMeshRef.current) {
      showingFace.current = wantFace;
      const mat = screenMeshRef.current.material;
      mat.map = wantFace ? faceTexture : videoTexture;
      mat.emissiveMap = wantFace ? faceTexture : videoTexture;
      mat.emissive.set(wantFace ? "#0c1a14" : "#ffffff");
      mat.emissiveIntensity = wantFace ? 1 : 0.6;
      mat.needsUpdate = true;
    }

    const effectiveEmotion = expressionOverride.current || (isThinking ? "thinking" : emotion);
    if (wantFace) draw(effectiveEmotion, targetPupilX, targetPupilY, blinkAmount);
  });

  return (
    <group
      ref={groupRef}
      position={[0, -1.9, 0]}
      rotation={[0, Math.PI, 0]}
      scale={0.13}
      onClick={handleClick}
      onPointerOver={() => {
        setHovered(true);
        soundEngine.playHover();
      }}
      onPointerOut={() => setHovered(false)}
    >
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
