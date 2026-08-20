const generateButton = document.getElementById('generateButton');
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
const cbCircle = document.getElementById('shapeCircle');
const cbSquare = document.getElementById('shapeSquare');
const cbTriangle = document.getElementById('shapeTriangle');
const wCircle = document.getElementById('weightCircle');
const wSquare = document.getElementById('weightSquare');
const wTriangle = document.getElementById('weightTriangle');
const shapeIntensityControl = document.getElementById('shapeIntensity');
const shapeRigidityControl = document.getElementById('shapeRigidity');
const contourVariationControl = document.getElementById('contourVariation');
const massBiasControl = document.getElementById('massBias');
const taperDirectionControl = document.getElementById('taperDirection');
const circlePercentage = document.getElementById('circlePercentage');
const squarePercentage = document.getElementById('squarePercentage');
const trianglePercentage = document.getElementById('trianglePercentage');
const circleRole = document.getElementById('circleRole');
const squareRole = document.getElementById('squareRole');
const triangleRole = document.getElementById('triangleRole');
const proportionStyleControl = document.getElementById('proportionStyle');
const headSizeControl = document.getElementById('headSizeControl');
const torsoLengthControl = document.getElementById('torsoLengthControl');
const torsoWidthControl = document.getElementById('torsoWidthControl');
const pelvisWidthControl = document.getElementById('pelvisWidthControl');
const legLengthControl = document.getElementById('legLengthControl');
const shoulderControl = document.getElementById('shoulderControl');
const debugToggle = document.getElementById('debugRegions');
const editPoseToggle = document.getElementById('editPose');
const symmetryToggle = document.getElementById('symmetryToggle');
const symmetryState = document.getElementById('symmetryState');
const randomiseProportionsButton = document.getElementById('randomiseProportions');
const headSizeValue = document.getElementById('headSizeValue');
const torsoLengthValue = document.getElementById('torsoLengthValue');
const torsoWidthValue = document.getElementById('torsoWidthValue');
const pelvisWidthValue = document.getElementById('pelvisWidthValue');
const legLengthValue = document.getElementById('legLengthValue');
const shoulderValue = document.getElementById('shoulderValue');
const headSizeDescription = document.getElementById('headSizeDescription');
const torsoLengthDescription = document.getElementById('torsoLengthDescription');
const torsoWidthDescription = document.getElementById('torsoWidthDescription');
const pelvisWidthDescription = document.getElementById('pelvisWidthDescription');
const legLengthDescription = document.getElementById('legLengthDescription');
const shoulderDescription = document.getElementById('shoulderDescription');

function randomBetween(min, max, random = Math.random) {
  return min + random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createGenerationSeed() {
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0];
  }

  return Math.floor(Math.random() * 0x100000000);
}

function createSeededRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  };
}

const shapeWeightControls = [
  { checkbox: cbCircle, input: wCircle, percentage: circlePercentage, role: circleRole },
  { checkbox: cbSquare, input: wSquare, percentage: squarePercentage, role: squareRole },
  { checkbox: cbTriangle, input: wTriangle, percentage: trianglePercentage, role: triangleRole },
];

function updateShapeWeightFeedback() {
  const entries = shapeWeightControls.map(control => ({
    ...control,
    weight: control.checkbox.checked
      ? clamp(Number.parseFloat(control.input.value) || 0, 0, 10)
      : 0,
  }));
  const activeEntries = entries.filter(entry => entry.weight > 0);
  const totalWeight = activeEntries.reduce((sum, entry) => sum + entry.weight, 0);
  const highestWeight = activeEntries.length
    ? Math.max(...activeEntries.map(entry => entry.weight))
    : 0;
  const lowestWeight = activeEntries.length
    ? Math.min(...activeEntries.map(entry => entry.weight))
    : 0;

  entries.forEach(entry => {
    const percentage = totalWeight > 0 ? Math.round((entry.weight / totalWeight) * 100) : 0;
    let role = 'Off';

    if (entry.weight === highestWeight && entry.weight > 0) {
      role = 'Primary';
    } else if (entry.weight > 0 && activeEntries.length >= 3 && entry.weight === lowestWeight) {
      role = 'Accent';
    } else if (entry.weight > 0) {
      role = 'Secondary';
    }

    entry.percentage.textContent = `${percentage}%`;
    entry.role.textContent = role;
    entry.role.dataset.role = role.toLowerCase();
  });
}

const proportionControls = [
  {
    key: 'headSize',
    input: headSizeControl,
    numberInput: headSizeValue,
    description: headSizeDescription,
    labels: { veryLow: 'Very Small', low: 'Small', middle: 'Neutral', high: 'Large', veryHigh: 'Very Large' },
  },
  {
    key: 'torsoLength',
    input: torsoLengthControl,
    numberInput: torsoLengthValue,
    description: torsoLengthDescription,
    labels: { veryLow: 'Very Short', low: 'Short', middle: 'Neutral', high: 'Long', veryHigh: 'Very Long' },
  },
  {
    key: 'torsoWidth',
    input: torsoWidthControl,
    numberInput: torsoWidthValue,
    description: torsoWidthDescription,
    labels: { veryLow: 'Very Narrow', low: 'Narrow', middle: 'Neutral', high: 'Wide', veryHigh: 'Very Wide' },
  },
  {
    key: 'pelvisWidth',
    input: pelvisWidthControl,
    numberInput: pelvisWidthValue,
    description: pelvisWidthDescription,
    labels: { veryLow: 'Very Narrow', low: 'Narrow', middle: 'Neutral', high: 'Wide', veryHigh: 'Very Wide' },
  },
  {
    key: 'legLength',
    input: legLengthControl,
    numberInput: legLengthValue,
    description: legLengthDescription,
    labels: { veryLow: 'Very Short', low: 'Short', middle: 'Neutral', high: 'Long', veryHigh: 'Very Long' },
  },
  {
    key: 'shoulderWidth',
    input: shoulderControl,
    numberInput: shoulderValue,
    description: shoulderDescription,
    labels: { veryLow: 'Very Narrow', low: 'Narrow', middle: 'Neutral', high: 'Wide', veryHigh: 'Very Wide' },
  },
];

