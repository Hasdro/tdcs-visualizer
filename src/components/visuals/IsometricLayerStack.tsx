import React from 'react';
import { Layers } from 'lucide-react';

interface IsometricLayerStackProps {
  showHumanFace: boolean;
  setShowHumanFace: (v: boolean) => void;
  showScalpGrid: boolean;
  setShowScalpGrid: (v: boolean) => void;
  showShuntHalo: boolean;
  setShowShuntHalo: (v: boolean) => void;
  showEField: boolean;
  setShowEField: (v: boolean) => void;
  showStreamlines: boolean;
  setShowStreamlines: (v: boolean) => void;
  showPointCloud: boolean;
  setShowPointCloud: (v: boolean) => void;
  showBrodmannLabels: boolean;
  setShowBrodmannLabels: (v: boolean) => void;
}

export const IsometricLayerStack: React.FC<IsometricLayerStackProps> = ({
  showHumanFace,
  setShowHumanFace,
  showScalpGrid,
  setShowScalpGrid,
  showShuntHalo,
  setShowShuntHalo,
  showEField,
  setShowEField,
  showStreamlines,
  setShowStreamlines,
  showPointCloud,
  setShowPointCloud,
  showBrodmannLabels,
  setShowBrodmannLabels
}) => {
  const layers = [
    {
      id: 'face',
      label: 'Skin',
      color: '#38BDF8',
      active: showHumanFace,
      toggle: () => setShowHumanFace(!showHumanFace),
      tooltip: 'Layer 1: Anterior Facial Contours'
    },
    {
      id: 'scalp',
      label: 'Scalp',
      color: '#06B6D4',
      active: showScalpGrid,
      toggle: () => setShowScalpGrid(!showScalpGrid),
      tooltip: 'Layer 2: 10-20 Calvarium Grid & Straps'
    },
    {
      id: 'skull',
      label: 'Skull',
      color: '#FB7185',
      active: showShuntHalo,
      toggle: () => setShowShuntHalo(!showShuntHalo),
      tooltip: 'Layer 3: Bone Barrier & Lateral Shunt Halo'
    },
    {
      id: 'efield',
      label: 'Heatmap',
      color: '#F59E0B',
      active: showEField,
      toggle: () => setShowEField(!showEField),
      tooltip: 'Layer 4: Cortical E-Field Gradients'
    },
    {
      id: 'current',
      label: 'Current',
      color: '#38BDF8',
      active: showStreamlines,
      toggle: () => setShowStreamlines(!showStreamlines),
      tooltip: 'Layer 5: 3D Vector Streamlines'
    },
    {
      id: 'neurons',
      label: 'Neurons',
      color: '#A855F7',
      active: showPointCloud,
      toggle: () => setShowPointCloud(!showPointCloud),
      tooltip: 'Layer 6: Neural Point-Cloud Density'
    },
    {
      id: 'labels',
      label: 'Labels',
      color: '#10B981',
      active: showBrodmannLabels,
      toggle: () => setShowBrodmannLabels(!showBrodmannLabels),
      tooltip: 'Layer 7: Brodmann Area Cytoarchitectonic Pins'
    }
  ];

  return (
    <div className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 font-mono text-[10px] select-none shadow-md">
      <div className="flex items-center gap-1 px-1.5 text-slate-400 border-r border-slate-800">
        <Layers className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden xl:inline text-slate-300 font-semibold">LAYERS:</span>
      </div>

      <div className="flex items-center gap-1">
        {layers.map((layer) => (
          <button
            key={layer.id}
            onClick={layer.toggle}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border ${
              layer.active
                ? 'bg-slate-800 border-slate-700 text-white font-bold shadow-sm'
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
            }`}
            title={layer.tooltip}
          >
            {/* Signature Colored LED Pip */}
            <span
              className="w-2 h-2 rounded-full transition-transform"
              style={{
                backgroundColor: layer.active ? layer.color : '#475569',
                boxShadow: layer.active ? `0 0 6px ${layer.color}` : 'none'
              }}
            />
            <span>{layer.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
