import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows, Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import BMOCharacter from "./BMOCharacter.jsx";

function CameraParallax() {
  const { camera } = useThree();
  const base = useRef(new THREE.Vector3(0, 0, 6.2));

  useFrame((state) => {
    const p = state.pointer;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, base.current.x + p.x * 0.35, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, base.current.y + p.y * 0.2, 0.04);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function BMOScene({ emotion, isThinking, chatSentSignal, chatReceivedSignal }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.2], fov: 40 }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1} />
      <directionalLight position={[-3, -1, 3]} intensity={0.25} color="#cdebff" />
      <Environment preset="studio" environmentIntensity={0.5} />

      <BMOCharacter
        emotion={emotion}
        isThinking={isThinking}
        chatSentSignal={chatSentSignal}
        chatReceivedSignal={chatReceivedSignal}
      />

      <ContactShadows position={[0, -2.05, 0]} opacity={0.35} scale={6} blur={2.4} far={3} />
      <Sparkles count={35} scale={[6, 5, 3]} size={2.5} speed={0.25} color="#eafff2" opacity={0.5} />

      <CameraParallax />

      <EffectComposer>
        <Bloom intensity={0.35} luminanceThreshold={0.6} luminanceSmoothing={0.2} mipmapBlur />
        <Vignette eskil={false} offset={0.25} darkness={0.6} />
      </EffectComposer>
    </Canvas>
  );
}