const normalSliderRange = { min: 0.6, max: 1.4 };
// Styles provide a starting point and safe randomisation ranges only.
// The individual controls remain the source of truth for generation.
const proportionStyles = {
  balanced: {
    defaults: {
      headSize: 0.9,
      torsoLength: 0.95,
      torsoWidth: 1.1,
      pelvisWidth: 1,
      legLength: 1.15,
      shoulderWidth: 1.1,
    },
    ranges: {
      headSize: [0.8, 1.05], torsoLength: [0.85, 1.1], torsoWidth: [0.9, 1.25],
      pelvisWidth: [0.85, 1.15], legLength: [1, 1.3], shoulderWidth: [0.95, 1.25],
    },
  },
  topHeavy: {
    defaults: {
      headSize: 0.85,
      torsoLength: 1.05,
      torsoWidth: 1.3,
      pelvisWidth: 0.85,
      legLength: 1,
      shoulderWidth: 1.3,
    },
    ranges: {
      headSize: [0.75, 0.95], torsoLength: [0.95, 1.2], torsoWidth: [1.15, 1.4],
      pelvisWidth: [0.75, 1], legLength: [0.9, 1.15], shoulderWidth: [1.15, 1.4],
    },
  },
  bottomHeavy: {
    defaults: {
      headSize: 0.95,
      torsoLength: 0.9,
      torsoWidth: 0.9,
      pelvisWidth: 1.3,
      legLength: 1.1,
      shoulderWidth: 0.9,
    },
    ranges: {
      headSize: [0.85, 1.1], torsoLength: [0.8, 1.05], torsoWidth: [0.75, 1.05],
      pelvisWidth: [1.15, 1.4], legLength: [1, 1.25], shoulderWidth: [0.75, 1.05],
    },
  },
  longLegged: {
    defaults: {
      headSize: 0.8,
      torsoLength: 0.85,
      torsoWidth: 1,
      pelvisWidth: 0.9,
      legLength: 1.4,
      shoulderWidth: 1.05,
    },
    ranges: {
      headSize: [0.7, 0.95], torsoLength: [0.75, 1], torsoWidth: [0.85, 1.15],
      pelvisWidth: [0.8, 1.05], legLength: [1.25, 1.55], shoulderWidth: [0.9, 1.2],
    },
  },
  compact: {
    defaults: {
      headSize: 1.15,
      torsoLength: 0.75,
      torsoWidth: 1.15,
      pelvisWidth: 1.1,
      legLength: 0.75,
      shoulderWidth: 1.05,
    },
    ranges: {
      headSize: [1, 1.3], torsoLength: [0.65, 0.9], torsoWidth: [1, 1.3],
      pelvisWidth: [0.95, 1.3], legLength: [0.65, 0.9], shoulderWidth: [0.9, 1.2],
    },
  },
};
const editableJointNames = [
  'headAnchor', 'neckAnchor', 'pelvisCenter',
  'leftShoulder', 'rightShoulder',
  'leftElbow', 'rightElbow',
  'leftWrist', 'rightWrist',
  'leftHip', 'rightHip',
  'leftKnee', 'rightKnee',
  'leftAnkle', 'rightAnkle',
];
const poseOffsets = Object.fromEntries(
  editableJointNames.map(name => [name, { x: 0, y: 0 }]),
);
const mirroredJointPairs = {
  leftShoulder: 'rightShoulder',
  rightShoulder: 'leftShoulder',
  leftElbow: 'rightElbow',
  rightElbow: 'leftElbow',
  leftWrist: 'rightWrist',
  rightWrist: 'leftWrist',
  leftHip: 'rightHip',
  rightHip: 'leftHip',
  leftKnee: 'rightKnee',
  rightKnee: 'leftKnee',
  leftAnkle: 'rightAnkle',
  rightAnkle: 'leftAnkle',
};

let currentMassVariation = null;
let currentShapeLanguage = null;
let currentPoseView = null;
let activePoseJoint = null;
let lastPointerPosition = null;

function updateProportionLabel(control, value) {
  if (value < normalSliderRange.min) {
    control.description.textContent = control.labels.veryLow;
  } else if (value < 0.9) {
    control.description.textContent = control.labels.low;
  } else if (value <= 1.1) {
    control.description.textContent = control.labels.middle;
  } else if (value <= normalSliderRange.max) {
    control.description.textContent = control.labels.high;
  } else {
    control.description.textContent = control.labels.veryHigh;
  }
}

function updateSliderRange(control, value) {
  control.input.min = Math.min(normalSliderRange.min, value).toFixed(2);
  control.input.max = Math.max(normalSliderRange.max, value).toFixed(2);
}

function updateFromSlider(control) {
  const value = Number.parseFloat(control.input.value);
  control.numberInput.value = value.toFixed(2);
  updateProportionLabel(control, value);
}

function normaliseManualValue(control, value) {
  const minimum = Number.parseFloat(control.numberInput.min);
  const maximum = Number.parseFloat(control.numberInput.max);
  const step = Number.parseFloat(control.numberInput.step);
  const clampedValue = clamp(value, minimum, maximum);

  return Math.round(clampedValue / step) * step;
}

function updateFromNumber(control, commitValue = false) {
  const enteredValue = Number.parseFloat(control.numberInput.value);
  if (!Number.isFinite(enteredValue)) return;

  if (!commitValue && control.numberInput.validity && !control.numberInput.validity.valid) {
    return;
  }

  const value = normaliseManualValue(control, enteredValue);
  control.numberInput.value = value.toFixed(2);
  updateSliderRange(control, value);
  control.input.value = value.toFixed(2);
  updateProportionLabel(control, value);
}

function setProportionValue(control, value) {
  updateSliderRange(control, value);
  control.input.value = value.toFixed(2);
  updateFromSlider(control);
}

function applyProportionStyle(styleName) {
  const style = proportionStyles[styleName] || proportionStyles.balanced;

  proportionControls.forEach(control => {
    setProportionValue(control, style.defaults[control.key]);
  });
}

function randomiseProportions() {
  const style = proportionStyles[proportionStyleControl.value] || proportionStyles.balanced;

  proportionControls.forEach(control => {
    const [minimum, maximum] = style.ranges[control.key];
    const step = Number.parseFloat(control.input.step);
    const stepCount = Math.round((maximum - minimum) / step);
    const randomStep = Math.floor(Math.random() * (stepCount + 1));
    const value = minimum + randomStep * step;

    setProportionValue(control, value);
  });
}

