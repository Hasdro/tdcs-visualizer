import { BRAIN_NODES } from '../data/brain_nodes';

export interface BiophysicalParams {
  anodeId: string;
  cathodeId: string;
  currentMa: number;
  durationMin: number;
  padAreaCm2: number;
  montageType: 'sponge' | 'hd4x1';
  surroundNodeIds?: string[];
}

export interface BiophysicalTelemetry {
  currentDensityMaCm2: number; // mA/cm²
  currentDensityAM2: number; // A/m²
  totalChargeCoulombs: number; // C
  chargeDensityCCm2: number; // C/cm²
  shuntPercentage: number; // e.g. 62.4%
  peakEFieldVm: number; // V/m (typical 0.3 - 0.8 V/m)
  meanCorticalEFieldVm: number; // V/m
  maxMembraneShiftMv: number; // mV (+0.2 to +1.5 mV)
  safetyIndex: 'OPTIMAL' | 'MODERATE' | 'CAUTION' | 'THRESHOLD_EXCEEDED';
  safetyMessage: string;
  activeAnodalNodes: Array<{ id: string; name: string; eField: number; membraneShiftMv: number }>;
  activeCathodalNodes: Array<{ id: string; name: string; eField: number; membraneShiftMv: number }>;
  compositeMetrics: {
    focus: number;
    mood: number;
    motorSpeed: number;
    language: number;
    painThreshold: number;
    visualAcuity: number;
  };
  sideEffectProfile: {
    tinglingScore: number; // 0 to 10
    metallicTaste: boolean;
    phospheneRisk: boolean;
    skinErythemaRisk: number; // 0 to 10
  };
}

/**
 * Computes 3D Euclidean distance between two 3D vectors
 */
