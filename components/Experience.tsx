import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, ContactShadows, Stars, Lightformer } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { TreeState, MotionData } from '../types';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { GoldDust } from './GoldDust';
import { Star } from './Star';
import { Snow } from './Snow';
import { SpiralLights } from './SpiralLights';
import { SpecialGift } from './SpecialGift';

interface Props {
  treeState: TreeState;
  motionData: MotionData;
  onGiftClick: () => void;
}

export const Experience: React.FC<Props> = ({ treeState, motionData, onGiftClick }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const isDragging = useRef(false);
  const previousPointerX = useRef(0);
  const rotationVelocity = useRef(0);
  const currentProgress = useRef(treeState === TreeState.FORMED ? 1 : 0);

  const { viewport } = useThree();

  const handlePointerDown = (e: any) => {
    isDragging.current = true;
    previousPointerX.current = e.clientX;
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handlePointerMove = (e: any) => {
    if (isDragging.current) {
      const delta = e.clientX - previousPointerX.current;
      rotationVelocity.current += delta * 0.0005; 
      previousPointerX.current = e.clientX;
    }
  };

  useFrame((state, delta) => {
    const targetProgress = treeState === TreeState.FORMED ? 1 : 0;
    // Smoother transition
    currentProgress.current = THREE.MathUtils.lerp(currentProgress.current, targetProgress, delta * 1.5);

    if (groupRef.current) {
      groupRef.current.rotation.y += rotationVelocity.current;
      rotationVelocity.current *= 0.95;

      if (!isDragging.current && Math.abs(rotationVelocity.current) < 0.001) {
        groupRef.current.rotation.y += 0.0015; // Slow ambient rotation
      }

      if (Math.abs(motionData.x) > 0.3 && motionData.intensity > 0.1) {
         rotationVelocity.current += motionData.x * 0.02;
      }
    }
  });

  return (
    <>
      {/* Cinematic Lighting */}
      <ambientLight intensity={0.1} />
      
      {/* Synthetic Environment for Reflections (Replaces external HDR) */}
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
          <Lightformer form="rect" intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[10, 10, 1]} />
          {/* Warm highlight for gold */}
          <Lightformer form="ring" color="#fff0cc" intensity={10} scale={10} position={[0, 10, 0]} />
        </group>
      </Environment>

      {/* Key Light */}
      <pointLight position={[10, 10, 10]} intensity={2.0} color="#ffebba" distance={50} decay={2} />
      {/* Rim Light for drama */}
      <spotLight position={[-15, 5, -10]} angle={0.5} penumbra={1} intensity={5} color="#00ff9d" distance={40} />
      <spotLight position={[15, 5, -10]} angle={0.5} penumbra={1} intensity={3} color="#ffaa00" distance={40} />

      {/* Input Layer */}
      <mesh 
        visible={false} 
        onPointerDown={handlePointerDown} 
        onPointerUp={handlePointerUp} 
        onPointerLeave={handlePointerUp}
        onPointerMove={handlePointerMove}
        position={[0, 0, 5]} 
      >
        <planeGeometry args={[viewport.width, viewport.height]} />
      </mesh>

      <Snow />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />

      {/* Scaled down tree group */}
      <group ref={groupRef} position={[0, -2, 0]} scale={[0.85, 0.85, 0.85]}>
        
        <Star currentProgress={currentProgress} />
        {/* Added SpiralLights (Golden Coil) */}
        <SpiralLights currentProgress={currentProgress} />
        <SpecialGift currentProgress={currentProgress} onClick={onGiftClick} />
        
        <Foliage currentProgress={currentProgress} count={30000} />

        {/* --- Ornament Layers --- */}
        
        {/* Base Gifts */}
        <Ornaments count={30} type="gift" color="#5e0b0b" currentProgress={currentProgress} /> {/* Dark Red */}
        <Ornaments count={20} type="gift" color="#8a6d1c" currentProgress={currentProgress} /> {/* Antique Gold */}

        {/* Champagne & Platinum Balls */}
        <Ornaments count={80} type="ball" color="#F3E5AB" currentProgress={currentProgress} />
        <Ornaments count={50} type="ball" color="#C0C0C0" currentProgress={currentProgress} />
        
        {/* Glossy Red Spheres */}
        <Ornaments count={40} type="ball" color="#ff0000" currentProgress={currentProgress} />

        {/* Pure Gold Spheres */}
        <Ornaments count={40} type="ball" color="#FFD700" currentProgress={currentProgress} />

        {/* Lights */}
        <Ornaments count={300} type="light" color="#fffae6" currentProgress={currentProgress} />
      </group>

      <GoldDust motionData={motionData} treeState={treeState} />

      <ContactShadows opacity={0.5} scale={40} blur={2.5} far={10} color="#000000" />

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.5}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.0} />
      </EffectComposer>
    </>
  );
};