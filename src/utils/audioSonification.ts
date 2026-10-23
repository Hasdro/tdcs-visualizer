/**
 * Web Audio Brain Wave Sonification Engine
 * 
 * Generates stereophonic binaural beats and isochronic pulses based on
 * EEG brain wave frequencies (Delta 2 Hz, Theta 6 Hz, Alpha 10 Hz, SMR 14 Hz, Beta 20 Hz, Gamma 40 Hz).
 * 
 * In neuroscience and neurofeedback, binaural acoustic stimulation presents
 * slightly detuned frequencies to each ear (fc in Left, fc + df in Right),
 * evoking auditory steady-state responses (ASSR) in the brainstem superior olivary complex.
 */

export type BrainWaveBandId = 'delta' | 'theta' | 'alpha' | 'smr' | 'highBeta' | 'gamma';

export interface SonificationConfig {
  band: BrainWaveBandId;
  carrierFreq: number; // e.g. 216 Hz (warm harmonic base)
  volume: number; // 0.0 to 1.0
  isochronic: boolean; // whether to add amplitude modulation pulses
  powerShiftPercent: number; // live tDCS EEG shift (-50% to +50%)
}

export const BAND_FREQUENCIES: Record<BrainWaveBandId, { name: string; targetHz: number; defaultCarrier: number; description: string }> = {
  delta: { name: 'Delta (δ)', targetHz: 2.5, defaultCarrier: 174, description: 'Deep restorative slow wave (0.5 - 4 Hz)' },
  theta: { name: 'Theta (θ)', targetHz: 6.0, defaultCarrier: 216, description: 'Frontal-midline memory & meditative flow (4 - 8 Hz)' },
  alpha: { name: 'Alpha (α)', targetHz: 10.0, defaultCarrier: 256, description: 'Relaxed wakefulness & sensory gating (8 - 12 Hz)' },
  smr: { name: 'SMR / Low-Beta (β1)', targetHz: 14.0, defaultCarrier: 285, description: 'Sensorimotor stillness & physical readiness (12 - 15 Hz)' },
  highBeta: { name: 'High-Beta (β2)', targetHz: 22.0, defaultCarrier: 396, description: 'Active analytical focus & mental processing (15 - 30 Hz)' },
  gamma: { name: 'Gamma (γ)', targetHz: 40.0, defaultCarrier: 432, description: '40 Hz feature binding & synaptic neuroplasticity (30 - 80 Hz)' },
};

class AudioSonificationEngine {
  private ctx: AudioContext | null = null;
  private leftOsc: OscillatorNode | null = null;
  private rightOsc: OscillatorNode | null = null;
  private leftGain: GainNode | null = null;
  private rightGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private analyser: AnalyserNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  private isRunning: boolean = false;
  private currentConfig: SonificationConfig = {
    band: 'alpha',
    carrierFreq: 216,
    volume: 0.35,
    isochronic: false,
    powerShiftPercent: 0,
  };

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public start(config?: Partial<SonificationConfig>) {
    if (config) {
      this.currentConfig = { ...this.currentConfig, ...config };
    }

    const ctx = this.initContext();
    if (this.isRunning) {
      this.stop();
    }

    const { band, carrierFreq, volume, isochronic } = this.currentConfig;
    const bandInfo = BAND_FREQUENCIES[band];
    const targetHz = bandInfo.targetHz;

    // Master Gain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    this.masterGain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.001), ctx.currentTime + 0.15);

    // Analyser for real-time oscilloscope visualizer
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.85;

    // Stereo Merger (Channel 0: Left, Channel 1: Right)
    this.merger = ctx.createChannelMerger(2);

    // Left Ear Oscillator: carrierFreq
    this.leftOsc = ctx.createOscillator();
    this.leftOsc.type = 'sine';
    this.leftOsc.frequency.setValueAtTime(carrierFreq, ctx.currentTime);

    this.leftGain = ctx.createGain();
    this.leftGain.gain.setValueAtTime(0.5, ctx.currentTime);
    this.leftOsc.connect(this.leftGain);
    this.leftGain.connect(this.merger, 0, 0); // Left channel

    // Right Ear Oscillator: carrierFreq + targetHz (Binaural Beat!)
    this.rightOsc = ctx.createOscillator();
    this.rightOsc.type = 'sine';
    this.rightOsc.frequency.setValueAtTime(carrierFreq + targetHz, ctx.currentTime);

    this.rightGain = ctx.createGain();
    this.rightGain.gain.setValueAtTime(0.5, ctx.currentTime);
    this.rightOsc.connect(this.rightGain);
    this.rightGain.connect(this.merger, 0, 1); // Right channel

    // Isochronic pulse modulation (optional)
    if (isochronic) {
      this.lfoOsc = ctx.createOscillator();
      this.lfoOsc.type = 'sine';
      this.lfoOsc.frequency.setValueAtTime(targetHz, ctx.currentTime);

      this.lfoGain = ctx.createGain();
      this.lfoGain.gain.setValueAtTime(0.35, ctx.currentTime);

      this.lfoOsc.connect(this.lfoGain.gain);
      this.lfoOsc.start();
    }

    // Connect merger to master gain, analyser, and output
    this.merger.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    this.leftOsc.start();
    this.rightOsc.start();
    this.isRunning = true;
  }

