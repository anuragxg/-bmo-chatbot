import gsap from "gsap";

/**
 * Each function builds and plays a GSAP timeline against the character's refs.
 * All of them call opts.onStart()/opts.onDone() so the caller can flag
 * "a gesture is playing" (to pause idle motion) and set a face expression
 * override for the duration.
 *
 * refs: { group, head, leftArm, rightArm, leftLeg, rightLeg }
 */

function withLifecycle(tl, { onStart, onDone, expression } = {}) {
  if (onStart) onStart(expression);
  tl.eventCallback("onComplete", () => onDone && onDone());
  return tl;
}

export function playWave(refs, opts) {
  const tl = gsap.timeline();
  tl.to(refs.rightArm.rotation, { z: -1.9, duration: 0.25, ease: "power2.out" })
    .to(refs.rightArm.rotation, { x: 0.4, duration: 0.2, ease: "sine.inOut" }, "<")
    .to(refs.rightArm.rotation, { x: -0.1, duration: 0.18, ease: "sine.inOut", repeat: 3, yoyo: true })
    .to(refs.rightArm.rotation, { z: -0.3, x: 0, duration: 0.3, ease: "power2.inOut" });
  return withLifecycle(tl, { ...opts, expression: "happy" });
}

export function playJump(refs, opts) {
  const tl = gsap.timeline();
  tl.to(refs.group.position, { y: "+=0.7", duration: 0.22, ease: "power2.out" })
    .to(refs.group.scale, { x: 1.08, y: 0.92, duration: 0.22, ease: "power2.out" }, "<")
    .to(refs.group.position, { y: "-=0.7", duration: 0.28, ease: "bounce.out" })
    .to(refs.group.scale, { x: 1, y: 1, duration: 0.2, ease: "power2.out" }, "<");
  return withLifecycle(tl, { ...opts, expression: "excited" });
}

export function playExcitedJump(refs, opts) {
  const tl = gsap.timeline();
  for (let i = 0; i < 2; i++) {
    tl.to(refs.group.position, { y: "+=0.85", duration: 0.2, ease: "power2.out" })
      .to(refs.group.position, { y: "-=0.85", duration: 0.24, ease: "bounce.out" });
  }
  return withLifecycle(tl, { ...opts, expression: "excited" });
}

export function playSmile(refs, opts) {
  const tl = gsap.timeline();
  tl.to(refs.group.scale, { x: 1.04, y: 1.04, duration: 0.25, ease: "back.out(2)" })
    .to(refs.group.scale, { x: 1, y: 1, duration: 0.35, ease: "power2.inOut" });
  return withLifecycle(tl, { ...opts, expression: "happy" });
}

export function playRotate(refs, opts) {
  const tl = gsap.timeline();
  tl.to(refs.group.rotation, { y: 0.5, duration: 0.35, ease: "power2.inOut" })
    .to(refs.group.rotation, { y: -0.5, duration: 0.5, ease: "power2.inOut" })
    .to(refs.group.rotation, { y: 0, duration: 0.35, ease: "power2.inOut" });
  return withLifecycle(tl, opts);
}

export function playRaiseHand(refs, opts) {
  const tl = gsap.timeline();
  tl.to(refs.leftArm.rotation, { z: 2.4, duration: 0.3, ease: "power2.out" })
    .to(refs.leftArm.rotation, { z: 2.4 + 0.15, duration: 0.3, ease: "sine.inOut", repeat: 1, yoyo: true })
    .to(refs.leftArm.rotation, { z: 0.3, duration: 0.35, ease: "power2.inOut" });
  return withLifecycle(tl, { ...opts, expression: "curious" });
}

export function playNod(refs, opts) {
  const tl = gsap.timeline();
  tl.to(refs.head.rotation, { x: 0.28, duration: 0.18, ease: "power1.inOut", repeat: 3, yoyo: true })
    .to(refs.head.rotation, { x: 0, duration: 0.2, ease: "power1.out" });
  return withLifecycle(tl, opts);
}

