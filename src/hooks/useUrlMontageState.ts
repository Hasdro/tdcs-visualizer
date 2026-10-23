import { useState, useEffect, useCallback } from 'react';

export interface MontageUrlState {
  anode: string;
  cathode: string;
  ma: number;
  dur: number;
  pad: number;
  mode: 'sponge' | 'hd4x1';
  view: string;
}

const DEFAULT_STATE: MontageUrlState = {
  anode: 'F3',
  cathode: 'Fp2',
  ma: 2.0,
  dur: 20,
  pad: 25,
  mode: 'sponge',
  view: 'efield'
};

/**
 * Parses URL hash params into a typed MontageUrlState object
 */
function parseHash(hashString: string): MontageUrlState {
  const hash = hashString.startsWith('#') ? hashString.slice(1) : hashString;
  if (!hash) return DEFAULT_STATE;

  const params = new URLSearchParams(hash);
  const anode = params.get('anode') || DEFAULT_STATE.anode;
  const cathode = params.get('cathode') || DEFAULT_STATE.cathode;
  const ma = parseFloat(params.get('ma') || `${DEFAULT_STATE.ma}`);
  const dur = parseInt(params.get('dur') || `${DEFAULT_STATE.dur}`, 10);
  const pad = parseFloat(params.get('pad') || `${DEFAULT_STATE.pad}`);
  const modeParam = params.get('mode');
  const mode: 'sponge' | 'hd4x1' = modeParam === 'hd4x1' ? 'hd4x1' : 'sponge';
  const view = params.get('view') || DEFAULT_STATE.view;

  return {
    anode,
    cathode,
    ma: isNaN(ma) ? DEFAULT_STATE.ma : Math.max(0.2, Math.min(3.0, ma)),
    dur: isNaN(dur) ? DEFAULT_STATE.dur : Math.max(1, Math.min(60, dur)),
    pad: isNaN(pad) ? DEFAULT_STATE.pad : Math.max(3.14, Math.min(50, pad)),
    mode,
    view
  };
}

/**
 * Custom hook to synchronize complete application montage state with URL hash.
 * Enables 100% shareable links like AngioView without triggering page reloads.
 */
export function useUrlMontageState() {
  const [state, setState] = useState<MontageUrlState>(() => {
    if (typeof window === 'undefined') return DEFAULT_STATE;
    return parseHash(window.location.hash);
  });

  // Sync to URL hash whenever state changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('anode', state.anode);
    params.set('cathode', state.cathode);
    params.set('ma', state.ma.toString());
    params.set('dur', state.dur.toString());
    params.set('pad', state.pad.toString());
    params.set('mode', state.mode);
    params.set('view', state.view);

    const newHash = `#${params.toString()}`;
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash);
    }
  }, [state]);

  // Listen to hash changes (browser back/forward button navigation)
  useEffect(() => {
    const handleHashChange = () => {
      setState(parseHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const updateState = useCallback((partial: Partial<MontageUrlState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  return [state, updateState] as const;
}