function getShapeLanguage() {
  const intensity = Number.parseFloat(shapeIntensityControl.value) || 1;
  const rigidityName = shapeRigidityControl.value;
  const rigidityValues = { organic: 0.18, balanced: 0.58, geometric: 1 };
  const rigidity = rigidityValues[rigidityName] ?? rigidityValues.balanced;
  const contourVariationName = contourVariationControl.value;
  const contourVariationValues = { clean: 0.008, natural: 0.035, expressive: 0.07 };
  const options = [
    { name: 'circle', enabled: cbCircle.checked, weight: Number.parseFloat(wCircle.value) || 0 },
    { name: 'square', enabled: cbSquare.checked, weight: Number.parseFloat(wSquare.value) || 0 },
    { name: 'triangle', enabled: cbTriangle.checked, weight: Number.parseFloat(wTriangle.value) || 0 },
  ].map(option => ({ ...option, weight: clamp(option.weight, 0, 10) }));

  const active = options.filter(option => option.enabled && option.weight > 0);
  if (active.length === 0) return null;

  const totalWeight = active.reduce((sum, option) => sum + option.weight, 0);
  const ratios = { circle: 0, square: 0, triangle: 0 };

  active.forEach(option => {
    ratios[option.name] = option.weight / totalWeight;
  });
  const shapeBlend = { ...ratios };

  return {
    intensity,
    rigidity,
    rigidityName,
    contourVariationName,
    contourVariation: contourVariationValues[contourVariationName]
      ?? contourVariationValues.natural,
    shapeBlend,
    massBias: massBiasControl.value,
    taperDirection: taperDirectionControl.value,
    circleStrength: clamp(shapeBlend.circle * intensity, 0, 1.45),
    squareStrength: clamp(shapeBlend.square * intensity, 0, 1.45),
    triangleStrength: clamp(shapeBlend.triangle * intensity, 0, 1.45),
  };
}

function makeMass(name, start, end, startWidth, endWidth, taperDirection = 'toEnd', options = {}) {
  return { name, start, end, startWidth, endWidth, taperDirection, ...options };
}

function createProceduralContourProfile(language, random) {
  const { circle, square, triangle } = language.shapeBlend;
  const variationLevel = clamp(language.contourVariation / 0.07, 0, 1);
  const nodeCount = { clean: 2, natural: 3, expressive: 4 }[language.contourVariationName] ?? 3;
  const grammarScale = language.intensity * (0.72 + variationLevel * 0.28);
  const circleAmplitude = circle * (0.055 + variationLevel * 0.025) * grammarScale;
  const squareAmplitude = square * (0.035 + variationLevel * 0.03) * grammarScale;
  const triangleAmplitude = triangle * (0.085 + variationLevel * 0.055) * grammarScale;
  const strongCornerIndex = triangle > 0.25 && random() < 0.28 + triangle * 0.35
    ? Math.floor(random() * nodeCount)
    : -1;
  const strongCornerSide = random() < 0.5 ? 'left' : 'right';
  let squarePlateau = randomBetween(-0.7, 0.7, random);

  const nodes = Array.from({ length: nodeCount }, (_, index) => {
    const baseT = (index + 1) / (nodeCount + 1);
    const tJitter = randomBetween(-0.025, 0.025, random) * variationLevel;
    const t = clamp(baseT + tJitter, 0.12, 0.88);
    const circleBulge = Math.sin(Math.PI * t)
      * circleAmplitude
      * randomBetween(0.78, 1.14, random);

    if (index === 0 || random() > 0.65) {
      squarePlateau = randomBetween(-0.7, 0.7, random);
    }
    const squareStep = squarePlateau * squareAmplitude;

    const directionalSlope = (t - 0.5) * 2
      * triangleAmplitude
      * randomBetween(-0.65, 0.65, random);
    let leftOffset = circleBulge + squareStep + directionalSlope
      + randomBetween(-0.35, 0.35, random) * triangleAmplitude;
    let rightOffset = circleBulge + squareStep + directionalSlope
      + randomBetween(-0.35, 0.35, random) * triangleAmplitude;
    const baseSharpness = square * (0.32 + language.rigidity * 0.4)
      + triangle * (0.28 + language.rigidity * 0.55)
      - circle * 0.18;
    let leftSharpness = baseSharpness;
    let rightSharpness = baseSharpness;

    if (index === strongCornerIndex) {
      const cornerDirection = random() < 0.5 ? -1 : 1;
      const cornerOffset = triangleAmplitude
        * (0.72 + language.rigidity * 0.52)
        * cornerDirection;

      if (strongCornerSide === 'left') {
        leftOffset += cornerOffset;
        leftSharpness += triangle * (0.16 + language.rigidity * 0.18);
      } else {
        rightOffset += cornerOffset;
        rightSharpness += triangle * (0.16 + language.rigidity * 0.18);
      }
    }

    return {
      t,
      leftOffset: clamp(leftOffset, -0.22, 0.26),
      rightOffset: clamp(rightOffset, -0.22, 0.26),
      leftSharpness: clamp(leftSharpness, 0, 0.94),
      rightSharpness: clamp(rightSharpness, 0, 0.94),
    };
  });

  return {
    startScale: 1 + randomBetween(-language.contourVariation, language.contourVariation, random) * 0.45,
    endScale: 1 + randomBetween(-language.contourVariation, language.contourVariation, random) * 0.45,
    leftCurve: randomBetween(-language.contourVariation, language.contourVariation, random),
    rightCurve: randomBetween(-language.contourVariation, language.contourVariation, random),
    direction: randomBetween(-language.contourVariation, language.contourVariation, random),
    nodes,
  };
}

function createMassVariation(language, random, seed) {
  const contourAmount = language.contourVariation;
  const distributionAmount = 0.02 + contourAmount * 0.6;
  const vary = amount => 1 + randomBetween(-amount, amount, random);
  const massNames = [
    'leftLowerLeg', 'rightLowerLeg',
    'leftUpperLeg', 'rightUpperLeg',
    'leftLowerArm', 'rightLowerArm',
    'leftUpperArm', 'rightUpperArm',
    'pelvis', 'torso', 'neck', 'head',
  ];
  const contours = Object.fromEntries(
    massNames.map(name => [name, createProceduralContourProfile(language, random)]),
  );

  // Broad mass shifts stay correlated and restrained. Finer irregularity is
  // stored per contour so redrawing an edited pose never causes visual jitter.
  return {
    upperMass: vary(distributionAmount),
    lowerMass: vary(distributionAmount),
    limbMass: vary(distributionAmount * 0.8),
    torsoTopBias: vary(contourAmount * 0.7),
    torsoBottomBias: vary(contourAmount * 0.55),
    headWidth: vary(distributionAmount * 0.8),
    pelvisWidth: vary(contourAmount * 0.65),
    seed,
    contours,
  };
}

