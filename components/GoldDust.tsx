import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MotionData, TreeState } from '../types';

const goldDustVertex = `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSize;
  attribute float aPhase;
  varying float vPhase;
  varying float vAlpha;

  void main() {
    vPhase = aPhase;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = aSize * uPixelRatio * (20.0 / -mvPosition.z);
    
    // Distance fade
    float dist = length(mvPosition.xyz);
    vAlpha = smoothstep(50.0, 10.0, dist);
  }
`;

const goldDustFragment = `
  uniform float uTime;
  varying float vPhase;
  varying float vAlpha;

  void main() {
    // Create a soft sparkle shape
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    if (r > 0.5) discard;

    // Glow center
    float glow = 1.0 - (r * 2.0);
    glow = pow(glow, 2.0);

    // Twinkle effect
    float twinkle = sin(uTime * 3.0 + vPhase * 10.0) * 0.5 + 0.5;
    
    // Gold Color Gradient
    vec3 gold = vec3(1.0, 0.85, 0.3);
    vec3 white = vec3(1.0, 1.0, 1.0);
    vec3 color = mix(gold, white, glow * twinkle);

    gl_FragColor = vec4(color, vAlpha * glow);
  }
`;

interface Props {
  count?: number;
  motionData: MotionData;
  treeState: TreeState;
}

export const GoldDust: React.FC<Props> = ({ count = 800, motionData, treeState }) => {
  const meshRef = useRef<THREE.Points>(null);
  const { viewport, mouse, size } = useThree();
  
  // Store simulation data in CPU for complex movement, but render with Shader
  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 20,
      y: (Math.random() - 0.5) * 25,
      z: (Math.random() - 0.5) * 20,
      vx: 0, vy: 0, vz: 0,
      homeX: (Math.random() - 0.5) * 15,
      homeY: (Math.random() - 0.5) * 20,
      homeZ: (Math.random() - 0.5) * 15,
      phase: Math.random() * Math.PI * 2,
      baseSize: Math.random() * 2.0 + 0.5
    }));
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    
    particles.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      sizes[i] = p.baseSize;
      phases[i] = p.phase;
    });

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    return geo;
  }, [particles, count]);

  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: goldDustVertex,
    fragmentShader: goldDustFragment,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }), []);

  useFrame((state) => {
    if (!meshRef.current) return;

    shaderMaterial.uniforms.uTime.value = state.clock.elapsedTime;

    const isChaos = treeState === TreeState.CHAOS;
    let targetX = (mouse.x * viewport.width) / 2;
    let targetY = (mouse.y * viewport.height) / 2;
    if (motionData.gesture !== 'NONE') {
       targetX = motionData.x * (viewport.width / 2) * 1.5;
       targetY = motionData.y * (viewport.height / 2) * 1.5;
    }

    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;

    particles.forEach((p, i) => {
      if (isChaos) {
        // Explosion logic
        const d = Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z);
        if (d < 15) {
          p.vx += p.x * 0.002;
          p.vy += p.y * 0.002;
          p.vz += p.z * 0.002;
        }
        p.vx += (Math.random() - 0.5) * 0.01;
        p.vy += (Math.random() - 0.5) * 0.01;
        p.vz += (Math.random() - 0.5) * 0.01;
      } else {
        // Attraction logic
        const dx = targetX - p.x;
        const dy = targetY - p.y;
        const dz = 0 - p.z;
        const distToTarget = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        let strength = 0.01; 
        if (motionData.gesture !== 'NONE') strength = 0.04;

        if (distToTarget < 15) {
          p.vx += dx * strength * 0.02;
          p.vy += dy * strength * 0.02;
          p.vz += dz * strength * 0.02;
        }
        
        // Home seek
        p.vx += (p.homeX - p.x) * 0.001;
        p.vy += (p.homeY - p.y) * 0.001;
        p.vz += (p.homeZ - p.z) * 0.001;
      }

      p.vx *= 0.95; p.vy *= 0.95; p.vz *= 0.95;
      p.x += p.vx; p.y += p.vy; p.z += p.vz;

      // Bounds
      if (Math.abs(p.x) > 40 || Math.abs(p.y) > 40) {
        p.x = p.homeX; p.y = p.homeY; p.z = p.homeZ;
        p.vx = 0; p.vy = 0; p.vz = 0;
      }

      positions[i*3] = p.x;
      positions[i*3+1] = p.y;
      positions[i*3+2] = p.z;
    });

    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef} geometry={geometry} material={shaderMaterial} />
  );
};