export function euclideanDistance(a: [number, number, number], b: [number, number, number]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Computes the Cortical Electric Field (V/m) and normal polarization component
 * at an arbitrary 3D position p [x, y, z] on the cortex.
 * 
 * Implements Lead-Field superposition from Miranda et al. 2006, Bikson et al. 2016.
 */
export function computeEFieldAtPoint(
  p: [number, number, number],
  _normal: [number, number, number],
  params: BiophysicalParams
): { potential: number; eNormal: number; eMagnitude: number } {
  const { anodeId, cathodeId, currentMa, padAreaCm2, montageType, surroundNodeIds } = params;

  const anodeNode = BRAIN_NODES[anodeId];
  const cathodeNode = BRAIN_NODES[cathodeId];

  if (!anodeNode) {
    return { potential: 0, eNormal: 0, eMagnitude: 0 };
  }

  // Depth of skull / CSF layer in normalized model coordinates (~12-15mm physical)
  const dSkull = 0.16;
  const dSkullSq = dSkull * dSkull;

  // Spatial spread parameter sigma based on electrode geometry
  // Sponge: broader spatial dispersion; HD-tDCS: tight focality
  const sigma = montageType === 'hd4x1' ? 0.11 : 0.22 * Math.sqrt(Math.max(padAreaCm2, 9) / 25.0);
  const twoSigmaSq = 2.0 * sigma * sigma;

  // Skull & CSF transmission factor (~38% reaches cortex, ~62% shunted)
  const etaTrans = 0.38;

  // Effective field scaling constant calibrated so peak |E| ~ 0.65 V/m at 2.0 mA and ~ 0.33 V/m at 1.0 mA (Miranda 2006, Bikson 2016)
  const kField = 0.0215 * currentMa * etaTrans;

  // 1. Calculate Anode contribution
  const pA = anodeNode.posCortical;
  const rASq = (p[0] - pA[0]) ** 2 + (p[1] - pA[1]) ** 2 + (p[2] - pA[2]) ** 2;
  const effDistA = Math.sqrt(rASq + dSkullSq);
  const weightA = Math.exp(-rASq / twoSigmaSq);
  const phiA = (kField * weightA) / effDistA;

  // Anode E-field gradient vector (radial outward from anode along cortex)
  const gradAx = -phiA * ((p[0] - pA[0]) / (effDistA * effDistA) + (p[0] - pA[0]) / (sigma * sigma));
  const gradAy = -phiA * ((p[1] - pA[1]) / (effDistA * effDistA) + (p[1] - pA[1]) / (sigma * sigma));
  const gradAz = -phiA * ((p[2] - pA[2]) / (effDistA * effDistA) + (p[2] - pA[2]) / (sigma * sigma));

  // Inward normal (transcortical) component from Anode (+ is depolarizing into cortex)
  const eNormA = phiA / dSkull;

  let phiTotal = phiA;
  let ex = -gradAx;
  let ey = -gradAy;
  let ez = -gradAz;
  let eNormalTotal = eNormA;

  // 2. Calculate Cathode / Return contribution
  if (montageType === 'hd4x1' && surroundNodeIds && surroundNodeIds.length > 0) {
    // 4x1 Ring configuration: current sinks distributed equally over ring cathodes
    const ringWeight = 1.0 / surroundNodeIds.length;
    for (const sId of surroundNodeIds) {
      const sNode = BRAIN_NODES[sId];
      if (!sNode) continue;
      const pS = sNode.posCortical;
      const rSSq = (p[0] - pS[0]) ** 2 + (p[1] - pS[1]) ** 2 + (p[2] - pS[2]) ** 2;
      const effDistS = Math.sqrt(rSSq + dSkullSq);
      const weightS = Math.exp(-rSSq / (twoSigmaSq * 0.7));
      const phiS = (kField * ringWeight * weightS) / effDistS;

      phiTotal -= phiS;
      const gradSx = -phiS * ((p[0] - pS[0]) / (effDistS * effDistS) + (p[0] - pS[0]) / (sigma * sigma));
      const gradSy = -phiS * ((p[1] - pS[1]) / (effDistS * effDistS) + (p[1] - pS[1]) / (sigma * sigma));
      const gradSz = -phiS * ((p[2] - pS[2]) / (effDistS * effDistS) + (p[2] - pS[2]) / (sigma * sigma));

      ex += gradSx;
      ey += gradSy;
      ez += gradSz;
      eNormalTotal -= (phiS / dSkull);
    }
  } else if (cathodeNode) {
    const pC = cathodeNode.posCortical;
    const rCSq = (p[0] - pC[0]) ** 2 + (p[1] - pC[1]) ** 2 + (p[2] - pC[2]) ** 2;
    const effDistC = Math.sqrt(rCSq + dSkullSq);
    const weightC = Math.exp(-rCSq / twoSigmaSq);
    const phiC = (kField * weightC) / effDistC;

    phiTotal -= phiC;
    const gradCx = -phiC * ((p[0] - pC[0]) / (effDistC * effDistC) + (p[0] - pC[0]) / (sigma * sigma));
    const gradCy = -phiC * ((p[1] - pC[1]) / (effDistC * effDistC) + (p[1] - pC[1]) / (sigma * sigma));
    const gradCz = -phiC * ((p[2] - pC[2]) / (effDistC * effDistC) + (p[2] - pC[2]) / (sigma * sigma));

    ex += gradCx;
    ey += gradCy;
    ez += gradCz;
    eNormalTotal -= (phiC / dSkull);
  }

  // Normal component of electric field: En (Anodal > 0 depolarizing, Cathodal < 0 hyperpolarizing)
  // Tangential gradient component along gyral crowns
  const eTangential = Math.sqrt(ex * ex + ey * ey + ez * ez);
  const eMagnitude = Math.sqrt(eTangential * eTangential + eNormalTotal * eNormalTotal);

  return {
    potential: phiTotal,
    eNormal: eNormalTotal,
    eMagnitude
  };
}

/**
 * Calculates comprehensive clinical & biophysical telemetry
 */
export function calculateTelemetry(params: BiophysicalParams): BiophysicalTelemetry {
  const { anodeId, cathodeId, currentMa, durationMin, padAreaCm2, montageType } = params;

  // 1. Current Density J = I / A (mA / cm²)
  const currentDensityMaCm2 = currentMa / Math.max(padAreaCm2, 1);
  const currentDensityAM2 = currentDensityMaCm2 * 10; // 1 mA/cm² = 10 A/m²

  // 2. Total Injected Charge Q = I * t (Coulombs)
  const totalSeconds = durationMin * 60;
  const totalChargeCoulombs = (currentMa * 1e-3) * totalSeconds;
  const chargeDensityCCm2 = totalChargeCoulombs / Math.max(padAreaCm2, 1);

  // 3. Inter-electrode distance & Shunting fraction
  const anodeNode = BRAIN_NODES[anodeId] || BRAIN_NODES['F3'];
  const cathodeNode = BRAIN_NODES[cathodeId] || BRAIN_NODES['Fp2'];
  const interDist = euclideanDistance(anodeNode.pos3D, cathodeNode.pos3D);

  // Shunt percentage: Miranda et al. shows 55-75% current shunted across scalp and CSF
  // When electrodes are close together, shunt is higher; when far apart, more penetrates skull
  let shuntPercentage = 62.0;
  if (montageType === 'hd4x1') {
    shuntPercentage = 48.0; // Higher focal transmission beneath center electrode
  } else {
    shuntPercentage = Math.min(74.0, Math.max(52.0, 58.0 + 12.0 * Math.exp(-interDist / 1.1)));
  }

  // 4. Sample E-field at all 10-20 brain nodes + continuous sampling at active electrode centers
  const activeAnodalNodes: Array<{ id: string; name: string; eField: number; membraneShiftMv: number }> = [];
  const activeCathodalNodes: Array<{ id: string; name: string; eField: number; membraneShiftMv: number }> = [];

  let peakE = 0;
  let sumE = 0;
  let count = 0;

  // Membrane coupling factor: ~1.2 mV somatic shift per V/m (Radman et al. 2009; Bikson et al. 2016)
  const membraneFactor = 1.25;

  // Explicit continuous sampling directly beneath active anode to capture focal peak (BUG-02)
  const pA = anodeNode.posCortical;
  const sampleOffsets: Array<[number, number, number]> = [
    [0, 0, 0],
    [0.02, 0, 0], [-0.02, 0, 0], [0, 0.02, 0], [0, -0.02, 0],
    [0.04, 0, 0], [-0.04, 0, 0], [0, 0.04, 0], [0, -0.04, 0],
    [0.06, 0, 0], [-0.06, 0, 0], [0, 0.06, 0], [0, -0.06, 0],
    [0.08, 0, 0], [-0.08, 0, 0], [0, 0.08, 0], [0, -0.08, 0]
  ];
  for (const [dx, dy, dz] of sampleOffsets) {
    const pSample: [number, number, number] = [pA[0] + dx, pA[1] + dy, pA[2] + dz];
    const { eMagnitude } = computeEFieldAtPoint(pSample, anodeNode.normal, params);
    if (eMagnitude > peakE) {
      peakE = eMagnitude;
    }
  }

  // Also sample beneath cathode in sponge mode
  if (montageType === 'sponge' && cathodeNode && !cathodeId.startsWith('EX_')) {
    const pC = cathodeNode.posCortical;
    for (const [dx, dy, dz] of sampleOffsets) {
      const pSample: [number, number, number] = [pC[0] + dx, pC[1] + dy, pC[2] + dz];
      const { eMagnitude } = computeEFieldAtPoint(pSample, cathodeNode.normal, params);
      if (eMagnitude > peakE) {
        peakE = eMagnitude;
      }
    }
  }

  // Composite behavioral metrics accumulation
  let compFocus = 0;
  let compMood = 0;
  let compMotor = 0;
  let compLang = 0;
  let compPain = 0;
  let compVision = 0;

  for (const key of Object.keys(BRAIN_NODES)) {
    if (key.startsWith('EX_')) continue; // Skip extracephalic for cortical sampling
    const node = BRAIN_NODES[key];
    const { eNormal, eMagnitude } = computeEFieldAtPoint(node.posCortical, node.normal, params);

    sumE += eMagnitude;
    count++;
    if (eMagnitude > peakE) {
      peakE = eMagnitude;
    }

    const dVm = eNormal * membraneFactor;

    if (eNormal > 0.08) {
      activeAnodalNodes.push({
        id: node.id,
        name: node.shortName,
        eField: parseFloat(eNormal.toFixed(3)),
        membraneShiftMv: parseFloat(dVm.toFixed(2))
      });

      // Weight cognitive contributions by local E-field magnitude
      const w = Math.min(1.2, eNormal / 0.5);
      compFocus += node.anodalEffects.cognitiveMetrics.focus * w;
      compMood += node.anodalEffects.cognitiveMetrics.mood * w;
      compMotor += node.anodalEffects.cognitiveMetrics.motorSpeed * w;
      compLang += node.anodalEffects.cognitiveMetrics.language * w;
      compPain += node.anodalEffects.cognitiveMetrics.painThreshold * w;
      compVision += node.anodalEffects.cognitiveMetrics.visualAcuity * w;
    } else if (eNormal < -0.08) {
      activeCathodalNodes.push({
        id: node.id,
        name: node.shortName,
        eField: parseFloat(eNormal.toFixed(3)),
        membraneShiftMv: parseFloat(dVm.toFixed(2))
      });

      const w = Math.min(1.2, Math.abs(eNormal) / 0.5);
      compFocus += node.cathodalEffects.cognitiveMetrics.focus * w;
      compMood += node.cathodalEffects.cognitiveMetrics.mood * w;
      compMotor += node.cathodalEffects.cognitiveMetrics.motorSpeed * w;
      compLang += node.cathodalEffects.cognitiveMetrics.language * w;
      compPain += node.cathodalEffects.cognitiveMetrics.painThreshold * w;
      compVision += node.cathodalEffects.cognitiveMetrics.visualAcuity * w;
    }
  }

  // Sort nodes by absolute intensity
  activeAnodalNodes.sort((a, b) => b.eField - a.eField);
  activeCathodalNodes.sort((a, b) => a.eField - b.eField);

  // Peak V/m scaled dynamically with current without artificial saturation clamp (BUG-01)
  const peakEFieldVm = parseFloat(Math.max(0.01, peakE).toFixed(3));
  const meanCorticalEFieldVm = parseFloat((sumE / Math.max(count, 1)).toFixed(3));
  const maxMembraneShiftMv = parseFloat((peakEFieldVm * membraneFactor).toFixed(2));

  // 5. Safety determination according to consensus guidelines (Bikson et al. 2016)
  // J <= 0.08 mA/cm² is standard; J > 0.15 mA/cm² triggers caution; J > 0.25 mA/cm² is threshold exceeded
  let safetyIndex: BiophysicalTelemetry['safetyIndex'] = 'OPTIMAL';
  let safetyMessage = 'Current density and charge duration fall well within peer-reviewed clinical safety limits (Bikson 2016).';

  if (currentDensityMaCm2 > 0.25) {
    safetyIndex = 'THRESHOLD_EXCEEDED';
    safetyMessage = 'CAUTION: Current density exceeds 0.25 mA/cm². High risk of skin irritation and epidermal lesions.';
  } else if (currentDensityMaCm2 > 0.12 || durationMin > 25) {
    safetyIndex = 'CAUTION';
    safetyMessage = 'High current density or prolonged duration. Ensure adequate saline / conductive gel hydration.';
  } else if (currentDensityMaCm2 > 0.08) {
    safetyIndex = 'MODERATE';
    safetyMessage = 'Standard high-intensity research dosage (0.08 – 0.12 mA/cm²). Mild tingling expected.';
  }

  // 6. Sensory & side effect indicators
  const nearOpticNerve = ['Fp1', 'Fp2', 'Fpz', 'Oz', 'O1', 'O2'].includes(anodeId) ||
                         ['Fp1', 'Fp2', 'Fpz', 'Oz', 'O1', 'O2'].includes(cathodeId);
  const nearOralCavity = ['F7', 'F8', 'T7', 'T8'].includes(anodeId) ||
                         ['F7', 'F8', 'T7', 'T8'].includes(cathodeId);

  const tinglingScore = Math.min(10, Math.round(currentDensityMaCm2 * 75));
  const skinErythemaRisk = Math.min(10, Math.round(chargeDensityCCm2 * 70));

  // Clamp composite metrics to [-100, +100]
  const clamp100 = (v: number) => Math.min(100, Math.max(-100, Math.round(v)));

  return {
    currentDensityMaCm2: parseFloat(currentDensityMaCm2.toFixed(4)),
    currentDensityAM2: parseFloat(currentDensityAM2.toFixed(3)),
    totalChargeCoulombs: parseFloat(totalChargeCoulombs.toFixed(2)),
    chargeDensityCCm2: parseFloat(chargeDensityCCm2.toFixed(4)),
    shuntPercentage: parseFloat(shuntPercentage.toFixed(1)),
    peakEFieldVm,
    meanCorticalEFieldVm,
    maxMembraneShiftMv,
    safetyIndex,
    safetyMessage,
    activeAnodalNodes,
    activeCathodalNodes,
    compositeMetrics: {
      focus: clamp100(compFocus),
      mood: clamp100(compMood),
      motorSpeed: clamp100(compMotor),
      language: clamp100(compLang),
      painThreshold: clamp100(compPain),
      visualAcuity: clamp100(compVision),
    },
    sideEffectProfile: {
      tinglingScore,
      metallicTaste: nearOralCavity && currentMa >= 1.0,
      phospheneRisk: nearOpticNerve,
      skinErythemaRisk,
    }
  };
}

export interface MultiChannelChannel {
  nodeId: string;
  currentMa: number; // positive = anode, negative = cathode
}

export interface MultiChannelTelemetry extends BiophysicalTelemetry {
  kirchhoffSumMa: number;
  isKirchhoffBalanced: boolean;
  totalAnodalMa: number;
  totalCathodalMa: number;
}

/**
 * Computes electric field superposition from arbitrary multi-channel electrode configurations.
 */
export function computeMultiChannelEFieldAtPoint(
  p: [number, number, number],
  channels: MultiChannelChannel[],
  padAreaCm2: number = 3.14
): { potential: number; eNormal: number; eMagnitude: number } {
  const dSkull = 0.16;
  const dSkullSq = dSkull * dSkull;
  const sigma = 0.14 * Math.sqrt(Math.max(padAreaCm2, 3) / 12.0);
  const twoSigmaSq = 2.0 * sigma * sigma;
  const etaTrans = 0.38;

  let phiTotal = 0;
  let exTotal = 0;
  let eyTotal = 0;
  let ezTotal = 0;
  let eNormalTotal = 0;

  for (const ch of channels) {
    if (Math.abs(ch.currentMa) < 0.001) continue;
    const node = BRAIN_NODES[ch.nodeId];
    if (!node) continue;

    const kField = 0.0215 * ch.currentMa * etaTrans;
    const pN = node.posCortical;
    const rSq = (p[0] - pN[0]) ** 2 + (p[1] - pN[1]) ** 2 + (p[2] - pN[2]) ** 2;
    const effDist = Math.sqrt(rSq + dSkullSq);
    const weight = Math.exp(-rSq / twoSigmaSq);
    const phi = (kField * weight) / effDist;

    phiTotal += phi;
    const gradX = -phi * ((p[0] - pN[0]) / (effDist * effDist) + (p[0] - pN[0]) / (sigma * sigma));
    const gradY = -phi * ((p[1] - pN[1]) / (effDist * effDist) + (p[1] - pN[1]) / (sigma * sigma));
    const gradZ = -phi * ((p[2] - pN[2]) / (effDist * effDist) + (p[2] - pN[2]) / (sigma * sigma));

    exTotal -= gradX;
    eyTotal -= gradY;
    ezTotal -= gradZ;
    eNormalTotal += (phi / dSkull);
  }

  const eTang = Math.sqrt(exTotal * exTotal + eyTotal * eyTotal + ezTotal * ezTotal);
  const eMagnitude = Math.sqrt(eTang * eTang + eNormalTotal * eNormalTotal);

  return { potential: phiTotal, eNormal: eNormalTotal, eMagnitude };
}

/**
 * Calculates telemetry for a multi-channel electrode array
 */
export function calculateMultiChannelTelemetry(
  channels: MultiChannelChannel[],
  durationMin: number,
  padAreaCm2: number = 3.14
): MultiChannelTelemetry {
  let totalAnodalMa = 0;
  let totalCathodalMa = 0;
  let kirchhoffSum = 0;

  for (const ch of channels) {
    kirchhoffSum += ch.currentMa;
    if (ch.currentMa > 0) totalAnodalMa += ch.currentMa;
    else totalCathodalMa += Math.abs(ch.currentMa);
  }

  const maxChannelMa = Math.max(...channels.map((c) => Math.abs(c.currentMa)), 0.001);
  const currentDensityMaCm2 = maxChannelMa / padAreaCm2;
  const currentDensityAM2 = currentDensityMaCm2 * 10;
  const totalChargeCoulombs = (totalAnodalMa * (durationMin * 60)) / 1000;
  const chargeDensityCCm2 = totalChargeCoulombs / padAreaCm2;

  let peakE = 0;
  let sumE = 0;
  let count = 0;
  const activeAnodalNodes: Array<{ id: string; name: string; eField: number; membraneShiftMv: number }> = [];
  const activeCathodalNodes: Array<{ id: string; name: string; eField: number; membraneShiftMv: number }> = [];

  const membraneFactor = 1.25;

  // Sample around each active channel to capture peak fields
  const offsets: Array<[number, number, number]> = [
    [0, 0, 0],
    [0.02, 0, 0], [-0.02, 0, 0], [0, 0.02, 0], [0, -0.02, 0],
    [0.04, 0, 0], [-0.04, 0, 0], [0, 0.04, 0], [0, -0.04, 0]
  ];
  for (const ch of channels) {
    if (Math.abs(ch.currentMa) < 0.01) continue;
    const node = BRAIN_NODES[ch.nodeId];
    if (!node) continue;
    for (const [dx, dy, dz] of offsets) {
      const pSample: [number, number, number] = [
        node.posCortical[0] + dx,
        node.posCortical[1] + dy,
        node.posCortical[2] + dz
      ];
      const { eMagnitude } = computeMultiChannelEFieldAtPoint(pSample, channels, padAreaCm2);
      if (eMagnitude > peakE) peakE = eMagnitude;
    }
  }

  let compFocus = 0;
  let compMood = 0;
  let compMotor = 0;
  let compLang = 0;
  let compPain = 0;
  let compVision = 0;

  for (const key of Object.keys(BRAIN_NODES)) {
    if (key.startsWith('EX_')) continue;
    const node = BRAIN_NODES[key];
    const { eNormal, eMagnitude } = computeMultiChannelEFieldAtPoint(node.posCortical, channels, padAreaCm2);

    sumE += eMagnitude;
    count++;
    if (eMagnitude > peakE) peakE = eMagnitude;

    const dVm = eNormal * membraneFactor;

    if (eNormal > 0.08) {
      activeAnodalNodes.push({
        id: node.id,
        name: node.shortName,
        eField: parseFloat(eNormal.toFixed(3)),
        membraneShiftMv: parseFloat(dVm.toFixed(2))
      });
      const w = Math.min(1.2, eNormal / 0.5);
      compFocus += node.anodalEffects.cognitiveMetrics.focus * w;
      compMood += node.anodalEffects.cognitiveMetrics.mood * w;
      compMotor += node.anodalEffects.cognitiveMetrics.motorSpeed * w;
      compLang += node.anodalEffects.cognitiveMetrics.language * w;
      compPain += node.anodalEffects.cognitiveMetrics.painThreshold * w;
      compVision += node.anodalEffects.cognitiveMetrics.visualAcuity * w;
    } else if (eNormal < -0.08) {
      activeCathodalNodes.push({
        id: node.id,
        name: node.shortName,
        eField: parseFloat(eNormal.toFixed(3)),
        membraneShiftMv: parseFloat(dVm.toFixed(2))
      });
      const w = Math.min(1.2, Math.abs(eNormal) / 0.5);
      compFocus += node.cathodalEffects.cognitiveMetrics.focus * w;
      compMood += node.cathodalEffects.cognitiveMetrics.mood * w;
      compMotor += node.cathodalEffects.cognitiveMetrics.motorSpeed * w;
      compLang += node.cathodalEffects.cognitiveMetrics.language * w;
      compPain += node.cathodalEffects.cognitiveMetrics.painThreshold * w;
      compVision += node.cathodalEffects.cognitiveMetrics.visualAcuity * w;
    }
  }

  activeAnodalNodes.sort((a, b) => b.eField - a.eField);
  activeCathodalNodes.sort((a, b) => a.eField - b.eField);

  const peakEFieldVm = parseFloat(Math.max(0.01, peakE).toFixed(3));
  const meanCorticalEFieldVm = parseFloat((sumE / Math.max(count, 1)).toFixed(3));
  const maxMembraneShiftMv = parseFloat((peakEFieldVm * membraneFactor).toFixed(2));

  const isKirchhoffBalanced = Math.abs(kirchhoffSum) < 0.05;

  let safetyIndex: BiophysicalTelemetry['safetyIndex'] = 'OPTIMAL';
  let safetyMessage = isKirchhoffBalanced
    ? 'Multi-channel array satisfies Kirchhoff current balance (sum I ≈ 0).'
    : 'CAUTION: Array currents are unbalanced (sum I ≠ 0). Net charge accumulation risk.';

  if (currentDensityMaCm2 > 0.25) {
    safetyIndex = 'THRESHOLD_EXCEEDED';
    safetyMessage = 'CAUTION: Individual channel current density exceeds 0.25 mA/cm².';
  } else if (!isKirchhoffBalanced) {
    safetyIndex = 'CAUTION';
  }

  const clamp100 = (v: number) => Math.min(100, Math.max(-100, Math.round(v)));

  return {
    currentDensityMaCm2: parseFloat(currentDensityMaCm2.toFixed(4)),
    currentDensityAM2: parseFloat(currentDensityAM2.toFixed(3)),
    totalChargeCoulombs: parseFloat(totalChargeCoulombs.toFixed(2)),
    chargeDensityCCm2: parseFloat(chargeDensityCCm2.toFixed(4)),
    shuntPercentage: 58.5,
    peakEFieldVm,
    meanCorticalEFieldVm,
    maxMembraneShiftMv,
    safetyIndex,
    safetyMessage,
    activeAnodalNodes,
    activeCathodalNodes,
    compositeMetrics: {
      focus: clamp100(compFocus),
      mood: clamp100(compMood),
      motorSpeed: clamp100(compMotor),
      language: clamp100(compLang),
      painThreshold: clamp100(compPain),
      visualAcuity: clamp100(compVision),
    },
    sideEffectProfile: {
      tinglingScore: Math.min(10, Math.round(currentDensityMaCm2 * 75)),
      metallicTaste: false,
      phospheneRisk: false,
      skinErythemaRisk: Math.min(10, Math.round(chargeDensityCCm2 * 70)),
    },
    kirchhoffSumMa: parseFloat(kirchhoffSum.toFixed(3)),
    isKirchhoffBalanced,
    totalAnodalMa: parseFloat(totalAnodalMa.toFixed(2)),
    totalCathodalMa: parseFloat(totalCathodalMa.toFixed(2)),
  };
}