function buildDefaultSkeleton(proportions) {
  const headSize = proportions.headSize;
  const torsoLengthScale = proportions.torsoLength;
  const torsoWidthScale = proportions.torsoWidth;
  const pelvisWidthScale = proportions.pelvisWidth;
  const legLengthScale = proportions.legLength;
  const shoulderWidthScale = proportions.shoulderWidth;
  const cx = canvas.width / 2;
  const top = 38;

  const headHeight = 76 * headSize;
  const torsoLength = 180 * torsoLengthScale;
  const baseShoulderWidth = 176 * torsoWidthScale * shoulderWidthScale;
  const pelvisHeight = 66;
  const basePelvisWidth = 142 * pelvisWidthScale;

  const headTop = { x: cx, y: top };
  const headBottom = { x: cx, y: top + headHeight };
  const headAnchor = { x: cx, y: top + headHeight / 2 };
  const neckAnchor = { x: cx, y: headBottom.y + 10 };
  const torsoBottom = { x: cx, y: neckAnchor.y + torsoLength };
  const pelvisTop = { x: cx, y: torsoBottom.y - 18 };
  const pelvisBottom = { x: cx, y: pelvisTop.y + pelvisHeight };
  const pelvisCenter = {
    x: cx,
    y: (pelvisTop.y + pelvisBottom.y) / 2,
  };

  // Mirrored shoulder points sit below the neck anchor, giving the shoulder
  // construction line a relaxed downward slope on both sides.
  const shoulderY = neckAnchor.y + 30 * clamp(torsoLengthScale, 0.7, 1.3);
  const shoulderHalfWidth = baseShoulderWidth * 0.44;
  const leftShoulder = { x: cx - shoulderHalfWidth, y: shoulderY };
  const rightShoulder = { x: cx + shoulderHalfWidth, y: shoulderY };

  const upperArmLength = 118;
  const lowerArmLength = 124;
  const armOutward = 0.5;
  const armDrop = Math.sqrt(1 - armOutward * armOutward);
  const leftElbow = {
    x: leftShoulder.x - upperArmLength * armOutward,
    y: leftShoulder.y + upperArmLength * armDrop,
  };
  const rightElbow = {
    x: rightShoulder.x + upperArmLength * armOutward,
    y: rightShoulder.y + upperArmLength * armDrop,
  };

  // Continue the forearms along the same axis for a clean concept-art
  // A-pose. The elbow and wrist landmarks remain independently editable.
  const leftWrist = {
    x: leftElbow.x - lowerArmLength * armOutward,
    y: leftElbow.y + lowerArmLength * armDrop,
  };
  const rightWrist = {
    x: rightElbow.x + lowerArmLength * armOutward,
    y: rightElbow.y + lowerArmLength * armDrop,
  };

  const hipHalfWidth = basePelvisWidth * 0.27;
  const leftHip = { x: pelvisBottom.x - hipHalfWidth, y: pelvisBottom.y - 12 };
  const rightHip = { x: pelvisBottom.x + hipHalfWidth, y: pelvisBottom.y - 12 };
  const upperLegLength = 158 * legLengthScale;
  const lowerLegLength = 166 * legLengthScale;
  const kneeSpread = 0.08;
  const ankleSpread = 0.035;
  const leftKnee = {
    x: leftHip.x - upperLegLength * kneeSpread,
    y: leftHip.y + upperLegLength,
  };
  const rightKnee = {
    x: rightHip.x + upperLegLength * kneeSpread,
    y: rightHip.y + upperLegLength,
  };
  const leftAnkle = {
    x: leftKnee.x - lowerLegLength * ankleSpread,
    y: leftKnee.y + lowerLegLength,
  };
  const rightAnkle = {
    x: rightKnee.x + lowerLegLength * ankleSpread,
    y: rightKnee.y + lowerLegLength,
  };

  return {
    headTop,
    headBottom,
    headAnchor,
    neckAnchor,
    torsoBottom,
    pelvisTop,
    pelvisBottom,
    pelvisCenter,
    leftShoulder,
    rightShoulder,
    leftElbow,
    rightElbow,
    leftWrist,
    rightWrist,
    leftHip,
    rightHip,
    leftKnee,
    rightKnee,
    leftAnkle,
    rightAnkle,
  };
}

function applyPoseOffsets(skeleton) {
  const posedSkeleton = Object.fromEntries(
    Object.entries(skeleton).map(([name, point]) => [name, { ...point }]),
  );

  // Moving the pelvis centre shifts the pelvis and hip anchors as one
  // structural unit. Knees and ankles remain independent landmark edits.
  const pelvisOffset = poseOffsets.pelvisCenter;
  ['pelvisCenter', 'torsoBottom', 'pelvisTop', 'pelvisBottom', 'leftHip', 'rightHip'].forEach(name => {
    posedSkeleton[name].x += pelvisOffset.x;
    posedSkeleton[name].y += pelvisOffset.y;
  });

  // The head anchor is a translation control: both head endpoints move by
  // the same amount, so Head Size remains entirely proportion-driven.
  const headOffset = poseOffsets.headAnchor;
  ['headAnchor', 'headTop', 'headBottom'].forEach(name => {
    posedSkeleton[name].x += headOffset.x;
    posedSkeleton[name].y += headOffset.y;
  });

  editableJointNames
    .filter(name => name !== 'headAnchor' && name !== 'pelvisCenter')
    .forEach(name => {
      posedSkeleton[name].x += poseOffsets[name].x;
      posedSkeleton[name].y += poseOffsets[name].y;
    });

  return posedSkeleton;
}

function getMassBiasScales(language) {
  if (language.massBias === 'top') return { upper: 1.2, lower: 0.88 };
  if (language.massBias === 'bottom') return { upper: 0.88, lower: 1.2 };
  return { upper: 1, lower: 1 };
}

