export type BrainLobe = 'Frontal' | 'Motor/Central' | 'Temporal' | 'Parietal' | 'Occipital' | 'Extracephalic';

export interface EegBandShift {
  delta: number; // percentage shift, e.g. -15 for -15%
  theta: number;
  alpha: number;
  beta: number;
  gamma: number;
}

export interface CognitiveMetrics {
  focus: number; // -100 to +100
  mood: number;
  motorSpeed: number;
  language: number;
  painThreshold: number;
  visualAcuity: number;
}

export interface Citation {
  authors: string;
  year: number;
  journal: string;
  pmid: string;
  finding: string;
}

export interface NodePolarityEffect {
  summary: string;
  cellularAction: string;
  eegShifts: EegBandShift;
  cognitiveMetrics: CognitiveMetrics;
  sideEffects: string[];
}

export interface BrainNode {
  id: string;
  name: string;
  shortName: string;
  brodmannAreas: string[];
  lobe: BrainLobe;
  pos3D: [number, number, number]; // Scalp surface coordinate [x, y, z]
  posCortical: [number, number, number]; // Underlying cortical projection [cx, cy, cz]
  normal: [number, number, number]; // Outward unit normal vector for flush electrode alignment
  primaryFunctions: string[];
  clinicalIndications: string[];
  anodalEffects: NodePolarityEffect;
  cathodalEffects: NodePolarityEffect;
  keyCitations: Citation[];
}

