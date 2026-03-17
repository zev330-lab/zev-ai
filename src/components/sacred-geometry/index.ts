export { SeedOfLife } from './seed-of-life';
export { MetatronsCube } from './metatrons-cube';
export { SriYantra } from './sri-yantra';
export { Torus } from './torus';
export { Lotus } from './lotus';
export { YinYang } from './yin-yang';
export { FlowerOfLife } from './flower-of-life';
export { Merkabah } from './merkabah';
export { Vortex } from './vortex';

import { SeedOfLife } from './seed-of-life';
import { MetatronsCube } from './metatrons-cube';
import { SriYantra } from './sri-yantra';
import { Torus } from './torus';
import { Lotus } from './lotus';
import { YinYang } from './yin-yang';
import { FlowerOfLife } from './flower-of-life';
import { Merkabah } from './merkabah';
import { Vortex } from './vortex';
import type { ComponentType } from 'react';

interface GeometryProps {
  size?: number;
  animate?: boolean;
  state?: 'idle' | 'active' | 'complete';
  color?: string;
  className?: string;
}

export const GEOMETRY_COMPONENTS: Record<string, ComponentType<GeometryProps>> = {
  seed_of_life: SeedOfLife,
  metatrons_cube: MetatronsCube,
  sri_yantra: SriYantra,
  torus: Torus,
  lotus: Lotus,
  yin_yang: YinYang,
  flower_of_life: FlowerOfLife,
  merkabah: Merkabah,
  vortex: Vortex,
};
