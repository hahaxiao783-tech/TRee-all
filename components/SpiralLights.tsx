import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  currentProgress: React.MutableRefObject<number>;
}

export const SpiralLights: React.FC<Props> = ({ currentProgress }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const curve = useMemo(() => {
    class SpiralCurve extends THREE.Curve<THREE.Vector3> {
      scale: number;
      constructor(scale = 1) {
        super();
        this.scale = scale;
      }
      getPoint(t: number, optionalTarget = new THREE.Vector3()) {
        const turns = 6; 
        const angle = t * Math.PI * 2 * turns;
        const height = 13; 
        const y = (t - 0.5) * height; // Bottom to top
        
        // Radius matches the tree cone approximation
        // Bottom (t=0) wider, Top (t=1) narrower
        const radius = (1 - t) * 5.0 + 0.5; 

        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        return optionalTarget.set(x, y, z).multiplyScalar(this.scale);
      }
    }
    return new SpiralCurve(1);
  }, []);

  const geometry = useMemo(() => {
    // Tube: Path, segments, radius (thickness), radialSegments, closed
    return new THREE.TubeGeometry(curve, 256, 0.03, 8, false);
  }, [curve]);

  useFrame((state) => {
    if (meshRef.current) {
      const progress = currentProgress.current;
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      
      // Visibility Logic:
      // Visible when formed (progress ~ 1)
      // Invisible when chaos (progress ~ 0)
      const visibility = Math.pow(progress, 3.0); 
      
      mat.opacity = visibility;
      mat.visible = visibility > 0.01;

      // Dynamic Animation:
      // When exploding (progress < 1), expand the coil outwards slightly
      const expansion = THREE.MathUtils.lerp(1.5, 1.0, progress);
      meshRef.current.scale.setScalar(expansion);

      // Continuous Rotation
      meshRef.current.rotation.y = -state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial 
        color="#F3E5AB" // Champagne / Pale Gold (Low saturation)
        emissive="#F3E5AB"
        emissiveIntensity={1.0} // Gentle glow
        roughness={0.3}
        metalness={0.8}
        transparent={true}
        depthWrite={false} 
      />
    </mesh>
  );
};