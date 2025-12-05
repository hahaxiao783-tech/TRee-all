import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';

interface StarProps {
  currentProgress: React.MutableRefObject<number>;
}

export const Star: React.FC<StarProps> = ({ currentProgress }) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const progress = currentProgress.current;
      const time = state.clock.elapsedTime;
      
      // Position: Float wildly in chaos, sit on top in formed
      // Tree top is approx y = 6
      const targetY = 6.2;
      const chaosY = 6.2 + Math.sin(time) * 5;
      const chaosX = Math.cos(time * 0.5) * 5;
      
      meshRef.current.position.y = THREE.MathUtils.lerp(chaosY, targetY, progress);
      meshRef.current.position.x = THREE.MathUtils.lerp(chaosX, 0, progress);
      meshRef.current.position.z = THREE.MathUtils.lerp(Math.sin(time) * 5, 0, progress);

      // Rotation
      meshRef.current.rotation.y = time * 0.5;
      meshRef.current.rotation.z = Math.sin(time * 2) * 0.1;

      // Scale pulse
      const scale = (1 + Math.sin(time * 3) * 0.1) * progress; // Disappear in chaos (scale 0)
      meshRef.current.scale.setScalar(Math.max(0.1, scale)); // Keep it visible but small in chaos? Or just scale 0
    }
  });

  return (
    <group ref={meshRef}>
      {/* Core Star */}
      <mesh>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial 
          color="#FFFDD0" 
          emissive="#FFFDD0" 
          emissiveIntensity={4} 
          toneMapped={false}
        />
      </mesh>
      
      {/* Outer Glow Halo */}
      <mesh scale={[1.5, 1.5, 1.5]}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshBasicMaterial 
          color="#FFD700" 
          transparent 
          opacity={0.3} 
          wireframe
        />
      </mesh>

      <pointLight distance={10} intensity={2} color="#FFFDD0" />
    </group>
  );
};