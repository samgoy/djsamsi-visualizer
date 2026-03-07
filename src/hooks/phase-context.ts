import { createContext, useContext } from 'react';
import type { ConfigPhaseState } from './useConfigPhase';
import { usePhase, type PhaseState } from './usePhase';

export type ActivePhaseState = ConfigPhaseState | PhaseState;

export const PhaseContext = createContext<ConfigPhaseState | null>(null);

// Use config-driven phase inside ExperiencePlayer; fallback to static phase for legacy compositions.
export function useActivePhase(): ActivePhaseState {
  const ctx = useContext(PhaseContext);
  return ctx ?? usePhase();
}

