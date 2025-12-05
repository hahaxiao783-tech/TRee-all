import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const foliageVertexShader = `
  uniform float uTime;
  uniform float uProgress; 
  
  attribute vec3 aTargetPos;
  attribute vec3 aChaosPos;
  attribute float aRandom;
  
  varying float vRandom;
  varying float vHeight;

  void main() {
    vRandom = aRandom;
    vec3 pos = mix(aChaosPos, aTargetPos, uProgress);
    
    // Wind/Breathing
    float wind = sin(uTime * 1.5 + pos.y * 0.5) * 0.08 * uProgress;
    pos.x += wind;
    pos.z += cos(uTime * 1.2 + pos.y * 0.5) * 0.05 * uProgress;
    
    // Chaos float
    if (uProgress < 0.95) {
      float floatTime = uTime * 0.3;
      pos.y += sin(floatTime + aRandom * 10.0) * 0.5 * (1.0 - uProgress);
      pos.x += cos(floatTime + aRandom * 8.0) * 0.5 * (1.0 - uProgress);
    }

    vHeight = pos.y;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Adjusted Size
    gl_PointSize = (5.0 * uProgress + 3.0 * (1.0 - uProgress)) * (10.0 / -mvPosition.z);
  }
`;

const foliageFragmentShader = `
  uniform float uTime;
  varying float vRandom;
  varying float vHeight;

  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;

    // Rich Emerald Gradient
    vec3 deepGreen = vec3(0.0, 0.15, 0.05); 
    vec3 midGreen = vec3(0.05, 0.35, 0.15); 
    
    float heightFactor = smoothstep(-5.0, 8.0, vHeight);
    vec3 finalColor = mix(deepGreen, midGreen, heightFactor);

    // Glitter/Frost tip
    float sparkle = step(0.97, fract(vRandom * 123.45 + uTime * 0.5));
    finalColor += vec3(0.8, 0.9, 1.0) * sparkle * 0.6;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

interface FoliageProps {
  count?: number;
  currentProgress: React.MutableRefObject<number>;
}

export const Foliage: React.FC<FoliageProps> = ({ count = 30000, currentProgress }) => {
  const meshRef = useRef<THREE.Points>(null);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 }
  }), []);

  const { positions, chaosPositions, randoms } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const chaos = new Float32Array(count * 3);
    const rnd = new Float32Array(count);
    
    const height = 12;
    const baseRadius = 4.2;

    for (let i = 0; i < count; i++) {
      const h = Math.random() * height;
      const y = h - (height / 2);
      
      const r = (1 - (h / height)) * baseRadius;
      
      const theta = Math.random() * Math.PI * 2;
      // Volume filling distribution (sqroot)
      const dist = Math.sqrt(Math.random()) * r;

      pos[i * 3] = dist * Math.cos(theta);
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = dist * Math.sin(theta);

      // Chaos: Larger sphere
      chaos[i * 3] = (Math.random() - 0.5) * 35;
      chaos[i * 3 + 1] = (Math.random() - 0.5) * 35;
      chaos[i * 3 + 2] = (Math.random() - 0.5) * 35;

      rnd[i] = Math.random();
    }
    return { positions: pos, chaosPositions: chaos, randoms: rnd };
  }, [count]);

  useFrame((state) => {
    if (meshRef.current) {
      (meshRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime;
      (meshRef.current.material as THREE.ShaderMaterial).uniforms.uProgress.value = currentProgress.current;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aTargetPos" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aChaosPos" count={count} array={chaosPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={count} array={randoms} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={foliageVertexShader}
        fragmentShader={foliageFragmentShader}
        uniforms={uniforms}
        depthWrite={true}
        blending={THREE.NormalBlending}
      />
    </points>
  );
};