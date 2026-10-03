/** NASA Humanoid Doctrine — Valkyrie & Robonaut as MASA Agent Personas
 *  Additive only. Globe untouched. Free lanes first.
 */

export type HumanoidPersona = {
  id: string;
  callsign: string;
  program: 'VALKYRIE' | 'ROBONAUT';
  role: string;
  doctrine: string;
  specs: {
    height: string;
    weight: string;
    dof: number;
    compute: string;
    power: string;
    endurance: string;
    hands: string;
    sensors: string[];
  };
  capabilities: string[];
  masaLane: {
    modelBenchId: string;
    specialization: string;
    autonomyLevel: 'supervised' | 'semi-autonomous' | 'full-autonomous';
  };
};

export const NASA_HUMANOIDS: HumanoidPersona[] = [
  {
    id: 'valkyrie-r5',
    callsign: 'VALKYRIE-R5',
    program: 'VALKYRIE',
    role: 'Degraded-environment EVA / surface ops / disaster response',
    doctrine: 'Robust, rugged, entirely electric. Operates in damaged human-engineered environments. Series elastic actuators throughout — force control, not position control. 44 DOF. One hour battery. Built for Moon/Mars site prep and Earth disaster response.',
    specs: {
      height: '188 cm (6 ft 2 in)',
      weight: '125 kg (300 lb)',
      dof: 44,
      compute: '2× Intel Core i7 (3× i7 Express on later builds)',
      power: '1.8 kWh dual-voltage Li-ion (backpack)',
      endurance: '~1 hour untethered / wall power unlimited',
      hands: '3-finger + thumb, 6 actuators per forearm, simplified humanoid hand',
      sensors: [
        'Carnegie Robotics MultiSense SL (laser + passive stereo + IR structured light)',
        'Fore/aft hazard cameras (torso)',
        '3-DOF neck',
        'IMU ×2 (pelvis)',
      ],
    },
    capabilities: [
      'Bipedal locomotion on rough terrain',
      'Dexterous manipulation with force feedback',
      'Tool use (human tools, no adapters)',
      'Door/valve operation',
      'Debris clearing',
      'Ladder climbing (with IHMC walking algos)',
      'Supervised teleop + semi-autonomous task execution',
    ],
    masaLane: {
      modelBenchId: 'glm-orchestrator',
      specialization: 'Physical-world task planning, force-control manipulation, degraded-comms ops',
      autonomyLevel: 'semi-autonomous',
    },
  },
  {
    id: 'valkyrie-r5-avatar',
    callsign: 'VALKYRIE-AVATAR',
    program: 'VALKYRIE',
    role: 'Telepresence avatar / remote inspection / human-in-loop',
    doctrine: 'Low-latency teleop over Tailscale/DARPA network. Operator sees through MultiSense SL, feels through series-elastic force reflection. One human, many Valkyries — swarm supervisor pattern.',
    specs: {
      height: '188 cm (6 ft 2 in)',
      weight: '125 kg (300 lb)',
      dof: 44,
      compute: '2× Intel Core i7 + edge GPU for vision',
      power: 'Tethered (wall) for continuous ops',
      endurance: 'Unlimited (tethered)',
      hands: '3-finger + thumb, force-reflective',
      sensors: [
        'MultiSense SL (stereo + IR + laser)',
        'Hazard cameras ×2',
        'Force/torque at every joint (series elastic)',
        'IMU ×2',
      ],
    },
    capabilities: [
      'Immersive telepresence (HMD + haptic gloves)',
      'Force-reflective manipulation',
      'Multi-robot supervision (1 human → N Valkyries)',
      'Degraded-comms graceful degradation',
      'Rapid role swap: autonomous ↔ teleop',
    ],
    masaLane: {
      modelBenchId: 'glm-flash',
      specialization: 'Telepresence control loop, multi-robot supervision, haptic feedback synthesis',
      autonomyLevel: 'supervised',
    },
  },
  {
    id: 'robonaut-r2',
    callsign: 'ROBONAUT-R2',
    program: 'ROBONAUT',
    role: 'ISS intravehicular assistant / microgravity dexterous ops',
    doctrine: 'Dexterity exceeding suited astronaut. 42 DOF (12 DOF hands alone). 38 PowerPC processors. 350+ sensors. Designed for: "all tasks required of an EVA-suited crewmember." Currently on ISS since 2011. Legs added 2014 for handrail climbing.',
    specs: {
      height: '101 cm (3 ft 4 in) torso only / ~190 cm with legs',
      weight: '150 kg (330 lb) torso / ~200 kg with legs',
      dof: 42,
      compute: '38 PowerPC processors (distributed)',
      power: 'ISS 120V DC / tethered',
      endurance: 'Continuous (station power)',
      hands: '12 DOF each (4 thumb, 3 index/middle, 1 ring/pinky), 5 lb grasp/finger',
      sensors: [
        'Stereo cameras (head)',
        'IR depth camera (mouth)',
        'Touch sensors at fingertips',
        'Force/torque at joints',
        '350+ total sensors',
      ],
    },
    capabilities: [
      'Switch/button panel operation',
      'Handrail cleaning / velocity air measurement',
      'Tool use (drill, wrench, probe)',
      'Handrail climbing (legs)',
      'Teleop from ground or crew',
      'Scripted autonomous sequences',
    ],
    masaLane: {
      modelBenchId: 'ollama-horus',
      specialization: 'Microgravity dexterous manipulation, panel/switch interaction, scripted procedure execution',
      autonomyLevel: 'semi-autonomous',
    },
  },
  {
    id: 'robonaut-r2-iss',
    callsign: 'ROBONAUT-R2-ISS',
    program: 'ROBONAUT',
    role: 'ISS external ops (future) / EVA prep / external inspection',
    doctrine: 'Upgraded R2 with climbing manipulators (legs), enhanced processors, new sensors. Target: external ISS worksite — ORU changeout, inspection, repair. Radiation-hardened. Vacuum-rated. Not yet flown external.',
    specs: {
      height: '~190 cm with legs deployed',
      weight: '~200 kg',
      dof: 42 + 14 (legs) = 56 total',
      compute: 'Upgraded PowerPC + radiation-hardened co-processors',
      power: 'ISS external power / battery EVA pack',
      endurance: 'EVA duration (6–8 hr) on battery',
      hands: '12 DOF + leg-end grippers (multi-purpose)',
      sensors: [
        'Enhanced stereo + IR',
        'Lidar for external navigation',
        'Force/torque all joints',
        'Radiation dosimeters',
      ],
    },
    capabilities: [
      'EVA worksite prep',
      'ORU (Orbital Replacement Unit) changeout',
      'External inspection (MMOD damage, radiator leaks)',
      'Handrail translation',
      'Teleop from inside ISS / ground',
      'Semi-autonomous inspection sweeps',
    ],
    masaLane: {
      modelBenchId: 'glm-53-flash',
      specialization: 'External ISS ops, radiation-hardened compute, vacuum-rated manipulation',
      autonomyLevel: 'semi-autonomous',
    },
  },
];

