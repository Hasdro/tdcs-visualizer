import React from 'react';
import { ArrowUp, Compass, Eye, RotateCcw, UserRound } from 'lucide-react';

export type CameraView = 'anterior' | 'left' | 'right' | 'vertex' | 'occipital' | 'reset';

interface ViewportOrientationCubeProps {
  onSnapCamera?: (view: CameraView) => void;
}

/** Left/right profile glyph: a head silhouette facing the given side. */
const ProfileIcon: React.FC<{ className?: string; facing: 'left' | 'right' }> = ({ className, facing }) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
    <g transform={facing === 'right' ? 'translate(16 0) scale(-1 1)' : undefined}>
      <path d="M11 14v-2.5c1.2-.6 2-2 2-3.6C13 5 10.9 2.5 8 2.5S3.5 4.6 3.5 7l-1.2 2.2h1.3v1.6c0 .7.6 1.2 1.3 1.2H6V14" />
    </g>
  </svg>
);

const VIEWS: Array<{ id: CameraView; label: string; title: string; icon: React.ReactNode }> = [
  { id: 'anterior', label: 'Front', title: 'Anterior: face and frontal lobes', icon: <UserRound className="h-3.5 w-3.5" /> },
  { id: 'left', label: 'Left', title: 'Left lateral: DLPFC, motor strip, Broca', icon: <ProfileIcon facing="left" className="h-3.5 w-3.5" /> },
  { id: 'right', label: 'Right', title: 'Right lateral: right frontal and parietal', icon: <ProfileIcon facing="right" className="h-3.5 w-3.5" /> },
  { id: 'vertex', label: 'Top', title: 'Vertex: top-down 10-20 symmetry', icon: <ArrowUp className="h-3.5 w-3.5" /> },
  { id: 'occipital', label: 'Back', title: 'Occipital: visual cortex', icon: <Eye className="h-3.5 w-3.5" /> },
  { id: 'reset', label: 'Reset', title: 'Reset to the default orbit view', icon: <RotateCcw className="h-3.5 w-3.5" /> }
];

/**
 * Camera snap tray. Each button tweens the orbit camera to a standard
 * clinical viewpoint; labels collapse below 1440 px.
 */
export const ViewportOrientationCube: React.FC<ViewportOrientationCubeProps> = ({ onSnapCamera }) => (
  <div className="flex select-none items-center gap-0.5 rounded-xl border border-slate-800/80 bg-[#0E1524]/90 p-1 shadow-2xl backdrop-blur-md" role="toolbar" aria-label="Camera views">
    <div className="hidden items-center gap-1 border-r border-slate-800 px-1.5 text-[11px] font-medium text-slate-400 min-[1600px]:flex">
      <Compass className="h-3.5 w-3.5 text-cyan-400" />
      <span>View</span>
    </div>

    {VIEWS.map(({ id, label, title, icon }) => (
      <button
        key={id}
        type="button"
        onClick={() => onSnapCamera?.(id)}
        title={title}
        aria-label={title}
        className="flex items-center gap-1.5 rounded-lg border border-transparent px-1.5 py-1.5 text-[11px] font-medium text-slate-400 transition hover:border-slate-700 hover:bg-slate-800/80 hover:text-slate-100"
      >
        {icon}
        <span className="hidden whitespace-nowrap min-[1600px]:inline">{label}</span>
      </button>
    ))}
  </div>
);

export default ViewportOrientationCube;
