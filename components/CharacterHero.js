"use client";

import React, { useMemo, useRef } from "react";
import { useGraph, useFrame } from "@react-three/fiber";
import { useGLTF, Float, Center, MeshTransmissionMaterial } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";

export default function CharacterHero() {
  const groupRef = useRef();

  // 1. Load the model
  const { scene } = useGLTF("/character.glb");
  // 2. Clone the scene (Standard practice for GLB models to avoid mutation issues)
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  // 3. Extract nodes (the geometry parts)
  const { nodes } = useGraph(clone);

  // Animation: Gentle Float
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <Center>
        <group ref={groupRef} dispose={null}>
          {/* --- HIERARCHY FIXES (From your generated code) --- */}
          <group scale={0.01}>
            <group rotation={[-Math.PI / 2, 0, 0]} scale={100}>
              {/* The Skeleton Root (Necessary for structure) */}
              <primitive object={nodes._rootJoint} />

              {/* The Mesh Container */}
              <group rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
                {/* 
                   SMART RENDERER:
                   Instead of listing "mesh_0", "mesh_1" etc manually,
                   we loop through all nodes and render the ones that are meshes.
                */}
                {Object.values(nodes).map((node, i) => {
                  // Only render if it's a mesh (and not the root bone or a camera)
                  // We also check if it has geometry to be safe
                  if (!node.isMesh || !node.geometry) return null;

                  return (
                    <mesh key={i} geometry={node.geometry}>
                      {/* LIQUID GLASS MATERIAL APPLIED TO EVERYTHING */}
                      <MeshTransmissionMaterial backside={false} thickness={0.8} roughness={0.05} transmission={1} ior={1.2} chromaticAberration={0.2} anisotropy={0} distortion={1.0} distortionScale={0.4} temporalDistortion={0.1} color="#e0ffff" attenuationDistance={0.5} attenuationColor="#ffffff" />
                    </mesh>
                  );
                })}
              </group>
            </group>
          </group>
        </group>
      </Center>
    </Float>
  );
}

// Preload for performance
useGLTF.preload("/character.glb");
