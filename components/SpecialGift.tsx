import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
  currentProgress: React.MutableRefObject<number>;
  onClick: () => void;
}

export const SpecialGift: React.FC<Props> = ({ currentProgress, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Define positions
  const { targetPos, chaosPos, rotation } = useMemo(() => {
    // Specific spot on the tree 
    const tPos = new THREE.Vector3(2.0, -2.5, 3.2); 
    const cPos = new THREE.Vector3(
       (Math.random() - 0.5) * 40,
       (Math.random() - 0.5) * 40, 
       (Math.random() - 0.5) * 40
    );
    return { targetPos: tPos, chaosPos: cPos, rotation: new THREE.Euler(0, Math.PI/4, 0) };
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const p = currentProgress.current;
    
    // Lerp Position
    meshRef.current.position.lerpVectors(chaosPos, targetPos, p);
    
    // Bobbing animation
    const bob = Math.sin(state.clock.elapsedTime * 3) * 0.05 * p;
    meshRef.current.position.y += bob;

    meshRef.current.rotation.x = THREE.MathUtils.lerp(rotation.x + state.clock.elapsedTime, rotation.x, p);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(rotation.y + state.clock.elapsedTime, rotation.y + (hovered ? state.clock.elapsedTime * 2 : 0), p);
    meshRef.current.rotation.z = THREE.MathUtils.lerp(rotation.z + state.clock.elapsedTime, rotation.z, p);
    
    // Scale - Shrink to 0 in Chaos
    const scale = p * (hovered ? 1.1 : 1.0); 
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <group>
      <mesh 
        ref={meshRef} 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
        onPointerOut={() => { document.body.style.cursor = 'default'; setHovered(false); }}
      >
        {/* Smaller box: 0.8 */}
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial 
          color="#00008B" // Deep Blue
          emissive="#000066"
          emissiveIntensity={hovered ? 2 : 0.5}
          roughness={0.1}
          metalness={1.0}
        />
      </mesh>
    </group>
  );
};