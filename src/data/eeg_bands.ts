export interface EegBandInfo {
  id: 'delta' | 'theta' | 'alpha' | 'lowBeta' | 'highBeta' | 'gamma';
  name: string;
  symbol: string;
  frequencyRange: string;
  minFreq: number;
  maxFreq: number;
  centerFreq: number;
  normalBaseline: string;
  baselineAmplitudeUv: string;
  color: string;
  whenElevated: {
    title: string;
    clinicalMeaning: string;
    symptoms: string[];
  };
  whenSuppressed: {
    title: string;
    clinicalMeaning: string;
    symptoms: string[];
  };
  tdcsModulation: {
    mechanism: string;
    anodalEffect: string;
    cathodalEffect: string;
    targetMontages: string[];
  };
}

export const EEG_BANDS: Record<string, EegBandInfo> = {
  delta: {
    id: 'delta',
    name: 'Delta',
    symbol: 'δ',
    frequencyRange: '0.5 – 4.0 Hz',
    minFreq: 0.5,
    maxFreq: 4.0,
    centerFreq: 2.0,
    normalBaseline: 'Deep restorative slow-wave sleep (N3); minimal in awake healthy adults (<15 µV).',
    baselineAmplitudeUv: '5 – 15 µV',
    color: '#818CF8', // Indigo / soft purple
    whenElevated: {
      title: 'Awake Excess Slowing',
      clinicalMeaning: 'Pathological cortical slowing, excessive subcortical gating, drowsiness, or focal structural/ischemic lesion slowing.',
      symptoms: ['Brain fog & sluggish cognition', 'Severe executive under-arousal', 'Daytime sleepiness / micro-naps', 'Post-concussive or post-stroke focal slowing']
    },
    whenSuppressed: {
      title: 'Slow-Wave Deficit',
      clinicalMeaning: 'Disrupted slow-wave sleep architecture and impaired non-REM restorative depth.',
      symptoms: ['Poor sleep architecture', 'Impaired glymphatic metabolic clearance', 'Chronic physical fatigue', 'Blunted growth hormone release']
    },
    tdcsModulation: {
      mechanism: 'Anodal depolarization over frontal/motor regions desynchronizes hyper-synchronous low-frequency thalamocortical oscillations.',
      anodalEffect: 'Reduces pathological awake Delta slowing (↓ 10–20%), restoring alert vigilance and motor readiness.',
      cathodalEffect: 'Can transiently increase local slow-wave power or cortical deactivation.',
      targetMontages: ['F3 (Anode) in depression/fatigue', 'C3 (Anode) in post-stroke recovery']
    }
  },
  theta: {
    id: 'theta',
    name: 'Theta',
    symbol: 'θ',
    frequencyRange: '4.0 – 8.0 Hz',
    minFreq: 4.0,
    maxFreq: 8.0,
    centerFreq: 6.0,
    normalBaseline: 'Hippocampal-prefrontal memory encoding, deep meditative absorption, internal focus (10–30 µV).',
    baselineAmplitudeUv: '10 – 30 µV',
    color: '#38BDF8', // Sky Cyan
    whenElevated: {
      title: 'Frontal Excess (High θ/β Ratio)',
      clinicalMeaning: 'Frontal theta excess is the classic neurodevelopmental biomarker for ADHD and executive under-arousal.',
      symptoms: ['Attention deficit & distractibility', 'Mind-wandering & zoning out', 'Executive task initiation paralysis', 'Working memory buffer decay']
    },
    whenSuppressed: {
      title: 'Theta Deficiency',
      clinicalMeaning: 'Impaired hippocampal-neocortical dialogue, rigid mental states, and reduced episodic memory consolidation.',
      symptoms: ['Cognitive rigidity / mental inflexibility', 'Reduced creative associative insight', 'Blunted spatial & emotional memory consolidation', 'Hyper-focused anxiety states']
    },
    tdcsModulation: {
      mechanism: 'Modulates Frontal-Midline Theta (Fmθ) phase-resetting and prefrontal-hippocampal coordination.',
      anodalEffect: 'Enhances task-evoked Frontal-Midline Theta (Fmθ) phase-locking during working memory load while clearing diffuse drowsy Theta.',
      cathodalEffect: 'Attenuates task-related theta synchronization in hyper-aroused states.',
      targetMontages: ['F3 + Fp2 (Executive load)', 'Fz + Pz (Working memory n-back)']
    }
  },
  alpha: {
    id: 'alpha',
    name: 'Alpha',
    symbol: 'α',
    frequencyRange: '8.0 – 12.0 Hz',
    minFreq: 8.0,
    maxFreq: 12.0,
    centerFreq: 10.0,
    normalBaseline: 'Relaxed wakefulness with eyes closed; cortical "idling" mechanism suppressing task-irrelevant sensory cortices (20–60 µV, posterior dominant).',
    baselineAmplitudeUv: '20 – 60 µV',
    color: '#34D399', // Emerald green
    whenElevated: {
      title: 'Frontal Asymmetry & Hyper-Idling',
      clinicalMeaning: 'Elevated Left Frontal Alpha reflects hypo-activation of left DLPFC (alpha is inversely correlated with cortical BOLD metabolism).',
      symptoms: ['Depressive affect & anhedonia', 'Avoidance motivation / withdrawal behavior', 'Excessive sensory gating / cortical disconnect', 'Inability to initiate goal-directed action']
    },
    whenSuppressed: {
      title: 'Alpha Desynchronization Deficit',
      clinicalMeaning: 'Inability of thalamocortical networks to transition into restful idling, leading to sensory overwhelm.',
      symptoms: ['Sensory overload & hypersensitivity', 'Inability to mentally unwind or relax', 'Burnout & somatic tension', 'Visual hyper-excitability & migraines']
    },
    tdcsModulation: {
      mechanism: 'Anodal stimulation desynchronizes resting Alpha (reflecting cortical activation) and increases Peak Alpha Frequency (PAF).',
      anodalEffect: 'Reduces left frontal alpha power (rebalancing Frontal Alpha Asymmetry) and promotes active approach motivation.',
      cathodalEffect: 'Increases regional idling Alpha, reducing cortical sensory hyper-reactivity.',
      targetMontages: ['F3 Anode + F4 Cathode (Bifrontal mood rebalancing)', 'Oz Cathode (Visual suppression)']
    }
  },
  lowBeta: {
    id: 'lowBeta',
    name: 'Low-Beta / SMR',
    symbol: 'β₁',
    frequencyRange: '12.0 – 15.0 Hz',
    minFreq: 12.0,
    maxFreq: 15.0,
    centerFreq: 13.5,
    normalBaseline: 'Sensorimotor Rhythm (SMR) recorded over sensorimotor strip (C3/Cz/C4); physical calm with alert cognitive readiness (5–20 µV).',
    baselineAmplitudeUv: '5 – 20 µV',
    color: '#FBBF24', // Amber
    whenElevated: {
      title: 'Optimal SMR Stabilization',
      clinicalMeaning: 'Associated with calm somatic stillness, high motor threshold, strong impulse control, and robust sleep spindle precursors.',
      symptoms: ['Calm physical stillness with mental readiness', 'High resistance to motor impulsivity', 'Optimized sleep spindle generation', 'Reduced sensory-motor restlessness']
    },
    whenSuppressed: {
      title: 'SMR Deficit / Motor Hyperactivity',
      clinicalMeaning: 'Lowered thalamic inhibitory gating of somatic sensations and motor program execution.',
      symptoms: ['Physical restlessness & fidgeting', 'Motor tics & micro-tremors', 'Heightened seizure / migraine vulnerability', 'Difficulty settling into restful sleep']
    },
    tdcsModulation: {
      mechanism: 'Modulates GABA-A receptor mediated intracortical inhibition (SICI) and corticospinal excitability.',
      anodalEffect: 'Optimizes sensorimotor beta event-related desynchronization (ERD) during movement and enhances post-movement beta rebound.',
      cathodalEffect: 'Depresses corticospinal excitability, dampening focal dystonic motor spikes.',
      targetMontages: ['C3 + Fp2 (M1 Motor learning)', 'Cz + EX_R (SMA gait regulation)']
    }
  },
  highBeta: {
    id: 'highBeta',
    name: 'High-Beta',
    symbol: 'β₂',
    frequencyRange: '15.0 – 30.0 Hz',
    minFreq: 15.0,
    maxFreq: 30.0,
    centerFreq: 22.0,
    normalBaseline: 'Active analytical problem-solving, directed external vigilance, motor preparation (5–15 µV).',
    baselineAmplitudeUv: '5 – 15 µV',
    color: '#FB923C', // Orange
    whenElevated: {
      title: 'Hyper-Vigilance & Anxious Rumination',
      clinicalMeaning: 'Excessive high-beta (>22 Hz), especially right frontal (F4) or temporal, reflects chronic central nervous system hyper-arousal.',
      symptoms: ['Severe anxiety & somatic panic', 'Obsessive looping thoughts / rumination', 'Muscle bracing & tension headaches', 'Cognitive exhaustion from hyper-vigilance']
    },
    whenSuppressed: {
      title: 'Analytical Processing Deficit',
      clinicalMeaning: 'Insufficient fast-wave recruitment during high-demand computational or cognitive challenges.',
      symptoms: ['Sluggish cognitive processing speed', 'Lethargic mental execution', 'Difficulty sustaining concentrated analytical effort', 'Apathy toward complex tasks']
    },
    tdcsModulation: {
      mechanism: 'Prefrontal polarization modulates cortical signal-to-noise ratio and glutamatergic metabolic consumption.',
      anodalEffect: 'Boosts task-related functional High-Beta (15–22 Hz) during analytical reasoning and mathematical computation.',
      cathodalEffect: 'Cathodal F4 effectively dampens right-frontal High-Beta excess, reducing panic and anxious hyper-vigilance.',
      targetMontages: ['F3 Anode + F4 Cathode (Depression + Anxiety)', 'P3 Anode + P4 Cathode (Mathematical cognition)']
    }
  },
  gamma: {
    id: 'gamma',
    name: 'Gamma',
    symbol: 'γ',
    frequencyRange: '30.0 – 80.0 Hz',
    minFreq: 30.0,
    maxFreq: 80.0,
    centerFreq: 40.0,
    normalBaseline: 'Cross-cortical temporal binding, synaptic plasticity induction (LTP), high-level perceptual synthesis (2–8 µV).',
    baselineAmplitudeUv: '2 – 8 µV',
    color: '#EC4899', // Pink / Magenta
    whenElevated: {
      title: 'Peak Integrative Binding',
      clinicalMeaning: 'Optimal 40 Hz gamma synchrony enables rapid inter-regional communication and synaptic consolidation.',
      symptoms: ['Sudden "aha!" creative insights', 'High working memory capacity', 'Heightened sensory integration', 'Rapid associative learning']
    },
    whenSuppressed: {
      title: 'Perceptual & Plasticity Deficit',
      clinicalMeaning: 'Parvalbumin-positive fast-spiking GABA interneuron dysfunction causing breakdown of multi-modal sensory binding.',
      symptoms: ['Cognitive fragmentation & memory deficits', 'Impaired synaptic plasticity & slow learning', 'Sensory feature-binding failures', 'Early biomarker of neurodegenerative decline']
    },
    tdcsModulation: {
      mechanism: 'Anodal stimulation depolarizes pyramidal somatic compartments while modulating fast-spiking PV+ basket cell networks.',
      anodalEffect: 'Robustly enhances Theta-Gamma Phase-Amplitude Coupling (PAC) and boosts local Gamma power (↑ 15–35%), driving LTP neuroplasticity.',
      cathodalEffect: 'Decreases gamma oscillation amplitude and dampens focal cortical hyper-excitability.',
      targetMontages: ['F3 Anode (DLPFC plasticity)', 'P3 Anode (Visuospatial binding)', 'Oz Anode (Visual feature binding)']
    }
  }
};