export const HUMANOID_DOCTRINE = `
NASA HUMANOID DOCTRINE FOR MASA INTEGRATION
===========================================

CORE PRINCIPLES (from JSC Engineering Directorate):
1. SERIES ELASTIC ACTUATION — Force control > position control. Compliance is safety.
2. HUMAN-ENGINEERED ENVIRONMENTS — No special adapters. Use human tools, doors, valves, handrails.
3. DEGRADED COMMS — Graceful degradation from teleop → supervised autonomy → local reflex.
4. SUPERVISED SWARM — One human supervises N humanoids. Not 1:1 teleop.
5. PHYSICAL INTELLIGENCE — The body IS the computation. Morphological computation.

MASA MAPPING:
- VALKYRIE-R5 → Ground/planetary surface ops agent. Maps to GLM orchestrator lane.
- VALKYRIE-AVATAR → Telepresence/swarm supervisor. Maps to GLM flash lane.
- ROBONAUT-R2 → Microgravity/station interior agent. Maps to local Ollama lane (privacy, no cloud).
- ROBONAUT-R2-ISS → External/vacuum ops agent. Maps to GLM-5.3-flash (multimodal, long ctx).

ALL LANES FREE. No paid dependencies. OptiPlex (mlpb) runs local Ollama for R2 privacy.
Globe (MapLibre) stays untouched — humanoids are HUD overlays + side panels, not map mutations.
`;

export function getHumanoidById(id: string): HumanoidPersona | undefined {
  return NASA_HUMANOIDS.find(h => h.id === id);
}

export function getHumanoidsByProgram(program: 'VALKYRIE' | 'ROBONAUT'): HumanoidPersona[] {
  return NASA_HUMANOIDS.filter(h => h.program === program);
}

export function getHumanoidsByModelLane(modelBenchId: string): HumanoidPersona[] {
  return NASA_HUMANOIDS.filter(h => h.masaLane.modelBenchId === modelBenchId);
}