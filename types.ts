export enum TreeState {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED'
}

export type GestureType = 'OPEN_HAND' | 'CLOSED_FIST' | 'NONE';

export interface MotionData {
  x: number; // -1 to 1
  y: number; // -1 to 1
  intensity: number; // 0 to 1
  gesture: GestureType;
}

export interface PhysicsState {
  rotationVelocity: number;
}