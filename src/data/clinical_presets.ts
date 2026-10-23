export interface ClinicalPreset {
  id: string;
  name: string;
  shortLabel: string;
  category: 'Mood / Executive' | 'Motor / Rehab' | 'Language / Speech' | 'Cognitive / Attention' | 'Sensory / Visual' | 'HD-tDCS Focal';
  evidenceLevel: 'Level A (Definite)' | 'Level B (Probable)' | 'Level C (Possible)' | 'Translational Research';
  anode: string;
  cathode: string;
  surroundNodes?: string[]; // for HD-tDCS 4x1 ring
  currentMa: number;
  durationMin: number;
  padAreaCm2: number;
  montageType: 'sponge' | 'hd4x1';
  targetStructure: string;
  clinicalPurpose: string;
  primaryMechanism: string;
  referenceStudy: {
    authors: string;
    year: number;
    journal: string;
    pmid: string;
  };
}

export const CLINICAL_PRESETS: ClinicalPreset[] = [
  {
    id: 'classic-dlpfc',
    name: 'Classic Left DLPFC (Mood & Executive Focus)',
    shortLabel: 'Left DLPFC (Mood)',
    category: 'Mood / Executive',
    evidenceLevel: 'Level A (Definite)',
    anode: 'F3',
    cathode: 'Fp2',
    currentMa: 2.0,
    durationMin: 20,
    padAreaCm2: 25,
    montageType: 'sponge',
    targetStructure: 'Left BA 9/46 (DLPFC) with Right Supraorbital return',
    clinicalPurpose: 'Alleviates major depressive symptoms, reverses prefrontal hypo-metabolism, and boosts executive working memory.',
    primaryMechanism: 'Anodal depolarization of left DLPFC pyramidal neurons promotes BDNF-mediated LTP and down-regulates pathological frontal alpha idling.',
    referenceStudy: {
      authors: 'Lefaucheur JP, et al.',
      year: 2017,
      journal: 'Clin Neurophysiol',
      pmid: '27866898'
    }
  },
  {
    id: 'bifrontal-anti-rumination',
    name: 'Bifrontal Cognitive Control & Anti-Rumination',
    shortLabel: 'Bifrontal Control',
    category: 'Mood / Executive',
    evidenceLevel: 'Level A (Definite)',
    anode: 'F3',
    cathode: 'F4',
    currentMa: 2.0,
    durationMin: 20,
    padAreaCm2: 25,
    montageType: 'sponge',
    targetStructure: 'Left DLPFC (Anode) + Right DLPFC (Cathode)',
    clinicalPurpose: 'Treats treatment-resistant depression with prominent anxiety and ruminative looping.',
    primaryMechanism: 'Simultaneously depolarizes hypofunctional Left DLPFC (approach motivation) while hyperpolarizing hyperactive Right DLPFC (threat vigilance and rumination).',
    referenceStudy: {
      authors: 'Brunoni AR, et al.',
      year: 2013,
      journal: 'JAMA Psychiatry',
      pmid: '23389323'
    }
  },
  {
    id: 'm1-so-motor-learning',
    name: 'M1-SO Motor Learning & Pain Modulation',
    shortLabel: 'M1 Motor / Pain',
    category: 'Motor / Rehab',
    evidenceLevel: 'Level B (Probable)',
    anode: 'C3',
    cathode: 'Fp2',
    currentMa: 2.0,
    durationMin: 20,
    padAreaCm2: 25,
    montageType: 'sponge',
    targetStructure: 'Left Primary Motor Cortex (BA 4) with Contralateral SO return',
    clinicalPurpose: 'Accelerates contralateral hand motor skill acquisition and alleviates chronic neuropathic pain / fibromyalgia.',
    primaryMechanism: 'Increases corticospinal excitability by 35–45% and activates descending thalamocortical inhibitory pain pathways.',
    referenceStudy: {
      authors: 'Nitsche MA, Paulus W.',
      year: 2000,
      journal: 'J Physiol',
      pmid: '10990547'
    }
  },
  {
    id: 'stroke-bihemispheric',
    name: 'Bi-Hemispheric Motor Stroke Rehabilitation',
    shortLabel: 'Stroke Bi-Hemispheric',
    category: 'Motor / Rehab',
    evidenceLevel: 'Level B (Probable)',
    anode: 'C3',
    cathode: 'C4',
    currentMa: 1.5,
    durationMin: 20,
    padAreaCm2: 25,
    montageType: 'sponge',
    targetStructure: 'Ipsilesional M1 (Anode) + Contralesional M1 (Cathode)',
    clinicalPurpose: 'Restores upper-extremity motor dexterity after unilateral ischemic stroke.',
    primaryMechanism: 'Excites injured motor cortex while suppressing pathological transcallosal inhibition from the uninjured hemisphere.',
    referenceStudy: {
      authors: 'Lindenberg R, et al.',
      year: 2010,
      journal: 'Stroke',
      pmid: '20847313'
    }
  },
  {
    id: 'broca-fluency',
    name: 'Broca’s Speech & Verbal Fluency Boost',
    shortLabel: 'Broca Verbal Fluency',
    category: 'Language / Speech',
    evidenceLevel: 'Level B (Probable)',
    anode: 'F7',
    cathode: 'Fp2',
    currentMa: 1.5,
    durationMin: 20,
    padAreaCm2: 25,
    montageType: 'sponge',
    targetStructure: 'Left Inferior Frontal Gyrus (BA 44/45, Broca’s Area)',
    clinicalPurpose: 'Rehabilitates post-stroke non-fluent expressive aphasia and enhances phonemic naming speed in healthy adults.',
    primaryMechanism: 'Potentiates synaptogenesis and task-evoked beta/gamma synchronization in the left articulatory phonological network.',
    referenceStudy: {
      authors: 'Holland R, et al.',
      year: 2011,
      journal: 'Curr Biol',
      pmid: '21757351'
    }
  },
  {
    id: 'parietal-spatial-math',
    name: 'Parietal Numerical & Spatial Attention',
    shortLabel: 'Parietal Math / Attention',
    category: 'Cognitive / Attention',
    evidenceLevel: 'Translational Research',
    anode: 'P3',
    cathode: 'P4',
    currentMa: 1.5,
    durationMin: 20,
    padAreaCm2: 25,
    montageType: 'sponge',
    targetStructure: 'Left Intraparietal Sulcus (BA 39/40) + Right Posterior Parietal',
    clinicalPurpose: 'Treats developmental dyscalculia and improves rapid mathematical problem-solving speed.',
    primaryMechanism: 'Modulates intraparietal neuronal excitability and strengthens frontoparietal working memory buffer consolidation.',
    referenceStudy: {
      authors: 'Cohen Kadosh R, et al.',
      year: 2010,
      journal: 'Curr Biol',
      pmid: '21055945'
    }
  },
  {
    id: 'v1-contrast-plasticity',
    name: 'Visual Cortex Contrast & V1 Plasticity',
    shortLabel: 'Visual V1 Contrast',
    category: 'Sensory / Visual',
    evidenceLevel: 'Level B (Probable)',
    anode: 'Oz',
    cathode: 'Cz',
    currentMa: 1.5,
    durationMin: 15,
    padAreaCm2: 25,
    montageType: 'sponge',
    targetStructure: 'Primary Visual Cortex (BA 17, Calcarine Sulcus)',
    clinicalPurpose: 'Sharpens visual contrast sensitivity and accelerates visual perceptual learning.',
    primaryMechanism: 'Increases Visual Evoked Potential (VEP) P100 amplitude and modulates intracortical GABAergic inhibition in ocular dominance columns.',
    referenceStudy: {
      authors: 'Antal A, et al.',
      year: 2004,
      journal: 'Brain Res',
      pmid: '15033422'
    }
  },
  {
    id: 'hd-tdcs-focal-dlpfc',
    name: 'Focal HD-tDCS (4×1 Ring) Left DLPFC',
    shortLabel: 'Focal HD-tDCS (4×1)',
    category: 'HD-tDCS Focal',
    evidenceLevel: 'Level B (Probable)',
    anode: 'F3',
    cathode: 'Fp1', // primary reference, with surround ring active
    surroundNodes: ['Fp1', 'Fz', 'C3', 'F7'],
    currentMa: 1.5,
    durationMin: 20,
    padAreaCm2: 3.14, // small 2cm diameter gel electrodes
    montageType: 'hd4x1',
    targetStructure: 'Focal Left BA 9/46 surrounded by 4 ring return electrodes',
    clinicalPurpose: 'Ultra-targeted executive enhancement and depression intervention with zero distant co-stimulation.',
    primaryMechanism: '4×1 ring configuration restricts electrical current strictly within the boundary of the ring, producing peak cortical E-field focality with zero skull-tangential wash.',
    referenceStudy: {
      authors: 'Datta A, et al.',
      year: 2009,
      journal: 'Brain Stimul',
      pmid: '20648973'
    }
  }
];