  public stop() {
    if (!this.isRunning || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      if (this.masterGain) {
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      }

      setTimeout(() => {
        try {
          this.leftOsc?.stop();
          this.rightOsc?.stop();
          this.lfoOsc?.stop();
          this.leftOsc?.disconnect();
          this.rightOsc?.disconnect();
          this.leftGain?.disconnect();
          this.rightGain?.disconnect();
          this.masterGain?.disconnect();
          this.merger?.disconnect();
          this.analyser?.disconnect();
        } catch {
          // ignore cleanup issues
        }
        this.isRunning = false;
      }, 120);
    } catch {
      this.isRunning = false;
    }
  }

  public updateBand(band: BrainWaveBandId) {
    this.currentConfig.band = band;
    if (!this.isRunning || !this.ctx) return;

    const bandInfo = BAND_FREQUENCIES[band];
    const carrier = this.currentConfig.carrierFreq;
    const targetHz = bandInfo.targetHz;
    const now = this.ctx.currentTime;

    if (this.leftOsc) {
      this.leftOsc.frequency.cancelScheduledValues(now);
      this.leftOsc.frequency.linearRampToValueAtTime(carrier, now + 0.2);
    }
    if (this.rightOsc) {
      this.rightOsc.frequency.cancelScheduledValues(now);
      this.rightOsc.frequency.linearRampToValueAtTime(carrier + targetHz, now + 0.2);
    }
    if (this.lfoOsc) {
      this.lfoOsc.frequency.cancelScheduledValues(now);
      this.lfoOsc.frequency.linearRampToValueAtTime(targetHz, now + 0.2);
    }
  }

  public updateVolume(vol: number) {
    this.currentConfig.volume = Math.max(0, Math.min(1, vol));
    if (this.isRunning && this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.currentConfig.volume, now + 0.05);
    }
  }

  public updateCarrier(carrier: number) {
    this.currentConfig.carrierFreq = carrier;
    this.updateBand(this.currentConfig.band);
  }

  public toggleIsochronic(enabled: boolean) {
    this.currentConfig.isochronic = enabled;
    if (this.isRunning) {
      this.start(this.currentConfig);
    }
  }

  public getActive(): boolean {
    return this.isRunning;
  }

  public getConfig(): SonificationConfig {
    return { ...this.currentConfig };
  }

  public getWaveformData(dataArray: Uint8Array): void {
    if (this.analyser && this.isRunning) {
      this.analyser.getByteTimeDomainData(dataArray as unknown as Uint8Array<ArrayBuffer>);
    } else {
      dataArray.fill(128);
    }
  }
}

export const audioSonification = new AudioSonificationEngine();
