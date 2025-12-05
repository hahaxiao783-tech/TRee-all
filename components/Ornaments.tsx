import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface OrnamentsProps {
  count: number;
  type: 'gift' | 'ball' | 'light';
  color: string;
  currentProgress: React.MutableRefObject<number>;
}

export const Ornaments: React.FC<OrnamentsProps> = ({ count, type, color, currentProgress }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Precompute positions
  const { targetData, chaosData } = useMemo(() => {
    const targets = [];
    const chaos = [];

    const height = 11; // Slightly smaller than foliage
    const baseRadius = 3.8;

    for (let i = 0; i < count; i++) {
      // Target: Cone surface with more noise for "scattered" look
      const h = Math.random() * height;
      const y = h - (height / 2);
      const r = (1 - (h / height)) * baseRadius; // Linear taper
      
      const theta = Math.random() * Math.PI * 2;
      
      // Depth variation: Not all exactly on the surface
      const depthNoise = (Math.random() - 0.5) * 0.5; // +/- 0.25 depth
      const offset = (type === 'gift' ? 0.7 : 0.9) + depthNoise; 
      const dist = r * offset;

      const tx = dist * Math.cos(theta);
      const tz = dist * Math.sin(theta);
      
      // Enhanced Size Randomization
      let scale = 1;
      if (type === 'gift') {
         // Gifts: 0.3 to 0.8
         scale = 0.3 + Math.random() * 0.5;
      }
      if (type === 'ball') {
         // Balls: 0.15 to 0.5 (More variance)
         scale = 0.15 + Math.random() * 0.35;
      }
      if (type === 'light') {
         // Lights: Small variance
         scale = 0.05 + Math.random() * 0.05;
      }

      targets.push({ x: tx, y, z: tz, scale, rotX: Math.random() * Math.PI, rotY: Math.random() * Math.PI });

      // Chaos: Random explosion
      chaos.push({
        x: (Math.random() - 0.5) * 35, // Wider explosion
        y: (Math.random() - 0.5) * 35,
        z: (Math.random() - 0.5) * 35,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2
      });
    }
    return { targetData: targets, chaosData: chaos };
  }, [count, type]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const progress = currentProgress.current;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const t = targetData[i];
      const c = chaosData[i];

      // Lerp position
      const x = THREE.MathUtils.lerp(c.x, t.x, progress);
      const y = THREE.MathUtils.lerp(c.y, t.y, progress);
      const z = THREE.MathUtils.lerp(c.z, t.z, progress);

      // Lerp Rotation
      // During Chaos, rotate slowly
      const chaosRotX = c.rotX + time * 0.2;
      const chaosRotY = c.rotY + time * 0.1;

      // During formed, stabilize
      const targetRotX = 0; 
      const targetRotY = t.rotY; 

      const rotX = THREE.MathUtils.lerp(chaosRotX, targetRotX, progress);
      const rotY = THREE.MathUtils.lerp(chaosRotY, targetRotY, progress);
      const rotZ = THREE.MathUtils.lerp(c.rotX, 0, progress);

      dummy.position.set(x, y, z);
      dummy.rotation.set(rotX, rotY, rotZ);
      
      // Scale effect: Shrink in chaos, grow in formed
      const scaleFactor = t.scale * (progress * 0.4 + 0.6);
      dummy.scale.setScalar(scaleFactor);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      {type === 'gift' && <boxGeometry args={[1, 1, 1]} />}
      {type === 'ball' && <sphereGeometry args={[1, 32, 32]} />}
      {type === 'light' && <sphereGeometry args={[1, 8, 8]} />}
      
      <meshStandardMaterial
        color={color}
        roughness={type === 'light' ? 0.1 : 0.2}
        metalness={type === 'light' ? 0 : 0.8}
        emissive={type === 'light' ? color : '#000000'}
        emissiveIntensity={type === 'light' ? 2 : 0}
      />
    </instancedMesh>
  );
};