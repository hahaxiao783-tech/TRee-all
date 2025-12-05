import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Snow: React.FC = () => {
  const meshRef = useRef<THREE.Points>(null);
  const count = 8000; // Increased density from 3000

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count); 
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;     // Wider spread
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60; 
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40; 
      vel[i] = Math.random() * 0.08 + 0.02; // Varied speed
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      // Move down
      positions[i * 3 + 1] -= velocities[i];
      
      // Horizontal drift (wind)
      positions[i * 3] += Math.sin(state.clock.elapsedTime + i * 0.1) * 0.005;

      // Reset if below bottom
      if (positions[i * 3 + 1] < -30) {
        positions[i * 3 + 1] = 30;
        positions[i * 3] = (Math.random() - 0.5) * 60; 
      }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.12} 
        color="#ffffff" 
        transparent 
        opacity={0.7} 
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};