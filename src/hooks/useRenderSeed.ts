import { createContext, useContext } from 'react';

export const RenderSeedContext = createContext<number>(0);

export function useRenderSeed(): number {
  return useContext(RenderSeedContext);
}