function buildBodyMasses(proportions, skeleton, variation, language) {
  const bias = getMassBiasScales(language);
  const contourFullness = 1 + language.circleStrength * 0.1 + language.squareStrength * 0.025;
  const torsoScale = proportions.torsoWidth;
  const pelvisScale = proportions.pelvisWidth;
  const limbUpperScale = clamp(Math.sqrt(torsoScale), 0.65, 1.45);
  const limbLowerScale = clamp(Math.sqrt(pelvisScale), 0.65, 1.45);
  const torsoTopWidth = 176 * torsoScale * proportions.shoulderWidth
    * variation.upperMass * variation.torsoTopBias * contourFullness * bias.upper;
  const pelvisWidth = 142 * pelvisScale
    * variation.lowerMass * variation.pelvisWidth * contourFullness * bias.lower;
  const torsoBottomBiasScale = 1 + (bias.upper - 1) * 0.45;
  const rawTorsoBottomWidth = 132 * torsoScale
    * variation.lowerMass * variation.torsoBottomBias * contourFullness * torsoBottomBiasScale;
  const rhythmBlend = { top: 0.22, balanced: 0.38, bottom: 0.52 }[language.massBias] ?? 0.38;
  const torsoBottomWidth = rawTorsoBottomWidth * (1 - rhythmBlend)
    + pelvisWidth * rhythmBlend;
  const pelvisTopWidth = torsoBottomWidth * 0.45 + pelvisWidth * 0.55;
  const headWidth = 72 * proportions.headSize * variation.headWidth;
  const neckWidth = Math.max(18, Math.min(headWidth * 0.52, torsoTopWidth * 0.28));
  const armWidth = 50 * limbUpperScale * variation.limbMass * contourFullness * bias.upper;
  const elbowWidth = 40 * limbUpperScale * variation.limbMass * contourFullness * bias.upper;
  const thighWidth = 76 * limbLowerScale * variation.lowerMass * contourFullness * bias.lower;
  const kneeWidth = 50 * limbLowerScale * variation.limbMass * contourFullness * bias.lower;
  const massOptions = (name, options = {}) => ({
    contour: variation.contours[name],
    ...options,
  });

  return [
    makeMass(
      'leftLowerLeg', skeleton.leftKnee, skeleton.leftAnkle,
      kneeWidth, kneeWidth * 0.58, 'toEnd',
      massOptions('leftLowerLeg', { lockStartWidth: true, jointOverlap: true }),
    ),
    makeMass(
      'rightLowerLeg', skeleton.rightKnee, skeleton.rightAnkle,
      kneeWidth, kneeWidth * 0.58, 'toEnd',
      massOptions('rightLowerLeg', { lockStartWidth: true, jointOverlap: true }),
    ),
    makeMass(
      'leftUpperLeg', skeleton.leftHip, skeleton.leftKnee,
      thighWidth, kneeWidth, 'toEnd',
      massOptions('leftUpperLeg', { lockEndWidth: true, jointOverlap: true }),
    ),
    makeMass(
      'rightUpperLeg', skeleton.rightHip, skeleton.rightKnee,
      thighWidth, kneeWidth, 'toEnd',
      massOptions('rightUpperLeg', { lockEndWidth: true, jointOverlap: true }),
    ),
    makeMass(
      'leftLowerArm', skeleton.leftElbow, skeleton.leftWrist,
      elbowWidth, elbowWidth * 0.58, 'toEnd',
      massOptions('leftLowerArm', { lockStartWidth: true, jointOverlap: true }),
    ),
    makeMass(
      'rightLowerArm', skeleton.rightElbow, skeleton.rightWrist,
      elbowWidth, elbowWidth * 0.58, 'toEnd',
      massOptions('rightLowerArm', { lockStartWidth: true, jointOverlap: true }),
    ),
    makeMass(
      'leftUpperArm', skeleton.leftShoulder, skeleton.leftElbow,
      armWidth, elbowWidth, 'toEnd',
      massOptions('leftUpperArm', { lockEndWidth: true, jointOverlap: true }),
    ),
    makeMass(
      'rightUpperArm', skeleton.rightShoulder, skeleton.rightElbow,
      armWidth, elbowWidth, 'toEnd',
      massOptions('rightUpperArm', { lockEndWidth: true, jointOverlap: true }),
    ),
    makeMass(
      'pelvis', skeleton.pelvisTop, skeleton.pelvisBottom,
      pelvisTopWidth, pelvisWidth, 'toStart', massOptions('pelvis'),
    ),
    makeMass(
      'torso', skeleton.neckAnchor, skeleton.torsoBottom,
      torsoTopWidth, torsoBottomWidth, 'toEnd', massOptions('torso'),
    ),
    makeMass(
      'neck', skeleton.headBottom, skeleton.neckAnchor,
      neckWidth, neckWidth * 1.12, 'toStart',
      massOptions('neck', { jointOverlap: true }),
    ),
    makeMass(
      'head', skeleton.headTop, skeleton.headBottom,
      headWidth, headWidth * 0.9, 'toEnd', massOptions('head'),
    ),
  ];
}

function getMassBounds(masses) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  masses.forEach(mass => {
    // Rounded high-intensity caps can extend farther along a mass axis than
    // the original neutral contour, so keep a conservative framing radius.
    const radius = Math.max(mass.startWidth, mass.endWidth) * 0.84;
    [mass.start, mass.end].forEach(point => {
      minX = Math.min(minX, point.x - radius);
      minY = Math.min(minY, point.y - radius);
      maxX = Math.max(maxX, point.x + radius);
      maxY = Math.max(maxY, point.y + radius);
    });
  });

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function getFrameTransform(masses) {
  const margin = 24;
  const bounds = getMassBounds(masses);
  const scale = Math.min(
    1,
    (canvas.width - margin * 2) / bounds.width,
    (canvas.height - margin * 2) / bounds.height,
  );
  const offsetX = (canvas.width - bounds.width * scale) / 2 - bounds.minX * scale;
  const offsetY = (canvas.height - bounds.height * scale) / 2 - bounds.minY * scale;

  return { scale, offsetX, offsetY };
}

function transformPoint(point, transform) {
  return {
    x: point.x * transform.scale + transform.offsetX,
    y: point.y * transform.scale + transform.offsetY,
  };
}

function fitMassesToFrame(masses, transform = getFrameTransform(masses)) {

  return masses.map(mass => ({
    ...mass,
    start: transformPoint(mass.start, transform),
    end: transformPoint(mass.end, transform),
    startWidth: mass.startWidth * transform.scale,
    endWidth: mass.endWidth * transform.scale,
  }));
}