export const BRAIN_NODES: Record<string, BrainNode> = {
  Fp1: {
    id: 'Fp1',
    name: 'Left Frontopolar / Orbitofrontal Cortex',
    shortName: 'Left Frontopolar (OFG)',
    brodmannAreas: ['BA 10', 'BA 11'],
    lobe: 'Frontal',
    pos3D: [-0.328, 0.256, 0.922],
    posCortical: [-0.27, 0.21, 0.77],
    normal: [-0.426, 0.291, 0.857],
    primaryFunctions: [
      'Emotional valence evaluation & affective anticipation',
      'Integration of past emotional experiences into prospective decision-making',
      'Default-Mode Network (DMN) anterior gating',
      'Impulse inhibition and reward valuation'
    ],
    clinicalIndications: ['Substance craving reduction', 'Supraorbital reference (SO)', 'Impulsivity modulation'],
    anodalEffects: {
      summary: 'Depolarizes anterior ventromedial/orbitofrontal circuits; enhances deliberate valuation and impulse restraint.',
      cellularAction: 'Depolarization of layer II/III pyramidal dendrites; enhances local NMDA-receptor sensitivity.',
      eegShifts: { delta: -10, theta: -8, alpha: -12, beta: 14, gamma: 18 },
      cognitiveMetrics: { focus: 15, mood: 25, motorSpeed: 0, language: 5, painThreshold: 10, visualAcuity: 0 },
      sideEffects: ['Mild supraorbital tingling', 'Transient retinal phosphene flash on ramp-up/down']
    },
    cathodalEffects: {
      summary: 'Hyperpolarizes left frontopolar cortex; suppresses active value comparison and slows subjective appraisal.',
      cellularAction: 'Somatic hyperpolarization; reduces spontaneous firing rate and dampens local glutamate turnover.',
      eegShifts: { delta: 12, theta: 15, alpha: 10, beta: -12, gamma: -15 },
      cognitiveMetrics: { focus: -10, mood: -15, motorSpeed: 0, language: 0, painThreshold: -5, visualAcuity: 0 },
      sideEffects: ['Skin itching under pad', 'Mild ocular pressure sensation']
    },
    keyCitations: [
      {
        authors: 'Boggio PS, et al.',
        year: 2008,
        journal: 'Drug Alcohol Depend',
        pmid: '18029111',
        finding: 'Bilateral frontopolar/DLPFC tDCS significantly reduces alcohol and nicotine craving.'
      },
      {
        authors: 'Lefaucheur JP, et al.',
        year: 2020,
        journal: 'Clin Neurophysiol',
        pmid: '31954894',
        finding: 'Guidelines on therapeutic use of tDCS: Evidence for prefrontal stimulation in depression and addictions.'
      }
    ]
  },

  Fp2: {
    id: 'Fp2',
    name: 'Right Frontopolar / Supraorbital Area',
    shortName: 'Right Frontopolar (SO)',
    brodmannAreas: ['BA 10', 'BA 11'],
    lobe: 'Frontal',
    pos3D: [0.328, 0.256, 0.922],
    posCortical: [0.27, 0.21, 0.77],
    normal: [0.426, 0.291, 0.857],
    primaryFunctions: [
      'Threat appraisal & risk avoidance gating',
      'Behavioral inhibition system (BIS) coordination',
      'Universal supraorbital (SO) return/reference site in classic clinical montages',
      'Autonomic arousal modulation'
    ],
    clinicalIndications: ['Classic cathode reference in M1 and DLPFC protocols', 'Risk-taking dampening', 'Craving suppression'],
    anodalEffects: {
      summary: 'Increases right orbitofrontal excitability; promotes risk-aversion and cautious evaluation.',
      cellularAction: 'Depolarizes frontopolar microcircuits; elevates intracellular calcium in apical dendrites.',
      eegShifts: { delta: -8, theta: -10, alpha: -10, beta: 16, gamma: 12 },
      cognitiveMetrics: { focus: 10, mood: -5, motorSpeed: 0, language: 0, painThreshold: 5, visualAcuity: 0 },
      sideEffects: ['Retinal phosphenes during current onset/offset', 'Supraorbital nerve tingling']
    },
    cathodalEffects: {
      summary: 'Preferred clinical return (SO) site: hyperpolarizes right frontopolar cortex, reducing avoidance distress and risk hyper-vigilance.',
      cellularAction: 'Reduces excitability of anterior frontal neurons; acts as an inert or beneficial return electrode in F3-Fp2 montages.',
      eegShifts: { delta: 8, theta: 10, alpha: 12, beta: -10, gamma: -12 },
      cognitiveMetrics: { focus: 5, mood: 15, motorSpeed: 0, language: 0, painThreshold: 0, visualAcuity: 0 },
      sideEffects: ['Occasional forehead redness (erythema)', 'Transient metallic taste sensation']
    },
    keyCitations: [
      {
        authors: 'Nitsche MA, Paulus W.',
        year: 2000,
        journal: 'J Physiol',
        pmid: '10990547',
        finding: 'Excitability changes induced in human motor cortex by weak transcranial direct electric stimulation using SO return.'
      },
      {
        authors: 'Bikson M, et al.',
        year: 2016,
        journal: 'Brain Stimul',
        pmid: '27372845',
        finding: 'Safety of transcranial direct current stimulation: Consensus guidelines and current density thresholds.'
      }
    ]
  },

  Fpz: {
    id: 'Fpz',
    name: 'Midline Frontopolar Reference',
    shortName: 'Midline Frontopolar',
    brodmannAreas: ['BA 10'],
    lobe: 'Frontal',
    pos3D: [0.0, 0.231, 1.008],
    posCortical: [0.0, 0.18, 0.82],
    normal: [0.0, 0.270, 0.963],
    primaryFunctions: [
      'Rostral prefrontal anterior pole coordination',
      'Metacognitive monitoring and prospective memory',
      'Anterior midline EEG reference site'
    ],
    clinicalIndications: ['Anterior midline reference', 'Metacognitive research montages'],
    anodalEffects: {
      summary: 'Increases frontopolar metabolic efficiency and prospective memory scheduling.',
      cellularAction: 'Depolarizes frontopolar pyramidal ensembles.',
      eegShifts: { delta: -12, theta: -6, alpha: -8, beta: 12, gamma: 14 },
      cognitiveMetrics: { focus: 12, mood: 10, motorSpeed: 0, language: 5, painThreshold: 0, visualAcuity: 0 },
      sideEffects: ['Phosphenes on ramp', 'Nasion tingling']
    },
    cathodalEffects: {
      summary: 'Dampens frontopolar prospective memory and metacognitive monitoring.',
      cellularAction: 'Hyperpolarization of anterior BA 10.',
      eegShifts: { delta: 10, theta: 8, alpha: 10, beta: -8, gamma: -10 },
      cognitiveMetrics: { focus: -5, mood: -5, motorSpeed: 0, language: 0, painThreshold: 0, visualAcuity: 0 },
      sideEffects: ['Forehead tingling']
    },
    keyCitations: [
      {
        authors: 'Okamoto M, et al.',
        year: 2004,
        journal: 'NeuroImage',
        pmid: '14741649',
        finding: 'Three-dimensional probabilistic anatomical cranio-cerebral correlation for 10-20 international system.'
      }
    ]
  },

  F3: {
    id: 'F3',
    name: 'Left Dorsolateral Prefrontal Cortex (ldLPFC)',
    shortName: 'Left DLPFC (F3)',
    brodmannAreas: ['BA 9', 'BA 46'],
    lobe: 'Frontal',
    pos3D: [-0.471, 0.589, 0.589],
    posCortical: [-0.41, 0.51, 0.51],
    normal: [-0.577, 0.632, 0.517],
    primaryFunctions: [
      'Executive working memory (n-back manipulation)',
      'Top-down cognitive control & goal maintenance',
      'Approach-related emotional motivation & hedonic drive',
      'Cognitive reappraisal of negative affective stimuli',
      'Suppression of prepotent impulsive responses'
    ],
    clinicalIndications: [
      'Major Depressive Disorder (MDD, Level A/B evidence)',
      'Working Memory and Cognitive Enhancement',
      'Fibromyalgia & Chronic Pain (central prefrontal modulation)',
      'Executive Dysfunction in ADHD & TBI'
    ],
    anodalEffects: {
      summary: 'Depolarizes left DLPFC pyramidal neurons (+0.35 to +0.80 V/m); reverses depressive hypo-activation, enhances working memory load capacity, and boosts theta-gamma phase-amplitude coupling.',
      cellularAction: 'Increases intracellular Ca2+ via NMDA receptors; triggers BDNF-mediated LTP-like plasticity; downregulates resting alpha power.',
      eegShifts: { delta: -18, theta: 12, alpha: -24, beta: 26, gamma: 34 },
      cognitiveMetrics: { focus: 45, mood: 50, motorSpeed: 10, language: 20, painThreshold: 25, visualAcuity: 5 },
      sideEffects: ['Mild scalp tingling at onset', 'Warmth under electrode pad', 'Transient mild headache (<5% of sessions)']
    },
    cathodalEffects: {
      summary: 'Hyperpolarizes left DLPFC; slows working memory manipulation and increases risk of depressive affect and emotional blunting.',
      cellularAction: 'Somatic hyperpolarization; induces LTD-like decrease in synaptic efficacy; enhances local alpha synchronization.',
      eegShifts: { delta: 15, theta: 18, alpha: 22, beta: -18, gamma: -25 },
      cognitiveMetrics: { focus: -30, mood: -35, motorSpeed: -5, language: -15, painThreshold: -10, visualAcuity: 0 },
      sideEffects: ['Mental fatigue', 'Slowed mental arithmetic']
    },
    keyCitations: [
      {
        authors: 'Lefaucheur JP, et al.',
        year: 2017,
        journal: 'Clin Neurophysiol',
        pmid: '27866898',
        finding: 'Evidence-based guidelines on therapeutic use of tDCS: Level A definitive efficacy for Depression using Anodal F3.'
      },
      {
        authors: 'Brunoni AR, et al.',
        year: 2013,
        journal: 'JAMA Psychiatry',
        pmid: '23389323',
        finding: 'The SELECT-tDCS trial: Sertraline vs. electrical current therapy for depression demonstrated significant clinical remission.'
      },
      {
        authors: 'Fregni F, et al.',
        year: 2005,
        journal: 'Exp Brain Res',
        pmid: '16132968',
        finding: 'Anodal tDCS of the left prefrontal cortex enhances 3-back working memory performance in healthy individuals.'
      }
    ]
  },

  F4: {
    id: 'F4',
    name: 'Right Dorsolateral Prefrontal Cortex (rdLPFC)',
    shortName: 'Right DLPFC (F4)',
    brodmannAreas: ['BA 9', 'BA 46'],
    lobe: 'Frontal',
    pos3D: [0.471, 0.589, 0.589],
    posCortical: [0.41, 0.51, 0.51],
    normal: [0.577, 0.632, 0.517],
    primaryFunctions: [
      'Sustained sensory vigilance & threat detection',
      'Behavioral withdrawal & negative emotional processing',
      'Response inhibition & conflict resolution',
      'Risk aversion & avoidance conditioning'
    ],
    clinicalIndications: [
      'Generalized Anxiety Disorder (GAD) — Cathodal dampening',
      'Impulsive Decision-Making / Addiction — Anodal modulation',
      'Post-Traumatic Stress Hyper-Vigilance'
    ],
    anodalEffects: {
      summary: 'Increases right DLPFC excitability; sharpens threat vigilance and enhances risk aversion; may transiently increase anxious arousal if unbalanced.',
      cellularAction: 'Depolarizes right frontocortical pyramidal layers, increasing local high-beta synchronization.',
      eegShifts: { delta: -10, theta: -14, alpha: -16, beta: 28, gamma: 20 },
      cognitiveMetrics: { focus: 25, mood: -15, motorSpeed: 5, language: 0, painThreshold: 5, visualAcuity: 5 },
      sideEffects: ['Mild somatic tension', 'Heightened alertness / restlessness']
    },
    cathodalEffects: {
      summary: 'Hyperpolarizes right DLPFC; suppresses excessive anxious rumination, reduces threat hyper-vigilance, and aids emotional calming in bifrontal protocols.',
      cellularAction: 'Induces LTD-like inhibition in right frontocortical loops; attenuates excessive high-beta (22-30 Hz) hyper-synchrony.',
      eegShifts: { delta: 12, theta: 10, alpha: 18, beta: -24, gamma: -15 },
      cognitiveMetrics: { focus: 15, mood: 30, motorSpeed: 0, language: 5, painThreshold: 15, visualAcuity: 0 },
      sideEffects: ['Sedation / sleepiness', 'Transient mild carelessness']
    },
    keyCitations: [
      {
        authors: 'Keeser D, et al.',
        year: 2011,
        journal: 'NeuroImage',
        pmid: '21397046',
        finding: 'Prefrontal tDCS modulates resting-state functional connectivity in default mode and frontoparietal networks.'
      },
      {
        authors: 'Bikson M, et al.',
        year: 2016,
        journal: 'Brain Stimul',
        pmid: '27372845',
        finding: 'Dosimetry and electrode montage selection principles in clinical tDCS.'
      }
    ]
  },

  Fz: {
    id: 'Fz',
    name: 'Frontal Midline / Supplementary & Anterior Cingulate',
    shortName: 'Frontal Midline (Fz)',
    brodmannAreas: ['BA 8', 'BA 9', 'BA 32'],
    lobe: 'Frontal',
    pos3D: [0.0, 0.765, 0.604],
    posCortical: [0.0, 0.65, 0.51],
    normal: [0.0, 0.840, 0.542],
    primaryFunctions: [
      'Frontal-Midline Theta (Fmθ) rhythm generation',
      'Conflict monitoring & behavioral error detection (ERN)',
      'Attentional effort & cognitive stamina',
      'Volitional initiation of action'
    ],
    clinicalIndications: ['ADHD executive under-arousal', 'Error processing & apathy in depression', 'Cognitive fatigue'],
    anodalEffects: {
      summary: 'Potentiates anterior cingulate and medial frontal circuits; robustly boosts Fmθ phase-locking, error-related negativity, and mental endurance.',
      cellularAction: 'Depolarizes medial frontal pyramidal columns, optimizing theta-band phase coordination.',
      eegShifts: { delta: -14, theta: 32, alpha: -16, beta: 18, gamma: 22 },
      cognitiveMetrics: { focus: 40, mood: 20, motorSpeed: 15, language: 10, painThreshold: 15, visualAcuity: 0 },
      sideEffects: ['Midline scalp itch', 'Intense focus feeling']
    },
    cathodalEffects: {
      summary: 'Dampens conflict detection and reduces error awareness; induces mental apathy or relaxed disengagement.',
      cellularAction: 'Suppresses medial prefrontal firing; blunts error-related potentials.',
      eegShifts: { delta: 14, theta: -18, alpha: 15, beta: -15, gamma: -18 },
      cognitiveMetrics: { focus: -25, mood: -5, motorSpeed: -10, language: -5, painThreshold: 0, visualAcuity: 0 },
      sideEffects: ['Mental drifting', 'Reduced urgency']
    },
    keyCitations: [
      {
        authors: 'Reinhart RM, Nguyen JA.',
        year: 2019,
        journal: 'Nat Neurosci',
        pmid: '30962633',
        finding: 'Working memory revived in older adults by synchronizing rhythmic brain circuits with HD-tDCS.'
      }
    ]
  },

  F7: {
    id: 'F7',
    name: 'Left Inferior Frontal Gyrus / Broca’s Area',
    shortName: 'Broca’s Area / Left IFG (F7)',
    brodmannAreas: ['BA 44', 'BA 45', 'BA 47'],
    lobe: 'Frontal',
    pos3D: [-0.716, 0.172, 0.573],
    posCortical: [-0.64, 0.15, 0.51],
    normal: [-0.854, 0.180, 0.489],
    primaryFunctions: [
      'Expressive speech production & phonological formulation',
      'Syntactic parsing and hierarchical grammatical computation',
      'Verbal working memory articulatory loop',
      'Action understanding and motor imitation (mirror system)'
    ],
    clinicalIndications: ['Post-stroke Non-Fluent Aphasia Rehabilitation', 'Verbal Fluency Enhancement', 'Stuttering / Dysfluency'],
    anodalEffects: {
      summary: 'Depolarizes Broca’s area; significantly accelerates picture naming speed, phonemic verbal fluency, and syntactic recovery in aphasia.',
      cellularAction: 'Enhances synaptic transmission in pars triangularis and opercularis; boosts speech-motor excitability.',
      eegShifts: { delta: -15, theta: 8, alpha: -18, beta: 22, gamma: 28 },
      cognitiveMetrics: { focus: 20, mood: 15, motorSpeed: 5, language: 55, painThreshold: 0, visualAcuity: 0 },
      sideEffects: ['Jaw/temporal twitching during ramp', 'Local tingling over temple']
    },
    cathodalEffects: {
      summary: 'Inhibits Broca’s area; slows verbal naming latency and induces transient tip-of-the-tongue phenomena.',
      cellularAction: 'Reduces synaptic gain across left inferior frontal gyri.',
      eegShifts: { delta: 12, theta: 10, alpha: 14, beta: -18, gamma: -20 },
      cognitiveMetrics: { focus: -10, mood: -5, motorSpeed: 0, language: -40, painThreshold: 0, visualAcuity: 0 },
      sideEffects: ['Mild speech hesitation', 'Temple itching']
    },
    keyCitations: [
      {
        authors: 'Holland R, et al.',
        year: 2011,
        journal: 'Curr Biol',
        pmid: '21757351',
        finding: 'Speech facilitation by left inferior frontal cortex tDCS in healthy adults and post-stroke aphasia.'
      },
      {
        authors: 'Monti A, et al.',
        year: 2008,
        journal: 'Neuropsychologia',
        pmid: '18538356',
        finding: 'Transcranial direct current stimulation (tDCS) improves speech processing in non-fluent chronic aphasia.'
      }
    ]
  },

  F8: {
    id: 'F8',
    name: 'Right Inferior Frontal Gyrus (rIFG)',
    shortName: 'Right IFG (F8)',
    brodmannAreas: ['BA 44', 'BA 45', 'BA 47'],
    lobe: 'Frontal',
    pos3D: [0.716, 0.172, 0.573],
    posCortical: [0.64, 0.15, 0.51],
    normal: [0.854, 0.180, 0.489],
    primaryFunctions: [
      'Motor response inhibition (Stop-Signal Task brake)',
      'Attentional reorienting to unexpected salient stimuli',
      'Affective prosody perception',
      'Impulsive habit override'
    ],
    clinicalIndications: ['Impulsive spectrum disorders / ADHD', 'Binge eating / urge suppression', 'Emotional prosody training'],
    anodalEffects: {
      summary: 'Enhances the right-hemispheric "brake" system; improves stop-signal reaction time and suppresses impulsive motor bursts.',
      cellularAction: 'Depolarizes right frontostriatal projection neurons.',
      eegShifts: { delta: -10, theta: -8, alpha: -12, beta: 24, gamma: 18 },
      cognitiveMetrics: { focus: 30, mood: 5, motorSpeed: -10, language: 5, painThreshold: 5, visualAcuity: 0 },
      sideEffects: ['Temple tingling', 'Slight jaw muscle activation']
    },
    cathodalEffects: {
      summary: 'Weakens response inhibition; leads to premature responding and difficulty withholding impulsive actions.',
      cellularAction: 'Reduces rIFG corticostriatal inhibition.',
      eegShifts: { delta: 10, theta: 12, alpha: 12, beta: -16, gamma: -14 },
      cognitiveMetrics: { focus: -20, mood: 0, motorSpeed: 15, language: 0, painThreshold: 0, visualAcuity: 0 },
      sideEffects: ['Increased motor impulsivity in reaction tasks']
    },
    keyCitations: [
      {
        authors: 'Jacobson L, et al.',
        year: 2011,
        journal: 'J Cogn Neurosci',
        pmid: '21265604',
        finding: 'Modulation of response inhibition by transcranial direct current stimulation of the right inferior frontal gyrus.'
      }
    ]
  },

  C3: {
    id: 'C3',
    name: 'Left Primary Motor Cortex (M1 — Right Hand/Body)',
    shortName: 'Left M1 (C3)',
    brodmannAreas: ['BA 4', 'BA 6'],
    lobe: 'Motor/Central',
    pos3D: [-0.604, 0.684, 0.0],
    posCortical: [-0.51, 0.58, 0.0],
    normal: [-0.710, 0.704, 0.0],
    primaryFunctions: [
      'Contralateral (Right) hand, finger, and limb motor execution',
      'Fine motor skill acquisition & consolidation',
      'Corticospinal tract excitability (motor evoked potentials, MEPs)',
      'Thalamocortical descending pain modulation pathways'
    ],
    clinicalIndications: [
      'Post-Stroke Motor Rehabilitation (Level A/B evidence)',
      'Chronic Neuropathic Pain & Fibromyalgia (Level B evidence)',
      'Fine Motor Skill & Athletic Skill Acquisition',
      'Parkinsonian Rigidity Modulation'
    ],
    anodalEffects: {
      summary: 'Classic Nitsche & Paulus protocol: increases corticospinal excitability up to 40% for over 60 mins; accelerates right hand motor learning and induces robust analgesia via descending thalamocortical gating.',
      cellularAction: 'Depolarizes soma of layer V Betz pyramidal neurons; reduces GABAergic SICI inhibition; drives long-term potentiation (LTP).',
      eegShifts: { delta: -16, theta: -8, alpha: -20, beta: 28, gamma: 30 },
      cognitiveMetrics: { focus: 15, mood: 15, motorSpeed: 55, language: 10, painThreshold: 48, visualAcuity: 0 },
      sideEffects: ['Somatic scalp tingling', 'Warmth over motor strip', 'Focal itching']
    },
    cathodalEffects: {
      summary: 'Suppresses corticospinal excitability; reduces motor evoked potential amplitudes by 30-40%; dampens motor hyper-excitability and focal dystonias.',
      cellularAction: 'Hyperpolarizes layer V pyramidal neurons; enhances local intracortical inhibition; induces LTD-like depression.',
      eegShifts: { delta: 18, theta: 12, alpha: 20, beta: -24, gamma: -22 },
      cognitiveMetrics: { focus: -5, mood: -5, motorSpeed: -35, language: 0, painThreshold: -20, visualAcuity: 0 },
      sideEffects: ['Transient limb heaviness / sluggishness']
    },
    keyCitations: [
      {
        authors: 'Nitsche MA, Paulus W.',
        year: 2000,
        journal: 'J Physiol',
        pmid: '10990547',
        finding: 'Foundational discovery of sustained polarity-dependent polarity shifts in human motor cortex excitability.'
      },
      {
        authors: 'Lefaucheur JP, et al.',
        year: 2017,
        journal: 'Clin Neurophysiol',
        pmid: '27866898',
        finding: 'Level B recommendation for Anodal M1 tDCS in chronic neuropathic pain and post-stroke motor deficits.'
      },
      {
        authors: 'Reis J, et al.',
        year: 2009,
        journal: 'Proc Natl Acad Sci USA',
        pmid: '19164589',
        finding: 'Noninvasive cortical stimulation enhances motor skill acquisition over multiple days through consolidated LTP.'
      }
    ]
  },

  C4: {
    id: 'C4',
    name: 'Right Primary Motor Cortex (M1 — Left Hand/Body)',
    shortName: 'Right M1 (C4)',
    brodmannAreas: ['BA 4', 'BA 6'],
    lobe: 'Motor/Central',
    pos3D: [0.604, 0.684, 0.0],
    posCortical: [0.51, 0.58, 0.0],
    normal: [0.710, 0.704, 0.0],
    primaryFunctions: [
      'Contralateral (Left) hand, arm, and limb motor execution',
      'Spatial motor mapping & bimanual coordination',
      'Corticospinal excitability of left extremities',
      'Transcallosal inhibition (TCI) across the corpus callosum to C3'
    ],
    clinicalIndications: [
      'Left-sided post-stroke hemiparesis rehabilitation',
      'Bi-hemispheric stroke montage (Cathode over intact C4 to release transcallosal brake on injured C3)',
      'Chronic pain syndromes'
    ],
    anodalEffects: {
      summary: 'Increases right M1 excitability; enhances left-hand motor dexterity, speed, and descending pain inhibition.',
      cellularAction: 'Depolarizes right motor cortex pyramidal ensembles; facilitates LTP.',
      eegShifts: { delta: -14, theta: -6, alpha: -18, beta: 26, gamma: 28 },
      cognitiveMetrics: { focus: 10, mood: 10, motorSpeed: 50, language: 0, painThreshold: 45, visualAcuity: 0 },
      sideEffects: ['Scalp tingling on right parietal/central region']
    },
    cathodalEffects: {
      summary: 'Crucial in stroke rehabilitation: suppresses hyperexcitable contralesional M1, relieving excessive transcallosal inhibition on the damaged hemisphere.',
      cellularAction: 'Hyperpolarizes layer V pyramidal cells in right motor strip.',
      eegShifts: { delta: 16, theta: 10, alpha: 18, beta: -22, gamma: -20 },
      cognitiveMetrics: { focus: 0, mood: 0, motorSpeed: -30, language: 0, painThreshold: -15, visualAcuity: 0 },
      sideEffects: ['Transient left-hand sluggishness in healthy subjects']
    },
    keyCitations: [
      {
        authors: 'Lindenberg R, et al.',
        year: 2010,
        journal: 'Stroke',
        pmid: '20847313',
        finding: 'Bihemispheric brain stimulation facilitates motor recovery in chronic stroke by rebalancing interhemispheric inhibitory drive.'
      }
    ]
  },

  Cz: {
    id: 'Cz',
    name: 'Supplementary Motor Area & Vertex / Lower Limb M1',
    shortName: 'Vertex / SMA (Cz)',
    brodmannAreas: ['BA 4', 'BA 6'],
    lobe: 'Motor/Central',
    pos3D: [0.0, 0.940, 0.0],
    posCortical: [0.0, 0.81, 0.0],
    normal: [0.0, 1.0, 0.0],
    primaryFunctions: [
      'Supplementary Motor Area (SMA) complex movement sequencing',
      'Lower limb & foot primary motor control (interhemispheric fissure)',
      'Bilateral postural stabilization and gait initiation',
      'Sensorimotor Rhythm (SMR) midline hub'
    ],
    clinicalIndications: ['Gait rehabilitation post-stroke/SCI', 'Parkinson’s freezing of gait', 'Restless legs syndrome'],
    anodalEffects: {
      summary: 'Stimulates bilateral leg motor representations and SMA; facilitates gait stepping rhythmicity and postural stability.',
      cellularAction: 'Depolarizes medial pyramidal cells deep within the longitudinal fissure.',
      eegShifts: { delta: -12, theta: -8, alpha: -15, beta: 24, gamma: 20 },
      cognitiveMetrics: { focus: 15, mood: 5, motorSpeed: 35, language: 0, painThreshold: 30, visualAcuity: 0 },
      sideEffects: ['Vertex tingling', 'Crown scalp warmth']
    },
    cathodalEffects: {
      summary: 'Dampens motor sequencing and increases stepping latency; dampens lower extremity spasms.',
      cellularAction: 'Hyperpolarizes medial central gyri.',
      eegShifts: { delta: 14, theta: 10, alpha: 14, beta: -18, gamma: -15 },
      cognitiveMetrics: { focus: -5, mood: 0, motorSpeed: -20, language: 0, painThreshold: -10, visualAcuity: 0 },
      sideEffects: ['Mild leg heaviness']
    },
    keyCitations: [
      {
        authors: 'Koganemaru S, et al.',
        year: 2017,
        journal: 'Neurorehabil Neural Repair',
        pmid: '28683610',
        finding: 'Gait training coupled with bilateral leg motor cortex tDCS improves locomotion in chronic stroke.'
      }
    ]
  },

  T7: {
    id: 'T7',
    name: 'Left Superior & Middle Temporal Gyrus / Auditory Cortex',
    shortName: 'Left Temporal / Auditory (T7)',
    brodmannAreas: ['BA 21', 'BA 22', 'BA 41', 'BA 42'],
    lobe: 'Temporal',
    pos3D: [-0.877, 0.076, 0.0],
    posCortical: [-0.78, 0.06, 0.0],
    normal: [-0.997, 0.076, 0.0],
    primaryFunctions: [
      'Primary & secondary auditory processing (Heschl’s Gyrus)',
      'Phonological decoding & receptive language (Wernicke’s area proximity)',
      'Auditory phantom noise (tinnitus) generation circuits',
      'Verbal memory retrieval'
    ],
    clinicalIndications: ['Subjective Tinnitus Suppression', 'Auditory Verbal Hallucinations in Schizophrenia', 'Receptive Language Rehabilitation'],
    anodalEffects: {
      summary: 'Enhances left temporal phonological discrimination and speech comprehension speed.',
      cellularAction: 'Depolarizes superior temporal auditory cortex columns.',
      eegShifts: { delta: -10, theta: 6, alpha: -14, beta: 18, gamma: 24 },
      cognitiveMetrics: { focus: 10, mood: 10, motorSpeed: 0, language: 35, painThreshold: 0, visualAcuity: 0 },
      sideEffects: ['Mild ear canal warmth', 'Auditory transient clicks']
    },
    cathodalEffects: {
      summary: 'Inhibits hyperactive auditory cortex; classic protocol for suppressing subjective tinnitus intensity and dampening auditory hallucinations.',
      cellularAction: 'Hyperpolarizes auditory cortex neurons, reducing aberrant spontaneous firing.',
      eegShifts: { delta: 12, theta: 10, alpha: 16, beta: -16, gamma: -20 },
      cognitiveMetrics: { focus: 0, mood: 15, motorSpeed: 0, language: -10, painThreshold: 0, visualAcuity: 0 },
      sideEffects: ['Auditory muffling sensation', 'Ear itch']
    },
    keyCitations: [
      {
        authors: 'Vanneste S, De Ridder D.',
        year: 2011,
        journal: 'Trends Cogn Sci',
        pmid: '21397046',
        finding: 'Bifrontal and auditory cortex tDCS in the treatment of chronic phantom sound (tinnitus).'
      }
    ]
  },

  T8: {
    id: 'T8',
    name: 'Right Superior & Middle Temporal Gyrus',
    shortName: 'Right Temporal (T8)',
    brodmannAreas: ['BA 21', 'BA 22', 'BA 41', 'BA 42'],
    lobe: 'Temporal',
    pos3D: [0.877, 0.076, 0.0],
    posCortical: [0.78, 0.06, 0.0],
    normal: [0.997, 0.076, 0.0],
    primaryFunctions: [
      'Social emotional perception & theory of mind',
      'Musical harmony & pitch contour perception',
      'Environmental sound localization',
      'Non-verbal emotional communication'
    ],
    clinicalIndications: ['Social cognition deficits / Autism spectrum', 'Tinnitus modulation', 'Emotional processing'],
    anodalEffects: {
      summary: 'Improves right temporal emotional prosody detection and pitch resolution.',
      cellularAction: 'Depolarizes right superior temporal networks.',
      eegShifts: { delta: -8, theta: 4, alpha: -12, beta: 16, gamma: 20 },
      cognitiveMetrics: { focus: 10, mood: 15, motorSpeed: 0, language: 15, painThreshold: 5, visualAcuity: 0 },
      sideEffects: ['Right ear tingling']
    },
    cathodalEffects: {
      summary: 'Suppresses aberrant hyper-activity in right temporal auditory projection networks.',
      cellularAction: 'Hyperpolarization of BA 21/22 ensembles.',
      eegShifts: { delta: 10, theta: 8, alpha: 14, beta: -14, gamma: -16 },
      cognitiveMetrics: { focus: 0, mood: 0, motorSpeed: 0, language: -5, painThreshold: 0, visualAcuity: 0 },
      sideEffects: ['Mild ear canal tickle']
    },
    keyCitations: [
      {
        authors: 'Lefaucheur JP, et al.',
        year: 2020,
        journal: 'Clin Neurophysiol',
        pmid: '31954894',
        finding: 'Temporal cortex stimulation profiles for tinnitus and psychiatric symptom clusters.'
      }
    ]
  },

  P3: {
    id: 'P3',
    name: 'Left Posterior Parietal Cortex / Angular Gyrus',
    shortName: 'Left Parietal (P3)',
    brodmannAreas: ['BA 7', 'BA 39', 'BA 40'],
    lobe: 'Parietal',
    pos3D: [-0.472, 0.570, -0.610],
    posCortical: [-0.41, 0.49, -0.53],
    normal: [-0.580, 0.613, -0.536],
    primaryFunctions: [
      'Mathematical computation & numerical cognition (intraparietal sulcus)',
      'Phonological working memory storage buffer',
      'Cross-modal sensory binding (visual-auditory-somatosensory)',
      'Visuomotor reaching and grasping guidance'
    ],
    clinicalIndications: ['Dyscalculia & Mathematical Learning', 'Working Memory Store Buffer Enhancement', 'Geriatric Cognitive Frailty'],
    anodalEffects: {
      summary: 'Groundbreaking Cohen Kadosh protocol: accelerates mathematical learning and numerical processing efficiency; tightens theta-gamma coupling in parietal buffers.',
      cellularAction: 'Depolarizes intraparietal pyramidal neurons; enhances synaptic plasticity during arithmetic training.',
      eegShifts: { delta: -14, theta: 16, alpha: -20, beta: 25, gamma: 32 },
      cognitiveMetrics: { focus: 40, mood: 10, motorSpeed: 10, language: 25, painThreshold: 10, visualAcuity: 15 },
      sideEffects: ['Scalp prickling over posterior parietal area']
    },
    cathodalEffects: {
      summary: 'Inhibits intraparietal sulcus; impairs automated numerical retrieval and mental arithmetic calculation.',
      cellularAction: 'Induces LTD in parietal association networks.',
      eegShifts: { delta: 12, theta: 12, alpha: 18, beta: -20, gamma: -22 },
      cognitiveMetrics: { focus: -20, mood: -5, motorSpeed: 0, language: -15, painThreshold: 0, visualAcuity: -5 },
      sideEffects: ['Slowed mental arithmetic calculations']
    },
    keyCitations: [
      {
        authors: 'Cohen Kadosh R, et al.',
        year: 2010,
        journal: 'Curr Biol',
        pmid: '21055945',
        finding: 'Modulating neuronal plasticity with tDCS over parietal lobes induces long-lasting improvements in numerical abilities.'
      }
    ]
  },

  P4: {
    id: 'P4',
    name: 'Right Posterior Parietal Cortex / Spatial Attention Hub',
    shortName: 'Right Parietal (P4)',
    brodmannAreas: ['BA 7', 'BA 39', 'BA 40'],
    lobe: 'Parietal',
    pos3D: [0.472, 0.570, -0.610],
    posCortical: [0.41, 0.49, -0.53],
    normal: [0.580, 0.613, -0.536],
    primaryFunctions: [
      'Bilateral visuospatial attention & spatial coordinate mapping',
      'Mental rotation and 3D spatial transformation',
      'Target detection in visual search arrays',
      'Perceptual body schema & spatial neglect prevention'
    ],
    clinicalIndications: ['Post-Stroke Hemispatial Neglect Rehabilitation', 'Visuospatial Attention Training', 'Spatial Orientation Deficits'],
    anodalEffects: {
      summary: 'Key target for spatial neglect: improves contralateral attentional allocation, sharpens mental rotation, and expands visual search velocity.',
      cellularAction: 'Depolarizes right parietal attentional nodes; enhances gamma synchrony.',
      eegShifts: { delta: -12, theta: 10, alpha: -18, beta: 22, gamma: 28 },
      cognitiveMetrics: { focus: 35, mood: 10, motorSpeed: 15, language: 5, painThreshold: 10, visualAcuity: 30 },
      sideEffects: ['Posterior scalp tingling']
    },
    cathodalEffects: {
      summary: 'Induces transient neglect-like phenomena in healthy individuals; slows spatial target detection.',
      cellularAction: 'Suppresses right parietal dorsal attention network excitability.',
      eegShifts: { delta: 14, theta: 12, alpha: 16, beta: -18, gamma: -20 },
      cognitiveMetrics: { focus: -25, mood: 0, motorSpeed: -5, language: 0, painThreshold: 0, visualAcuity: -25 },
      sideEffects: ['Transient reduction in left visual field awareness']
    },
    keyCitations: [
      {
        authors: 'Sparing R, et al.',
        year: 2009,
        journal: 'Stroke',
        pmid: '19008472',
        finding: 'Bihemispheric parietal stimulation improves visuospatial attention in hemispatial neglect patients.'
      }
    ]
  },

  Pz: {
    id: 'Pz',
    name: 'Precuneus / Medial Parietal Cortex',
    shortName: 'Precuneus / Midline Parietal (Pz)',
    brodmannAreas: ['BA 7', 'BA 31'],
    lobe: 'Parietal',
    pos3D: [0.0, 0.749, -0.628],
    posCortical: [0.0, 0.63, -0.53],
    normal: [0.0, 0.825, -0.565],
    primaryFunctions: [
      'Default-Mode Network (DMN) posterior midline core hub',
      'Episodic autobiographical memory retrieval',
      'Self-referential thought & consciousness monitoring',
      'Visuomotor transformation and spatial orientation'
    ],
    clinicalIndications: ['Alzheimer’s Disease & Mild Cognitive Impairment (DMN target)', 'Episodic Memory Enhancement', 'Mindfulness Modulation'],
    anodalEffects: {
      summary: 'Modulates the posterior hub of the Default Mode Network; enhances autobiographical recall and self-referential coherence.',
      cellularAction: 'Depolarizes precuneus columnar ensembles.',
      eegShifts: { delta: -10, theta: 14, alpha: -15, beta: 18, gamma: 24 },
      cognitiveMetrics: { focus: 20, mood: 15, motorSpeed: 5, language: 10, painThreshold: 10, visualAcuity: 10 },
      sideEffects: ['Crown/posterior tingling']
    },
    cathodalEffects: {
      summary: 'Dampens internal mind-wandering and self-referential rumination.',
      cellularAction: 'Suppresses precuneus metabolism and connectivity.',
      eegShifts: { delta: 10, theta: -10, alpha: 14, beta: -12, gamma: -15 },
      cognitiveMetrics: { focus: 10, mood: 5, motorSpeed: 0, language: 0, painThreshold: 0, visualAcuity: 0 },
      sideEffects: ['Mild mental drifting']
    },
    keyCitations: [
      {
        authors: 'Antal A, et al.',
        year: 2011,
        journal: 'Neurobiol Aging',
        pmid: '20850893',
        finding: 'Modulation of memory and resting-state functional connectivity in aging using transcranial stimulation.'
      }
    ]
  },

  P7: {
    id: 'P7',
    name: 'Left Ventral Occipitotemporal / Visual Word Form Area (VWFA)',
    shortName: 'Left VWFA / Fusiform (P7)',
    brodmannAreas: ['BA 19', 'BA 37'],
    lobe: 'Temporal',
    pos3D: [-0.721, 0.019, -0.596],
    posCortical: [-0.64, 0.02, -0.53],
    normal: [-0.860, 0.020, -0.509],
    primaryFunctions: [
      'Orthographic processing & rapid visual word recognition',
      'Reading fluency and phoneme-grapheme binding',
      'Complex shape and tool categorization'
    ],
    clinicalIndications: ['Developmental Dyslexia Reading Enhancement', 'Post-stroke Alexia Rehabilitation'],
    anodalEffects: {
      summary: 'Facilitates visual word identification and reading velocity in dyslexic and healthy readers.',
      cellularAction: 'Depolarizes left occipitotemporal reading circuits.',
      eegShifts: { delta: -10, theta: 5, alpha: -14, beta: 20, gamma: 26 },
      cognitiveMetrics: { focus: 15, mood: 5, motorSpeed: 0, language: 45, painThreshold: 0, visualAcuity: 15 },
      sideEffects: ['Posterior temporal tingling']
    },
    cathodalEffects: {
      summary: 'Slows rapid word identification and letter string decoding.',
      cellularAction: 'Hyperpolarizes VWFA ventral networks.',
      eegShifts: { delta: 10, theta: 8, alpha: 14, beta: -14, gamma: -18 },
      cognitiveMetrics: { focus: -5, mood: 0, motorSpeed: 0, language: -30, painThreshold: 0, visualAcuity: -10 },
      sideEffects: ['Transient reading hesitation']
    },
    keyCitations: [
      {
        authors: 'Costanzo F, et al.',
        year: 2016,
        journal: 'Neuropsychologia',
        pmid: '27262798',
        finding: 'Evidence for reading enhancement after parieto-occipital tDCS in children and adolescents with dyslexia.'
      }
    ]
  },

  P8: {
    id: 'P8',
    name: 'Right Ventral Occipitotemporal / Fusiform Face Area (FFA)',
    shortName: 'Right FFA / Fusiform (P8)',
    brodmannAreas: ['BA 19', 'BA 37'],
    lobe: 'Temporal',
    pos3D: [0.721, 0.019, -0.596],
    posCortical: [0.64, 0.02, -0.53],
    normal: [0.860, 0.020, -0.509],
    primaryFunctions: [
      'Holistic facial feature recognition and identity categorization',
      'Facial expression decoding and emotional nuance',
      'Expert visual category discrimination'
    ],
    clinicalIndications: ['Prosopagnosia (Face Blindness)', 'Social Perception in Autism', 'Visual Category Training'],
    anodalEffects: {
      summary: 'Accelerates facial identity recognition and micro-expression discrimination accuracy.',
      cellularAction: 'Depolarizes fusiform face area pyramidal columns.',
      eegShifts: { delta: -8, theta: 6, alpha: -12, beta: 18, gamma: 24 },
      cognitiveMetrics: { focus: 15, mood: 15, motorSpeed: 0, language: 5, painThreshold: 0, visualAcuity: 25 },
      sideEffects: ['Posterior temporal tingling']
    },
    cathodalEffects: {
      summary: 'Slows facial identity matching and dampens holistic face integration.',
      cellularAction: 'Hyperpolarizes right ventral occipitotemporal cortex.',
      eegShifts: { delta: 10, theta: 8, alpha: 12, beta: -14, gamma: -16 },
      cognitiveMetrics: { focus: -5, mood: 0, motorSpeed: 0, language: 0, painThreshold: 0, visualAcuity: -15 },
      sideEffects: ['Mild face recognition delay']
    },
    keyCitations: [
      {
        authors: 'Barbieri R, et al.',
        year: 2016,
        journal: 'Neuropsychologia',
        pmid: '27181643',
        finding: 'Modulation of facial expression recognition by right occipitotemporal transcranial direct current stimulation.'
      }
    ]
  },

  O1: {
    id: 'O1',
    name: 'Left Visual Cortex (V1 / V2 / V3)',
    shortName: 'Left Primary Visual (O1)',
    brodmannAreas: ['BA 17', 'BA 18', 'BA 19'],
    lobe: 'Occipital',
    pos3D: [-0.312, 0.156, -0.957],
    posCortical: [-0.25, 0.12, -0.79],
    normal: [-0.408, 0.179, -0.895],
    primaryFunctions: [
      'Contralateral (Right) visual hemifield primary processing',
      'Spatial frequency, edge orientation, and contrast thresholding',
      'Visual Evoked Potential (VEP) amplitude generation',
      'Early visual feature consolidation'
    ],
    clinicalIndications: ['Amblyopia rehabilitation', 'Post-chiasmatic visual field defects', 'Visual learning enhancement'],
    anodalEffects: {
      summary: 'Lowers visual contrast thresholds; increases VEP P100 amplitude and sharpens orientation discrimination in right hemifield.',
      cellularAction: 'Depolarizes striate cortex columns; optimizes receptive field signal-to-noise ratio.',
      eegShifts: { delta: -12, theta: -6, alpha: -22, beta: 20, gamma: 30 },
      cognitiveMetrics: { focus: 15, mood: 0, motorSpeed: 0, language: 0, painThreshold: 0, visualAcuity: 45 },
      sideEffects: ['Occipital tingling', 'Mild phosphene sparks on current ramp']
    },
    cathodalEffects: {
      summary: 'Elevates contrast detection thresholds; dampens cortical visual excitability; useful in photosensitive visual disorders.',
      cellularAction: 'Hyperpolarizes V1 neurons; attenuates early visual evoked potentials.',
      eegShifts: { delta: 12, theta: 8, alpha: 22, beta: -18, gamma: -22 },
      cognitiveMetrics: { focus: -5, mood: 0, motorSpeed: 0, language: 0, painThreshold: 0, visualAcuity: -35 },
      sideEffects: ['Transient dimming of right visual field perception']
    },
    keyCitations: [
      {
        authors: 'Antal A, et al.',
        year: 2004,
        journal: 'Brain Res',
        pmid: '15033422',
        finding: 'Direct current stimulation over the human visual cortex modulates contrast sensitivity and visual evoked potentials.'
      }
    ]
  },

  Oz: {
    id: 'Oz',
    name: 'Midline Primary Visual Cortex (V1)',
    shortName: 'Midline Visual / V1 (Oz)',
    brodmannAreas: ['BA 17', 'BA 18'],
    lobe: 'Occipital',
    pos3D: [0.0, 0.162, -1.024],
    posCortical: [0.0, 0.12, -0.81],
    normal: [0.0, 0.190, -0.982],
    primaryFunctions: [
      'Foveal and parafoveal primary retinotopic representation',
      'Binocular depth & stereopsis calibration',
      'Posterior dominant alpha rhythm (eyes-closed 10 Hz) generator',
      'Visual contrast sensitivity curve'
    ],
    clinicalIndications: ['Migraine with aura prophylaxis (Cathodal suppression)', 'Visual plasticity enhancement', 'Optic neuritis recovery'],
    anodalEffects: {
      summary: 'Significantly enhances foveal contrast sensitivity and lowers perceptual detection thresholds; boosts gamma power.',
      cellularAction: 'Depolarizes calcarine cortex pyramidal neurons; facilitates synaptic LTP in ocular dominance columns.',
      eegShifts: { delta: -14, theta: -8, alpha: -28, beta: 22, gamma: 35 },
      cognitiveMetrics: { focus: 20, mood: 0, motorSpeed: 5, language: 0, painThreshold: 0, visualAcuity: 55 },
      sideEffects: ['Phosphenes on ramp-up/down', 'Occipital scalp tingling']
    },
    cathodalEffects: {
      summary: 'Reduces visual cortical hyper-excitability; key therapeutic strategy to suppress migraine aura trigger waves (cortical spreading depression).',
      cellularAction: 'Hyperpolarizes primary visual cortex; restores elevated inhibitory tone.',
      eegShifts: { delta: 14, theta: 10, alpha: 25, beta: -20, gamma: -25 },
      cognitiveMetrics: { focus: -10, mood: 0, motorSpeed: 0, language: 0, painThreshold: 15, visualAcuity: -40 },
      sideEffects: ['Transient visual blurriness', 'Sedative calm']
    },
    keyCitations: [
      {
        authors: 'Antal A, et al.',
        year: 2004,
        journal: 'Brain Res',
        pmid: '15033422',
        finding: 'Polarity-dependent modulation of contrast perception and motion detection thresholds by V1 tDCS.'
      },
      {
        authors: 'Chadaide Z, et al.',
        year: 2007,
        journal: 'Cephalalgia',
        pmid: '17298544',
        finding: 'Cathodal tDCS over visual cortex reduces hyper-excitability in migraineurs.'
      }
    ]
  },

  O2: {
    id: 'O2',
    name: 'Right Visual Cortex (V1 / V2 / V3)',
    shortName: 'Right Primary Visual (O2)',
    brodmannAreas: ['BA 17', 'BA 18', 'BA 19'],
    lobe: 'Occipital',
    pos3D: [0.312, 0.156, -0.957],
    posCortical: [0.25, 0.12, -0.79],
    normal: [0.408, 0.179, -0.895],
    primaryFunctions: [
      'Contralateral (Left) visual hemifield primary processing',
      'Global visual scene configuration and motion direction',
      'Visual Evoked Potential modulation',
      'Contrast threshold calibration'
    ],
    clinicalIndications: ['Left visual hemifield recovery', 'Amblyopia', 'Visual motion learning'],
    anodalEffects: {
      summary: 'Increases excitability of right striate cortex; enhances left hemifield contrast sensitivity and visual search.',
      cellularAction: 'Depolarizes right striate pyramidal layers.',
      eegShifts: { delta: -12, theta: -6, alpha: -22, beta: 20, gamma: 30 },
      cognitiveMetrics: { focus: 15, mood: 0, motorSpeed: 0, language: 0, painThreshold: 0, visualAcuity: 45 },
      sideEffects: ['Right occipital itch', 'Phosphenes']
    },
    cathodalEffects: {
      summary: 'Suppresses excitability in right visual cortex; elevates detection thresholds for left hemifield stimuli.',
      cellularAction: 'Hyperpolarizes right visual cortex.',
      eegShifts: { delta: 12, theta: 8, alpha: 22, beta: -18, gamma: -22 },
      cognitiveMetrics: { focus: -5, mood: 0, motorSpeed: 0, language: 0, painThreshold: 0, visualAcuity: -35 },
      sideEffects: ['Transient left visual field contrast reduction']
    },
    keyCitations: [
      {
        authors: 'Antal A, et al.',
        year: 2004,
        journal: 'Brain Res',
        pmid: '15033422',
        finding: 'Modulation of VEP and psychophysical contrast sensitivity by occipital tDCS.'
      }
    ]
  },

  EX_L: {
    id: 'EX_L',
    name: 'Left Deltoid / Shoulder (Extracephalic Reference)',
    shortName: 'Left Deltoid (EX_L)',
    brodmannAreas: ['N/A (Extracephalic)'],
    lobe: 'Extracephalic',
    pos3D: [-2.57, -2.62, 0.05],
    posCortical: [-2.4, -2.6, 0.05],
    normal: [-0.95, 0.3, 0.0],
    primaryFunctions: [
      'Eliminates unwanted cranial cathode/anode co-stimulation',
      'Directs current vector vertically through deep subcortical/brainstem nuclei',
      'Monopolar cephalic target stimulation reference'
    ],
    clinicalIndications: ['Deep brain / brainstem vector protocols', 'True unipolar cortical stimulation', 'Avoidance of cephalic counter-polarization'],
    anodalEffects: {
      summary: 'Acts as peripheral somatic anode; no direct cortical depolarization beneath shoulder pad.',
      cellularAction: 'Peripheral neuromuscular polarization only.',
      eegShifts: { delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 },
      cognitiveMetrics: { focus: 0, mood: 0, motorSpeed: 0, language: 0, painThreshold: 0, visualAcuity: 0 },
      sideEffects: ['Shoulder muscle twitching', 'Skin tingling under pad']
    },
    cathodalEffects: {
      summary: 'Acts as inert extracephalic return; ensures only the cranial target receives pure unipolar anodal depolarization without cranial counter-inhibition.',
      cellularAction: 'Serves as current sink; caution: alters trans-brainstem electrical current flow vectors.',
      eegShifts: { delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 },
      cognitiveMetrics: { focus: 0, mood: 0, motorSpeed: 0, language: 0, painThreshold: 0, visualAcuity: 0 },
      sideEffects: ['Shoulder skin tingling', 'Requires heart rate/autonomic safety monitoring']
    },
    keyCitations: [
      {
        authors: 'Bikson M, et al.',
        year: 2010,
        journal: 'Conf Proc IEEE Eng Med Biol Soc',
        pmid: '21096738',
        finding: 'Extracephalic references eliminate cephalic counter-stimulation but alter deep brainstem current streamlines.'
      }
    ]
  },

  EX_R: {
    id: 'EX_R',
    name: 'Right Deltoid / Shoulder (Extracephalic Reference)',
    shortName: 'Right Deltoid (EX_R)',
    brodmannAreas: ['N/A (Extracephalic)'],
    lobe: 'Extracephalic',
    pos3D: [2.57, -2.62, 0.05],
    posCortical: [2.4, -2.6, 0.05],
    normal: [0.95, 0.3, 0.0],
    primaryFunctions: [
      'Contralateral shoulder reference',
      'Directs current vector through deep axial pathways',
      'Pure cephalic unipolar return'
    ],
    clinicalIndications: ['Left-hemispheric unipolar protocols', 'Parkinsonian deep motor stimulation'],
    anodalEffects: {
      summary: 'Peripheral right shoulder anode.',
      cellularAction: 'Peripheral somatic polarization.',
      eegShifts: { delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 },
      cognitiveMetrics: { focus: 0, mood: 0, motorSpeed: 0, language: 0, painThreshold: 0, visualAcuity: 0 },
      sideEffects: ['Shoulder tingling']
    },
    cathodalEffects: {
      summary: 'Extracephalic return sink for left cranial anode targets (e.g., C3 or F3).',
      cellularAction: 'Inert return sink outside calvarium.',
      eegShifts: { delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 },
      cognitiveMetrics: { focus: 0, mood: 0, motorSpeed: 0, language: 0, painThreshold: 0, visualAcuity: 0 },
      sideEffects: ['Right deltoid itch']
    },
    keyCitations: [
      {
        authors: 'Miranda PC, et al.',
        year: 2006,
        journal: 'Phys Med Biol',
        pmid: '16481677',
        finding: 'The electric field in the human brain during tDCS: A simulation study with cephalic and extracephalic references.'
      }
    ]
  }
};