export function playBounce(refs, opts) {
  const tl = gsap.timeline();
  tl.to(refs.group.position, { y: "+=0.3", duration: 0.18, ease: "sine.inOut", repeat: 3, yoyo: true });
  return withLifecycle(tl, { ...opts, expression: "happy" });
}

export function playSpin(refs, opts) {
  const tl = gsap.timeline();
  tl.to(refs.group.rotation, { y: `+=${Math.PI * 2}`, duration: 0.8, ease: "power2.inOut" });
  return withLifecycle(tl, { ...opts, expression: "excited" });
}

export function playDance(refs, opts) {
  const tl = gsap.timeline();
  const cycles = 5;
  for (let i = 0; i < cycles; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    tl.to(refs.group.rotation, { z: 0.18 * dir, duration: 0.22, ease: "sine.inOut" }, i * 0.22)
      .to(refs.leftArm.rotation, { z: 0.6 + 0.4 * dir, duration: 0.22, ease: "sine.inOut" }, i * 0.22)
      .to(refs.rightArm.rotation, { z: -0.6 - 0.4 * dir, duration: 0.22, ease: "sine.inOut" }, i * 0.22)
      .to(refs.group.position, { y: "+=0.15", duration: 0.11, ease: "sine.out", yoyo: true, repeat: 1 }, i * 0.22);
  }
  tl.to([refs.group.rotation], { z: 0, duration: 0.3, ease: "power2.out" })
    .to(refs.leftArm.rotation, { z: 0.3, duration: 0.3, ease: "power2.out" }, "<")
    .to(refs.rightArm.rotation, { z: -0.3, duration: 0.3, ease: "power2.out" }, "<");
  return withLifecycle(tl, { ...opts, expression: "excited" });
}

export function playWiggleHands(refs, opts) {
  const tl = gsap.timeline();
  tl.to(refs.leftArm.rotation, { z: "+=0.35", duration: 0.12, ease: "sine.inOut", repeat: 7, yoyo: true })
    .to(refs.rightArm.rotation, { z: "-=0.35", duration: 0.12, ease: "sine.inOut", repeat: 7, yoyo: true }, "<");
  return withLifecycle(tl, { ...opts, expression: "happy" });
}

export function playWiggleLegs(refs, opts) {
  const tl = gsap.timeline();
  tl.to(refs.leftLeg.rotation, { z: 0.25, duration: 0.12, ease: "sine.inOut", repeat: 7, yoyo: true })
    .to(refs.rightLeg.rotation, { z: -0.25, duration: 0.12, ease: "sine.inOut", repeat: 7, yoyo: true }, "<");
  return withLifecycle(tl, opts);
}

/**
 * The triple-click "lose balance and fall" sequence - the showpiece gag.
 * Falls to one side, legs kick, dizzy face, holds, then self-corrects back up.
 */
export function playBlink(refs, opts) {
  const tl = gsap.timeline();
  // The face texture handles the actual blink shape; this just holds a beat
  // so the caller's blink trigger + expression read stays in sync visually.
  tl.call(() => opts.onBlink && opts.onBlink())
    .to({}, { duration: 0.4 });
  return withLifecycle(tl, opts);
}

export function playFall(refs, opts) {
  const tl = gsap.timeline();
  const fallDir = Math.random() > 0.5 ? 1 : -1;

  tl.to(refs.group.rotation, { z: 0.15 * fallDir, duration: 0.15, ease: "power1.in" })
    .to(refs.group.rotation, { z: 1.35 * fallDir, duration: 0.35, ease: "power3.in" })
    .to(refs.group.position, { y: "-=0.55", duration: 0.35, ease: "power2.in" }, "<")
    .to(refs.leftLeg.rotation, { x: 0.5, duration: 0.1, ease: "sine.inOut", repeat: 5, yoyo: true })
    .to(refs.rightLeg.rotation, { x: -0.5, duration: 0.1, ease: "sine.inOut", repeat: 5, yoyo: true }, "<")
    .to({}, { duration: 0.9 }) // stay fallen, dizzy
    .to(refs.group.rotation, { z: 0, duration: 0.5, ease: "back.out(1.4)" })
    .to(refs.group.position, { y: "+=0.55", duration: 0.5, ease: "back.out(1.4)" }, "<")
    .to(refs.leftLeg.rotation, { x: 0, duration: 0.2 }, "<")
    .to(refs.rightLeg.rotation, { x: 0, duration: 0.2 }, "<");

  return withLifecycle(tl, { ...opts, expression: "dizzy" });
}