function getMassRegion(name) {
  if (name === 'torso') return 'torso';
  if (name === 'pelvis') return 'pelvis';
  if (name === 'head') return 'head';
  if (name === 'neck') return 'neck';
  return 'limb';
}

function getMassGeometry(mass, language) {
  const dx = mass.end.x - mass.start.x;
  const dy = mass.end.y - mass.start.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const axis = { x: dx / length, y: dy / length };
  const normal = { x: -axis.y, y: axis.x };
  let startWidth = mass.startWidth;
  let endWidth = mass.endWidth;
  const sharedStartWidth = startWidth;
  const sharedEndWidth = endWidth;
  const contour = mass.contour || {
    startScale: 1,
    endScale: 1,
    leftCurve: 0,
    rightCurve: 0,
    direction: 0,
  };
  const region = getMassRegion(mass.name);

  if (!mass.lockStartWidth) startWidth *= contour.startScale;
  if (!mass.lockEndWidth) endWidth *= contour.endScale;

  const circleEvenness = {
    torso: 0.2,
    pelvis: 0.18,
    limb: 0.1,
    neck: 0.08,
    head: 0.12,
  }[region];
  const evenness = clamp(
    language.squareStrength * 0.48 + language.circleStrength * circleEvenness,
    0,
    0.68,
  );
  const averageWidth = (startWidth + endWidth) / 2;
  startWidth += (averageWidth - startWidth) * evenness;
  endWidth += (averageWidth - endWidth) * evenness;

  let taperDirection = mass.taperDirection;
  if (language.taperDirection === 'top') taperDirection = 'toEnd';
  if (language.taperDirection === 'bottom') taperDirection = 'toStart';

  const regionTaper = {
    torso: 0.2,
    pelvis: 0.16,
    limb: 0.22,
    neck: 0.12,
    head: 0.08,
  }[region];
  const taperAmount = clamp(
    language.triangleStrength * regionTaper * (0.65 + language.rigidity * 0.35),
    0,
    0.32,
  );
  if (taperDirection === 'toEnd') {
    endWidth *= 1 - taperAmount;
  } else {
    startWidth *= 1 - taperAmount;
  }

  // Preserve one shared width at articulated joins after contour modifiers.
  // This keeps elbows and knees continuous without introducing an IK system.
  if (mass.lockStartWidth) startWidth = sharedStartWidth;
  if (mass.lockEndWidth) endWidth = sharedEndWidth;

  const overlapRatio = clamp(
    0.17 + language.circleStrength * 0.06 - language.squareStrength * 0.01
      + (mass.jointOverlap ? 0.05 : 0),
    0.14,
    0.28,
  );
  const overlap = Math.min(startWidth, endWidth) * overlapRatio;
  const start = {
    x: mass.start.x - axis.x * overlap,
    y: mass.start.y - axis.y * overlap,
  };
  const end = {
    x: mass.end.x + axis.x * overlap,
    y: mass.end.y + axis.y * overlap,
  };
  const startRadius = startWidth / 2;
  const endRadius = endWidth / 2;

  return {
    axis,
    normal,
    start,
    end,
    startRadius,
    endRadius,
    taperDirection,
    contour,
    region,
    startLeft: { x: start.x + normal.x * startRadius, y: start.y + normal.y * startRadius },
    startRight: { x: start.x - normal.x * startRadius, y: start.y - normal.y * startRadius },
    endLeft: { x: end.x + normal.x * endRadius, y: end.y + normal.y * endRadius },
    endRight: { x: end.x - normal.x * endRadius, y: end.y - normal.y * endRadius },
  };
}

function traceContourSide(points) {
  const lastIndex = points.length - 1;

  for (let index = 1; index < lastIndex; index += 1) {
    const point = points[index];
    const nextPoint = points[index + 1];

    if (point.sharpness >= 0.66) {
      ctx.lineTo(point.x, point.y);
    } else {
      ctx.quadraticCurveTo(
        point.x,
        point.y,
        (point.x + nextPoint.x) / 2,
        (point.y + nextPoint.y) / 2,
      );
    }
  }

  const endPoint = points[lastIndex];
  ctx.lineTo(endPoint.x, endPoint.y);
}

function traceProfiledMass(geometry, language) {
  const {
    axis,
    normal,
    start,
    end,
    startRadius,
    endRadius,
    startLeft,
    startRight,
    endLeft,
    endRight,
    contour,
    region,
  } = geometry;
  const regionCurve = {
    torso: 1.15,
    pelvis: 1.08,
    limb: 0.72,
    neck: 0.55,
    head: 1.2,
  }[region];
  const baseBend = 0.012
    + language.circleStrength * 0.14 * regionCurve
    + (1 - language.rigidity) * 0.025
    - language.squareStrength * 0.022
    - language.triangleStrength * 0.012;
  const leftBend = clamp(baseBend + contour.leftCurve, -0.035, 0.26);
  const rightBend = clamp(baseBend + contour.rightCurve, -0.035, 0.26);
  const capRound = clamp(
    0.48
      + language.circleStrength * 0.32
      - language.squareStrength * (region === 'torso' || region === 'pelvis' ? 0.24 : 0.16)
      - language.triangleStrength * 0.08
      - language.rigidity * 0.06,
    0.18,
    0.94,
  );
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  const contourNodes = contour.nodes || [];
  const leftPoints = [{ ...startLeft, sharpness: 0 }];
  const rightPoints = [{ ...startRight, sharpness: 0 }];

  contourNodes.forEach(node => {
    const centre = {
      x: start.x + axis.x * length * node.t,
      y: start.y + axis.y * length * node.t,
    };
    const radius = startRadius + (endRadius - startRadius) * node.t;
    const flow = Math.sin(Math.PI * node.t);
    const centreShift = contour.direction * radius * 0.35 * flow;
    const leftRadius = radius * (1 + node.leftOffset + leftBend * flow);
    const rightRadius = radius * (1 + node.rightOffset + rightBend * flow);

    leftPoints.push({
      x: centre.x + normal.x * (leftRadius + centreShift),
      y: centre.y + normal.y * (leftRadius + centreShift),
      sharpness: node.leftSharpness,
    });
    rightPoints.push({
      x: centre.x - normal.x * (rightRadius - centreShift),
      y: centre.y - normal.y * (rightRadius - centreShift),
      sharpness: node.rightSharpness,
    });
  });

  leftPoints.push({ ...endLeft, sharpness: 0 });
  rightPoints.push({ ...endRight, sharpness: 0 });

  ctx.beginPath();
  ctx.moveTo(startLeft.x, startLeft.y);
  traceContourSide(leftPoints);
  ctx.quadraticCurveTo(
    end.x + axis.x * endRadius * capRound,
    end.y + axis.y * endRadius * capRound,
    endRight.x,
    endRight.y,
  );
  traceContourSide([...rightPoints].reverse());
  ctx.quadraticCurveTo(
    start.x - axis.x * startRadius * capRound,
    start.y - axis.y * startRadius * capRound,
    startLeft.x,
    startLeft.y,
  );
  ctx.closePath();
}

