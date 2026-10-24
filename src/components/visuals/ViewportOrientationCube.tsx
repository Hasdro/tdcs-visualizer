import React from 'react';
import { Compass } from 'lucide-react';

interface ViewportOrientationCubeProps {
  onSnapCamera?: (view: 'front' | 'left' | 'top' | 'bilateral') => void;
}

export const ViewportOrientationCube: React.FC<ViewportOrientationCubeProps> = ({ onSnapCamera }) => {
  return (
    <div className="bg-[#0F1623]/90 backdrop-blur-md border border-slate-800/80 rounded-xl p-2 shadow-2xl flex items-center gap-1.5 font-mono text-[10px] select-none">
      <div className="flex items-center gap-1 text-slate-400 px-1 border-r border-slate-800">
        <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
        <span className="font-semibold text-slate-300">SNAP VIEW:</span>
      </div>

      <button
        onClick={() => onSnapCamera && onSnapCamera('front')}
        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-500/50 transition cursor-pointer"
        title="Anterior Face Landmark View"
      >
        👤 Anterior Face
      </button>

      <button
        onClick={() => onSnapCamera && onSnapCamera('left')}
        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700/80 hover:border-amber-500/50 transition cursor-pointer"
        title="Left DLPFC / Motor Sagittal View"
      >
        🧠 Left DLPFC
      </button>

      <button
        onClick={() => onSnapCamera && onSnapCamera('top')}
        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-700/80 hover:border-emerald-500/50 transition cursor-pointer"
        title="Top Vertex Axial View"
      >
        ⬆️ Top Vertex
      </button>

      <button
        onClick={() => onSnapCamera && onSnapCamera('bilateral')}
        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-sky-300 border border-slate-700/80 hover:border-sky-500/50 transition cursor-pointer"
        title="Bilateral Hemispheric Overview"
      >
        🌐 Bilateral
      </button>
    </div>
  );
};
