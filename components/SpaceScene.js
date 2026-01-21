"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Stars, Sparkles, Lightformer, Float } from "@react-three/drei"; // Added Sparkles
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useRef, useMemo } from "react";
import * as THREE from "three";

// Imported Components
import CentralHero from "./CentralHero";
import CharacterHero from "./CharacterHero";
import InteractiveBackground from "./InteractiveBackground";

// --- FLOATING CRYSTALS (GLOWING) ---
function FloatingCrystals() {
  const crystals = useMemo(() => {
    return new Array(20).fill(0).map(() => ({
      position: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10 - 5],
      scale: Math.random() * 0.5 + 0.2,
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
    }));
  }, []);

  return (
    <group>
      {crystals.map((data, i) => (
        <Float key={i} speed={1} rotationIntensity={1} floatIntensity={1}>
          <mesh position={data.position} scale={data.scale} rotation={data.rotation}>
            <octahedronGeometry args={[1, 0]} />
            {/* 
               GLOW SETTINGS:
               1. emissive: The color of the glow
               2. emissiveIntensity: How bright (4 is very bright)
               3. toneMapped={false}: Allows colors to go beyond white (pure HDR)
            */}
            <meshStandardMaterial color="#00FFFF" emissive="#a020f0" emissiveIntensity={4} toneMapped={false} wireframe transparent opacity={0.5} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

// --- STARDUST TRAIL (UPDATED FOR GLOW) ---
const StarDustMaterial = {
  vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z); 
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
  fragmentShader: `
      varying vec3 vColor;
      void main() {
        float r = distance(gl_PointCoord, vec2(0.5));
        float shape = 1.0 - smoothstep(0.4, 0.5, r);
        if (shape < 0.1) discard;
        // Boost alpha for glow
        gl_FragColor = vec4(vColor, shape * 1.5); 
      }
    `,
};

function StardustTrail({ count = 1500 }) {
  const points = useRef();
  const lastPos = useRef(new THREE.Vector3(0, 0, 0));

  const particles = useMemo(() => {
    return new Array(count).fill().map(() => ({
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      life: 0,
      size: Math.random() < 0.1 ? 0.05 : 0.1,
    }));
  }, [count]);

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  useFrame(({ mouse, camera }) => {
    if (!points.current) return;

    // Raycasting for accurate mouse position
    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));
    const currentPos = new THREE.Vector3(pos.x, pos.y, 0);

    const dist = currentPos.distanceTo(lastPos.current);
    let spawnBudget = Math.floor(dist * 100);
    lastPos.current.copy(currentPos);

    particles.forEach((p, i) => {
      if (p.life > 0) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.008;
      } else if (spawnBudget > 0) {
        p.x = pos.x + (Math.random() - 0.5) * 0.05;
        p.y = pos.y + (Math.random() - 0.5) * 0.05;
        p.z = 0;

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.005;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.life = 1.0;
        spawnBudget--;
      }
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;

      // BOOST PARTICLE COLORS FOR GLOW (Value > 1.0)
      const boost = 2.0;
      colors[i * 3] = p.life * boost;
      colors[i * 3 + 1] = p.life * boost;
      colors[i * 3 + 2] = p.life * boost;

      sizes[i] = p.size;
    });
    points.current.geometry.attributes.position.needsUpdate = true;
    points.current.geometry.attributes.color.needsUpdate = true;
    points.current.geometry.attributes.size.needsUpdate = true;
  });

  return (
    <points ref={points} key={count}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial vertexShader={StarDustMaterial.vertexShader} fragmentShader={StarDustMaterial.fragmentShader} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

// --- CAMERA RIG ---
function CameraRig() {
  useFrame((state) => {
    const x = state.mouse.x;
    const y = state.mouse.y;
    const sensitivityX = 2;
    const sensitivityY = 1;
    state.camera.position.x += (x * sensitivityX - state.camera.position.x) * 0.05;
    state.camera.position.y += (y * sensitivityY - state.camera.position.y) * 0.05;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function SpaceScene() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 35, near: 0.1, far: 200 }} dpr={[1, 2]}>
        <Environment resolution={512}>
          <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[10, 2, 1]} />
          <Lightformer intensity={2} rotation-y={-Math.PI / 2} position={[5, 1, -1]} scale={[10, 2, 1]} />
          <Lightformer intensity={2} rotation-x={-Math.PI / 2} position={[0, -5, 0]} scale={[10, 2, 1]} />
        </Environment>

        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#00f5d4" />

        <CameraRig />
        <InteractiveBackground />

        {/* REPLACED STARS WITH SPARKLES FOR BETTER GLOW */}
        <Sparkles count={500} scale={12} size={4} speed={0.4} opacity={0.5} color="#00f5d4" />
        <Stars radius={50} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

        <FloatingCrystals />

        <CharacterHero />

        <StardustTrail count={2000} />

        <EffectComposer disableNormalPass>
          {/* 
             BLOOM SETTINGS:
             luminanceThreshold={1.1} -> Ignores the character (who is 1.0)
             mipmapBlur -> Makes the glow softer and larger
          */}
          <Bloom luminanceThreshold={1.1} mipmapBlur intensity={1.5} radius={0.5} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