function traceMassPath(mass, language) {
  const geometry = getMassGeometry(mass, language);
  traceProfiledMass(geometry, language);
}

function projectPointOntoMassAxis(mass, point) {
  const dx = mass.end.x - mass.start.x;
  const dy = mass.end.y - mass.start.y;
  const lengthSquared = Math.max(1, dx * dx + dy * dy);
  const amount = clamp(
    ((point.x - mass.start.x) * dx + (point.y - mass.start.y) * dy) / lengthSquared,
    0,
    1,
  );

  return {
    x: mass.start.x + dx * amount,
    y: mass.start.y + dy * amount,
  };
}

function fillJointTransition(point, width) {
  const radius = width * 0.48;

  ctx.beginPath();
  ctx.ellipse(point.x, point.y, radius, radius, 0, 0, Math.PI * 2);
  ctx.fill();
}

function fillTaperedTransition(start, end, startWidth, endWidth) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);

  if (length < 0.5) {
    fillJointTransition(start, Math.min(startWidth, endWidth));
    return;
  }

  const axis = { x: dx / length, y: dy / length };
  const normal = { x: -axis.y, y: axis.x };
  const startRadius = startWidth / 2;
  const endRadius = endWidth / 2;
  const startLeft = {
    x: start.x + normal.x * startRadius,
    y: start.y + normal.y * startRadius,
  };
  const startRight = {
    x: start.x - normal.x * startRadius,
    y: start.y - normal.y * startRadius,
  };
  const endLeft = {
    x: end.x + normal.x * endRadius,
    y: end.y + normal.y * endRadius,
  };
  const endRight = {
    x: end.x - normal.x * endRadius,
    y: end.y - normal.y * endRadius,
  };

  ctx.beginPath();
  ctx.moveTo(startLeft.x, startLeft.y);
  ctx.bezierCurveTo(
    startLeft.x + axis.x * length * 0.35,
    startLeft.y + axis.y * length * 0.35,
    endLeft.x - axis.x * length * 0.35,
    endLeft.y - axis.y * length * 0.35,
    endLeft.x,
    endLeft.y,
  );
  ctx.quadraticCurveTo(end.x, end.y, endRight.x, endRight.y);
  ctx.bezierCurveTo(
    endRight.x - axis.x * length * 0.35,
    endRight.y - axis.y * length * 0.35,
    startRight.x + axis.x * length * 0.35,
    startRight.y + axis.y * length * 0.35,
    startRight.x,
    startRight.y,
  );
  ctx.quadraticCurveTo(start.x, start.y, startLeft.x, startLeft.y);
  ctx.closePath();
  ctx.fill();
}

function drawMassTransitions(masses) {
  const byName = Object.fromEntries(masses.map(mass => [mass.name, mass]));
  const bridgeToLimb = (parentName, childName) => {
    const parent = byName[parentName];
    const child = byName[childName];
    const parentPoint = projectPointOntoMassAxis(parent, child.start);

    fillTaperedTransition(
      parentPoint,
      child.start,
      child.startWidth * 0.82,
      child.startWidth * 0.94,
    );
  };
  const bridgeJoint = (proximalName, distalName) => {
    const proximal = byName[proximalName];
    const distal = byName[distalName];
    const width = Math.min(proximal.endWidth, distal.startWidth);

    fillJointTransition(proximal.end, width);
  };

  fillTaperedTransition(
    byName.torso.end,
    byName.pelvis.start,
    byName.torso.endWidth * 0.88,
    byName.pelvis.startWidth * 0.88,
  );

  bridgeToLimb('torso', 'leftUpperArm');
  bridgeToLimb('torso', 'rightUpperArm');
  bridgeToLimb('pelvis', 'leftUpperLeg');
  bridgeToLimb('pelvis', 'rightUpperLeg');

  bridgeJoint('leftUpperArm', 'leftLowerArm');
  bridgeJoint('rightUpperArm', 'rightLowerArm');
  bridgeJoint('leftUpperLeg', 'leftLowerLeg');
  bridgeJoint('rightUpperLeg', 'rightLowerLeg');
  bridgeJoint('head', 'neck');
  bridgeJoint('neck', 'torso');
}

