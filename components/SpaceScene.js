"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Stars, Lightformer, Float } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useRef, useMemo } from "react";
import * as THREE from "three";

// Imported Components
import CentralHero from "./CentralHero";
import InteractiveBackground from "./InteractiveBackground";

// --- FLOATING CRYSTALS ---
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
            <meshStandardMaterial color="#d400ff" emissive="#ff00ff" emissiveIntensity={0.8} wireframe transparent opacity={0.3} />{" "}
          </mesh>
        </Float>
      ))}
    </group>
  );
}

// --- STARDUST TRAIL ---
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
        gl_FragColor = vec4(vColor, shape);
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

  useFrame(({ mouse, viewport }) => {
    if (!points.current) return;
    const targetX = (mouse.x * viewport.width) / 2;
    const targetY = (mouse.y * viewport.height) / 2;
    const currentPos = new THREE.Vector3(targetX, targetY, 2);
    const dist = currentPos.distanceTo(lastPos.current);
    let spawnBudget = Math.floor(dist * 100);
    lastPos.current.copy(currentPos);

    particles.forEach((p, i) => {
      if (p.life > 0) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.008;
      } else if (spawnBudget > 0) {
        p.x = targetX + (Math.random() - 0.5) * 0.05;
        p.y = targetY + (Math.random() - 0.5) * 0.05;
        p.z = 2;

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
      colors[i * 3] = p.life;
      colors[i * 3 + 1] = p.life;
      colors[i * 3 + 2] = p.life;
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

// --- UPDATED CAMERA RIG ---
function CameraRig() {
  useFrame((state) => {
    const x = state.mouse.x;
    const y = state.mouse.y;

    // INCREASED MULTIPLIERS FOR PROMINENT 3D EFFECT
    // X * 5: Moves camera 5 units left/right (revealing side of cube)
    // Y * 3: Moves camera 3 units up/down (revealing top/bottom)
    const sensitivityX = 5;
    const sensitivityY = 5;

    state.camera.position.x += (x * sensitivityX - state.camera.position.x) * 0.05;
    state.camera.position.y += (y * sensitivityY - state.camera.position.y) * 0.05;

    // Ensure camera always focuses on the center object
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function SpaceScene() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 35, near: 0.1, far: 200 }} dpr={[1, 2]}>
        <Environment resolution={512}>
          <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[10, 2, 1]} />
          <Lightformer intensity={2} rotation-y={-Math.PI / 2} position={[5, 1, -1]} scale={[10, 2, 1]} />
          <Lightformer intensity={2} rotation-x={-Math.PI / 2} position={[0, -5, 0]} scale={[10, 2, 1]} />
        </Environment>

        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#f9ff55" />

        <CameraRig />

        <InteractiveBackground />

        <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        <FloatingCrystals />
        <CentralHero />
        <StardustTrail count={2000} />

        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.0} radius={0.5} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
