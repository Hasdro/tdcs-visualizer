import React, { useState, useEffect, useRef } from 'react';
import {
  audioSonification,
  BrainWaveBandId,
  BAND_FREQUENCIES
} from '../utils/audioSonification';
import { Volume2, VolumeX, Play, Square, Radio, X } from 'lucide-react';
import { BinauralPhaseInterferenceDiagram } from './visuals/BinauralPhaseInterferenceDiagram';

interface AudioSonificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBandRecommendation?: BrainWaveBandId;
}

export const AudioSonificationModal: React.FC<AudioSonificationModalProps> = ({
  isOpen,
  onClose,
  activeBandRecommendation = 'alpha',
}) => {
  const [isPlaying, setIsPlaying] = useState(audioSonification.getActive());
  const [band, setBand] = useState<BrainWaveBandId>(activeBandRecommendation);
  const [volume, setVolume] = useState<number>(0.35);
  const [carrier, setCarrier] = useState<number>(216);
  const [isochronic, setIsochronic] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeBandRecommendation && !isPlaying) {
      setBand(activeBandRecommendation);
    }
  }, [activeBandRecommendation, isPlaying]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioSonification.stop();
      setIsPlaying(false);
    } else {
      audioSonification.start({
        band,
        carrierFreq: carrier,
        volume,
        isochronic,
      });
      setIsPlaying(true);
    }
  };

  const handleBandChange = (newBand: BrainWaveBandId) => {
    setBand(newBand);
    audioSonification.updateBand(newBand);
    setCarrier(BAND_FREQUENCIES[newBand].defaultCarrier);
    audioSonification.updateCarrier(BAND_FREQUENCIES[newBand].defaultCarrier);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    audioSonification.updateVolume(newVol);
  };

  const handleCarrierChange = (newCarrier: number) => {
    setCarrier(newCarrier);
    audioSonification.updateCarrier(newCarrier);
  };

  const handleIsochronicToggle = () => {
    const next = !isochronic;
    setIsochronic(next);
    audioSonification.toggleIsochronic(next);
  };

  // Canvas Oscilloscope Animation
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(256);

    const renderWave = () => {
      audioSonification.getWaveformData(dataArray);

      ctx.fillStyle = '#070B12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Audio waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = isPlaying ? '#06b6d4' : '#64748b';
      ctx.shadowColor = isPlaying ? '#06b6d4' : 'transparent';
      ctx.shadowBlur = isPlaying ? 8 : 0;
      ctx.beginPath();

      const sliceWidth = canvas.width / dataArray.length;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;

      animFrameRef.current = requestAnimationFrame(renderWave);
    };

    renderWave();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, isPlaying]);

  if (!isOpen) return null;

  const currentBandInfo = BAND_FREQUENCIES[band];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#0B1322] border border-cyan-500/40 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#0E1729]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
                EEG sonification
                <span className="rounded bg-cyan-900/60 px-1.5 py-0.5 text-[11px] font-normal text-cyan-300">
                  Web Audio · ASSR
                </span>
              </h2>
              <p className="text-[12px] text-slate-400">
                Auditory steady-state resonance & stereophonic binaural pulse synthesis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Oscilloscope Viewport */}
        <div className="p-4 bg-[#070B12] border-b border-slate-800">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-medium">Stereo oscilloscope</span>
            <span className={isPlaying ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
              {isPlaying ? <>Emitting <span className="font-mono">{currentBandInfo.targetHz} Hz</span> pulse</> : 'Standby'}
            </span>
          </div>
          <canvas
            ref={canvasRef}
            width={460}
            height={85}
            className="w-full h-20 rounded bg-[#070B12] border border-slate-800"
          />
        </div>

        {/* Controls Body */}
        <div className="p-5 space-y-4">
          {/* Band Selector Buttons */}
          <div>
            <label className="text-xs font-mono font-bold text-slate-300 block mb-2">
              Target EEG frequency band
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(BAND_FREQUENCIES) as BrainWaveBandId[]).map((bKey) => {
                const info = BAND_FREQUENCIES[bKey];
                const active = band === bKey;
                return (
                  <button
                    key={bKey}
                    onClick={() => handleBandChange(bKey)}
                    className={`p-2 rounded-lg text-left border transition font-mono ${
                      active
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-glow-cyan'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{info.name}</div>
                    <div className="text-[11px] text-slate-500">{info.targetHz} Hz Beat</div>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[12px] text-slate-400 font-mono italic">
              {currentBandInfo.description}
            </p>
          </div>

          {/* Volume and Carrier Frequency Sliders */}
          <div className="grid grid-cols-2 gap-4">
            {/* Volume */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span className="flex items-center gap-1">
                  {volume > 0 ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                  Volume
                </span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Carrier Frequency */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Carrier Tone</span>
                <span>{carrier} Hz</span>
              </div>
              <input
                type="range"
                min="120"
                max="440"
                step="2"
                value={carrier}
                onChange={(e) => handleCarrierChange(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>

          {/* Isochronic Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 text-xs font-mono">
            <div>
              <div className="font-bold text-slate-200">Isochronic Pulse Modulation</div>
              <div className="text-[11px] text-slate-400">
                Amplitude-modulate tone for speaker listening without headphones
              </div>
            </div>
            <button
              onClick={handleIsochronicToggle}
              className={`px-3 py-1 rounded text-xs transition border ${
                isochronic
                  ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {isochronic ? 'Enabled' : 'Binaural Only'}
            </button>
          </div>

          {/* Visual binaural neurophysics diagram (replaces the explanatory info paragraph) */}
          <BinauralPhaseInterferenceDiagram
            carrierHz={carrier}
            beatHz={currentBandInfo.targetHz}
            isPlaying={isPlaying}
          />
        </div>

        {/* Footer Play / Close Actions */}
        <div className="px-5 py-3 bg-[#0A101D] border-t border-slate-800 flex items-center justify-between">
          <div className="text-[12px] font-mono text-slate-500">
            Stereo 44.1 kHz 32-bit float
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePlay}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition shadow ${
                isPlaying
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-glow-anode'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-glow-cyan'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop audio</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start sonification</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