function drawDebugOverlay(masses, language) {
  ctx.save();
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
  ctx.fillStyle = 'rgba(37, 99, 235, 0.9)';
  ctx.lineWidth = 1;

  masses.forEach(mass => {
    traceMassPath(mass, language);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(mass.start.x, mass.start.y);
    ctx.lineTo(mass.end.x, mass.end.y);
    ctx.stroke();

    [mass.start, mass.end].forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  ctx.restore();
}

function transformSkeleton(skeleton, transform) {
  return Object.fromEntries(
    Object.entries(skeleton).map(([name, point]) => [name, transformPoint(point, transform)]),
  );
}

function drawPoseEditor(skeleton) {
  const segments = [
    ['headAnchor', 'neckAnchor'],
    ['neckAnchor', 'leftShoulder'],
    ['neckAnchor', 'rightShoulder'],
    ['neckAnchor', 'pelvisCenter'],
    ['leftShoulder', 'leftElbow'],
    ['leftElbow', 'leftWrist'],
    ['rightShoulder', 'rightElbow'],
    ['rightElbow', 'rightWrist'],
    ['pelvisCenter', 'leftHip'],
    ['pelvisCenter', 'rightHip'],
    ['leftHip', 'leftKnee'],
    ['leftKnee', 'leftAnkle'],
    ['rightHip', 'rightKnee'],
    ['rightKnee', 'rightAnkle'],
  ];

  ctx.save();
  ctx.strokeStyle = 'rgba(37, 99, 235, 0.75)';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  segments.forEach(([startName, endName]) => {
    ctx.moveTo(skeleton[startName].x, skeleton[startName].y);
    ctx.lineTo(skeleton[endName].x, skeleton[endName].y);
  });
  ctx.stroke();

  editableJointNames.forEach(name => {
    const point = skeleton[name];
    ctx.beginPath();
    ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.restore();
}

function getCurrentProportions() {
  return {
    headSize: clamp(Number.parseFloat(headSizeControl.value) || 1, 0.3, 2),
    torsoLength: clamp(Number.parseFloat(torsoLengthControl.value) || 1, 0.3, 2),
    torsoWidth: clamp(Number.parseFloat(torsoWidthControl.value) || 1, 0.3, 2),
    pelvisWidth: clamp(Number.parseFloat(pelvisWidthControl.value) || 1, 0.3, 2),
    legLength: clamp(Number.parseFloat(legLengthControl.value) || 1, 0.3, 2),
    shoulderWidth: clamp(Number.parseFloat(shoulderControl.value) || 1, 0.3, 2),
  };
}

function renderSilhouette() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!currentShapeLanguage || !currentMassVariation) {
    currentPoseView = null;
    return;
  }

  const proportions = getCurrentProportions();
  const skeleton = applyPoseOffsets(buildDefaultSkeleton(proportions));
  const rawMasses = buildBodyMasses(proportions, skeleton, currentMassVariation, currentShapeLanguage);
  const frameTransform = getFrameTransform(rawMasses);
  const masses = fitMassesToFrame(rawMasses, frameTransform);
  const fittedSkeleton = transformSkeleton(skeleton, frameTransform);
  currentPoseView = { landmarks: fittedSkeleton, scale: frameTransform.scale };

  ctx.save();
  ctx.fillStyle = '#111111';
  masses.forEach(mass => {
    traceMassPath(mass, currentShapeLanguage);
    ctx.fill();
  });
  drawMassTransitions(masses);
  ctx.restore();

  if (debugToggle && debugToggle.checked) {
    drawDebugOverlay(masses, currentShapeLanguage);
  }

  if (editPoseToggle.checked) {
    drawPoseEditor(fittedSkeleton);
  }
}

function generateSilhouette(requestedSeed) {
  // Passing a stored canvas.dataset.seed value back as a number reproduces
  // the procedural contour while the same controls and proportions are active.
  const seed = Number.isInteger(requestedSeed)
    ? requestedSeed >>> 0
    : createGenerationSeed();
  const random = createSeededRandom(seed);

  currentShapeLanguage = getShapeLanguage();
  currentMassVariation = currentShapeLanguage
    ? createMassVariation(currentShapeLanguage, random, seed)
    : null;
  canvas.dataset.seed = String(seed);
  renderSilhouette();
}

function getCanvasPointerPosition(event) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
    y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
  };
}

function findPoseJoint(point) {
  if (!currentPoseView) return null;

  let closestJoint = null;
  let closestDistance = 14;

  editableJointNames.forEach(name => {
    const landmark = currentPoseView.landmarks[name];
    const distance = Math.hypot(point.x - landmark.x, point.y - landmark.y);
    if (distance <= closestDistance) {
      closestJoint = name;
      closestDistance = distance;
    }
  });

  return closestJoint;
}

function startPoseDrag(event) {
  if (!editPoseToggle.checked) return;

  const pointerPosition = getCanvasPointerPosition(event);
  const joint = findPoseJoint(pointerPosition);
  if (!joint) return;

  activePoseJoint = joint;
  lastPointerPosition = pointerPosition;
  canvas.classList.add('pose-dragging');
  canvas.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function mirrorPoseJoint(jointName) {
  if (!symmetryToggle.checked) return;

  const mirroredName = mirroredJointPairs[jointName];
  if (!mirroredName) return;

  // Default paired landmarks are mirrored around the character centre.
  // Negating the horizontal offset and copying the vertical offset preserves
  // that relationship without affecting centred head or spine landmarks.
  poseOffsets[mirroredName].x = -poseOffsets[jointName].x;
  poseOffsets[mirroredName].y = poseOffsets[jointName].y;
}

function continuePoseDrag(event) {
  if (!activePoseJoint || !currentPoseView) return;

  const pointerPosition = getCanvasPointerPosition(event);
  const scale = Math.max(0.001, currentPoseView.scale);
  poseOffsets[activePoseJoint].x += (pointerPosition.x - lastPointerPosition.x) / scale;
  poseOffsets[activePoseJoint].y += (pointerPosition.y - lastPointerPosition.y) / scale;
  mirrorPoseJoint(activePoseJoint);
  lastPointerPosition = pointerPosition;

  renderSilhouette();
  event.preventDefault();
}

function endPoseDrag(event) {
  if (!activePoseJoint) return;

  activePoseJoint = null;
  lastPointerPosition = null;
  canvas.classList.remove('pose-dragging');
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

function updateSymmetryState() {
  symmetryState.textContent = symmetryToggle.checked ? 'ON' : 'OFF';
}

proportionControls.forEach(control => {
  control.input.addEventListener('input', () => updateFromSlider(control));
  control.numberInput.addEventListener('input', () => updateFromNumber(control));
  control.numberInput.addEventListener('change', () => updateFromNumber(control, true));
  updateFromSlider(control);
});

shapeWeightControls.forEach(control => {
  control.input.addEventListener('input', updateShapeWeightFeedback);
  control.checkbox.addEventListener('change', updateShapeWeightFeedback);
});
updateShapeWeightFeedback();

proportionStyleControl.addEventListener('change', () => {
  applyProportionStyle(proportionStyleControl.value);
});
randomiseProportionsButton.addEventListener('click', randomiseProportions);
generateButton.addEventListener('click', () => generateSilhouette());
symmetryToggle.addEventListener('change', updateSymmetryState);
editPoseToggle.addEventListener('change', () => {
  canvas.classList.toggle('pose-editing', editPoseToggle.checked);
  if (!editPoseToggle.checked) {
    activePoseJoint = null;
    lastPointerPosition = null;
    canvas.classList.remove('pose-dragging');
  }
  renderSilhouette();
});
canvas.addEventListener('pointerdown', startPoseDrag);
canvas.addEventListener('pointermove', continuePoseDrag);
canvas.addEventListener('pointerup', endPoseDrag);
canvas.addEventListener('pointercancel', endPoseDrag);
updateSymmetryState();
applyProportionStyle(proportionStyleControl.value);
generateSilhouette();