export function playClap(refs, opts) {
  const tl = gsap.timeline();
  tl.to(refs.leftArm.rotation, { z: 0.9, x: 0.3, duration: 0.18, ease: "power2.out" })
    .to(refs.rightArm.rotation, { z: -0.9, x: 0.3, duration: 0.18, ease: "power2.out" }, "<")
    .to(refs.leftArm.rotation, { z: 0.7, duration: 0.12, ease: "sine.inOut", repeat: 5, yoyo: true })
    .to(refs.rightArm.rotation, { z: -0.7, duration: 0.12, ease: "sine.inOut", repeat: 5, yoyo: true }, "<")
    .to(refs.leftArm.rotation, { z: 0.3, x: 0, duration: 0.3, ease: "power2.inOut" })
    .to(refs.rightArm.rotation, { z: -0.3, x: 0, duration: 0.3, ease: "power2.inOut" }, "<");
  return withLifecycle(tl, { ...opts, expression: "happy" });
}

export const SINGLE_CLICK_ANIMS = [
  playJump, playWave, playBlink, playSmile, playRotate, playRaiseHand, playNod, playBounce,
];
export const DOUBLE_CLICK_ANIMS = [
  playExcitedJump, playSpin, playDance, playWiggleHands, playWiggleLegs,
];
export const CELEBRATE_ANIMS = [playJump, playBounce, playWave, playSmile, playExcitedJump, playClap];

// ---- Idle micro-animations - small, subtle, non-disruptive ----
// These run underneath continuous breathing/sway without needing to pause it.

export function idleHeadTilt(refs) {
  const dir = Math.random() > 0.5 ? 1 : -1;
  gsap
    .timeline()
    .to(refs.head.rotation, { z: 0.12 * dir, duration: 0.6, ease: "sine.inOut" })
    .to(refs.head.rotation, { z: 0, duration: 0.7, ease: "sine.inOut" });
}

export function idleLookAway(refs, onLook) {
  const x = (Math.random() - 0.5) * 1.6;
  onLook(x);
  gsap.delayedCall(1.1, () => onLook(0));
}

export function idleHandTwitch(refs) {
  const arm = Math.random() > 0.5 ? refs.leftArm : refs.rightArm;
  const dir = arm === refs.leftArm ? 1 : -1;
  gsap
    .timeline()
    .to(arm.rotation, { z: `+=${0.2 * dir}`, duration: 0.2, ease: "sine.inOut" })
    .to(arm.rotation, { z: `-=${0.2 * dir}`, duration: 0.3, ease: "sine.inOut" });
}

export function idleLegShift(refs) {
  const leg = Math.random() > 0.5 ? refs.leftLeg : refs.rightLeg;
  gsap
    .timeline()
    .to(leg.rotation, { x: 0.08, duration: 0.3, ease: "sine.inOut" })
    .to(leg.rotation, { x: 0, duration: 0.4, ease: "sine.inOut" });
}

export function idleHappyBounce(refs) {
  gsap
    .timeline()
    .to(refs.group.position, { y: "+=0.18", duration: 0.2, ease: "sine.out" })
    .to(refs.group.position, { y: "-=0.18", duration: 0.25, ease: "bounce.out" });
}

export const IDLE_MICRO_ANIMS = ["headTilt", "lookAway", "handTwitch", "legShift", "happyBounce", "blink"];
