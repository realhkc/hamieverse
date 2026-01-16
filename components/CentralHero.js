"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, Center } from "@react-three/drei";

export default function CentralHero() {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating sway
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      meshRef.current.rotation.y = Math.cos(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <Center>
        {/* Replaced Text3D with a simple Box Geometry */}
        <mesh ref={meshRef}>
          {/* args: [width, height, depth] - A rectangular prism shape */}
          <boxGeometry args={[2, 3, 0.4]} />

          {/* EXACT SAME LIQUID GLASS SETTINGS */}
          <MeshTransmissionMaterial backside={true} thickness={0.1} roughness={0.05} transmission={0.95} ior={1.2} chromaticAberration={0.6} anisotropy={0} distortion={1.0} distortionScale={0.4} temporalDistortion={0.1} color="#a200ff" attenuationDistance={0.5} attenuationColor="#ffffff" />
        </mesh>
      </Center>
    </Float>
  );
}
