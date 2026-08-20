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

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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
  const options = [
    { name: 'circle', enabled: cbCircle.checked, weight: Number.parseFloat(wCircle.value) || 0 },
    { name: 'square', enabled: cbSquare.checked, weight: Number.parseFloat(wSquare.value) || 0 },
    { name: 'triangle', enabled: cbTriangle.checked, weight: Number.parseFloat(wTriangle.value) || 0 },
  ].map(option => ({ ...option, weight: clamp(option.weight, 0, 10) }));

  const active = options.filter(option => option.enabled && option.weight > 0);
  if (active.length === 0) return null;

  const highestWeight = Math.max(...active.map(option => option.weight));
  const dominantCandidates = active.filter(option => option.weight === highestWeight);
  const dominant = dominantCandidates[Math.floor(Math.random() * dominantCandidates.length)].name;
  const totalWeight = active.reduce((sum, option) => sum + option.weight, 0);
  const ratios = { circle: 0, square: 0, triangle: 0 };

  active.forEach(option => {
    ratios[option.name] = option.weight / totalWeight;
  });

  // One dominant language keeps the figure coherent; the remaining blend lets
  // every enabled weight influence curvature, blockiness, and taper.
  Object.keys(ratios).forEach(name => {
    ratios[name] = ratios[name] * 0.45 + (name === dominant ? 0.55 : 0);
  });

  return {
    dominant,
    intensity,
    rigidity,
    rigidityName,
    massBias: massBiasControl.value,
    taperDirection: taperDirectionControl.value,
    circleStrength: clamp(ratios.circle * intensity, 0, 1.45),
    squareStrength: clamp(ratios.square * intensity, 0, 1.45),
    triangleStrength: clamp(ratios.triangle * intensity, 0, 1.45),
    roundness: clamp(
      0.1 + ratios.circle * 0.76 * intensity - ratios.square * 0.08 - ratios.triangle * 0.08,
      0.04,
      0.98,
    ),
    blockiness: clamp(0.08 + ratios.square * 0.88 * intensity, 0.08, 1),
    taper: clamp(0.05 + ratios.triangle * 0.72 * intensity, 0.05, 0.95),
  };
}

function makeMass(name, start, end, startWidth, endWidth, taperDirection = 'toEnd', options = {}) {
  return { name, start, end, startWidth, endWidth, taperDirection, ...options };
}

function createMassVariation() {
  return {
    upperMass: randomBetween(0.9, 1.13),
    lowerMass: randomBetween(0.88, 1.14),
    limbMass: randomBetween(0.88, 1.16),
    torsoTopBias: randomBetween(0.9, 1.14),
    torsoBottomBias: randomBetween(0.82, 1.12),
    headWidth: randomBetween(0.88, 1.12),
    pelvisWidth: randomBetween(0.92, 1.12),
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
  const upperArmReach = 0.58;
  const upperArmDrop = 0.82;
  const leftElbow = {
    x: leftShoulder.x - upperArmLength * upperArmReach,
    y: leftShoulder.y + upperArmLength * upperArmDrop,
  };
  const rightElbow = {
    x: rightShoulder.x + upperArmLength * upperArmReach,
    y: rightShoulder.y + upperArmLength * upperArmDrop,
  };
  const forearmBend = 0.12;
  const forearmDrop = Math.sqrt(1 - forearmBend * forearmBend);
  const leftWrist = {
    x: leftElbow.x + lowerArmLength * forearmBend,
    y: leftElbow.y + lowerArmLength * forearmDrop,
  };
  const rightWrist = {
    x: rightElbow.x - lowerArmLength * forearmBend,
    y: rightElbow.y + lowerArmLength * forearmDrop,
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
  const torsoBottomWidth = 132 * torsoScale
    * variation.lowerMass * variation.torsoBottomBias * contourFullness * bias.upper;
  const pelvisWidth = 142 * pelvisScale
    * variation.lowerMass * variation.pelvisWidth * contourFullness * bias.lower;
  const headWidth = 72 * proportions.headSize * variation.headWidth;
  const neckWidth = Math.max(18, Math.min(headWidth * 0.52, torsoTopWidth * 0.28));
  const armWidth = 50 * limbUpperScale * variation.limbMass * contourFullness * bias.upper;
  const elbowWidth = 40 * limbUpperScale * variation.limbMass * contourFullness * bias.upper;
  const thighWidth = 76 * limbLowerScale * variation.lowerMass * contourFullness * bias.lower;
  const kneeWidth = 50 * limbLowerScale * variation.limbMass * contourFullness * bias.lower;

  return [
    makeMass('leftLowerLeg', skeleton.leftKnee, skeleton.leftAnkle, kneeWidth, kneeWidth * 0.58, 'toEnd', { lockStartWidth: true, jointOverlap: true }),
    makeMass('rightLowerLeg', skeleton.rightKnee, skeleton.rightAnkle, kneeWidth, kneeWidth * 0.58, 'toEnd', { lockStartWidth: true, jointOverlap: true }),
    makeMass('leftUpperLeg', skeleton.leftHip, skeleton.leftKnee, thighWidth, kneeWidth, 'toEnd', { lockEndWidth: true, jointOverlap: true }),
    makeMass('rightUpperLeg', skeleton.rightHip, skeleton.rightKnee, thighWidth, kneeWidth, 'toEnd', { lockEndWidth: true, jointOverlap: true }),
    makeMass('leftLowerArm', skeleton.leftElbow, skeleton.leftWrist, elbowWidth, elbowWidth * 0.58, 'toEnd', { lockStartWidth: true, jointOverlap: true }),
    makeMass('rightLowerArm', skeleton.rightElbow, skeleton.rightWrist, elbowWidth, elbowWidth * 0.58, 'toEnd', { lockStartWidth: true, jointOverlap: true }),
    makeMass('leftUpperArm', skeleton.leftShoulder, skeleton.leftElbow, armWidth, elbowWidth, 'toEnd', { lockEndWidth: true, jointOverlap: true }),
    makeMass('rightUpperArm', skeleton.rightShoulder, skeleton.rightElbow, armWidth, elbowWidth, 'toEnd', { lockEndWidth: true, jointOverlap: true }),
    makeMass('pelvis', skeleton.pelvisTop, skeleton.pelvisBottom, pelvisWidth * 0.9, pelvisWidth, 'toStart'),
    makeMass('torso', skeleton.neckAnchor, skeleton.torsoBottom, torsoTopWidth, torsoBottomWidth),
    makeMass('neck', skeleton.headBottom, skeleton.neckAnchor, neckWidth, neckWidth * 1.12, 'toStart', { jointOverlap: true }),
    makeMass('head', skeleton.headTop, skeleton.headBottom, headWidth, headWidth * 0.9),
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
    const radius = Math.max(mass.startWidth, mass.endWidth) * 0.78;
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
  const evenness = clamp(
    language.squareStrength * 0.68 + language.circleStrength * 0.18,
    0,
    0.9,
  );
  const averageWidth = (startWidth + endWidth) / 2;
  startWidth += (averageWidth - startWidth) * evenness;
  endWidth += (averageWidth - endWidth) * evenness;

  let taperDirection = mass.taperDirection;
  if (language.taperDirection === 'top') taperDirection = 'toEnd';
  if (language.taperDirection === 'bottom') taperDirection = 'toStart';

  const taperAmount = clamp(
    language.taper * (0.34 + language.triangleStrength * 0.3),
    0.02,
    0.78,
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
    0.14 + language.circleStrength * 0.08 - language.squareStrength * 0.015
      + (mass.jointOverlap ? 0.05 : 0),
    0.1,
    0.27,
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
    startLeft: { x: start.x + normal.x * startRadius, y: start.y + normal.y * startRadius },
    startRight: { x: start.x - normal.x * startRadius, y: start.y - normal.y * startRadius },
    endLeft: { x: end.x + normal.x * endRadius, y: end.y + normal.y * endRadius },
    endRight: { x: end.x - normal.x * endRadius, y: end.y - normal.y * endRadius },
  };
}

function traceInfluencedMass(geometry, language) {
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
  } = geometry;
  const organicity = 1 - language.rigidity;
  const sideBend = clamp(
    0.015
      + language.circleStrength * 0.16
      + organicity * 0.035
      - language.squareStrength * 0.03
      - language.triangleStrength * 0.025,
    0,
    0.24,
  );
  const capRound = clamp(
    0.34
      + language.circleStrength * 0.5
      + organicity * 0.14
      - language.squareStrength * 0.18
      - language.triangleStrength * 0.14,
    0.12,
    1.05,
  );
  const length = Math.hypot(end.x - start.x, end.y - start.y);

  ctx.beginPath();
  ctx.moveTo(startLeft.x, startLeft.y);
  ctx.bezierCurveTo(
    startLeft.x + axis.x * length * 0.34 + normal.x * startRadius * sideBend,
    startLeft.y + axis.y * length * 0.34 + normal.y * startRadius * sideBend,
    endLeft.x - axis.x * length * 0.34 + normal.x * endRadius * sideBend,
    endLeft.y - axis.y * length * 0.34 + normal.y * endRadius * sideBend,
    endLeft.x,
    endLeft.y,
  );
  ctx.quadraticCurveTo(
    end.x + axis.x * endRadius * capRound,
    end.y + axis.y * endRadius * capRound,
    endRight.x,
    endRight.y,
  );
  ctx.bezierCurveTo(
    endRight.x - axis.x * length * 0.34 - normal.x * endRadius * sideBend,
    endRight.y - axis.y * length * 0.34 - normal.y * endRadius * sideBend,
    startRight.x + axis.x * length * 0.34 - normal.x * startRadius * sideBend,
    startRight.y + axis.y * length * 0.34 - normal.y * startRadius * sideBend,
    startRight.x,
    startRight.y,
  );
  ctx.quadraticCurveTo(
    start.x - axis.x * startRadius * capRound,
    start.y - axis.y * startRadius * capRound,
    startLeft.x,
    startLeft.y,
  );
  ctx.closePath();
}

function traceRoundedMass(geometry, language) {
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
  } = geometry;
  const sideBend = language.roundness * 0.22;
  const capRound = clamp(0.55 + language.roundness * 0.55, 0.55, 1.08);
  const length = Math.hypot(end.x - start.x, end.y - start.y);

  ctx.beginPath();
  ctx.moveTo(startLeft.x, startLeft.y);
  ctx.bezierCurveTo(
    startLeft.x + axis.x * length * 0.34 + normal.x * startRadius * sideBend,
    startLeft.y + axis.y * length * 0.34 + normal.y * startRadius * sideBend,
    endLeft.x - axis.x * length * 0.34 + normal.x * endRadius * sideBend,
    endLeft.y - axis.y * length * 0.34 + normal.y * endRadius * sideBend,
    endLeft.x,
    endLeft.y,
  );
  ctx.quadraticCurveTo(
    end.x + axis.x * endRadius * capRound,
    end.y + axis.y * endRadius * capRound,
    endRight.x,
    endRight.y,
  );
  ctx.bezierCurveTo(
    endRight.x - axis.x * length * 0.34 - normal.x * endRadius * sideBend,
    endRight.y - axis.y * length * 0.34 - normal.y * endRadius * sideBend,
    startRight.x + axis.x * length * 0.34 - normal.x * startRadius * sideBend,
    startRight.y + axis.y * length * 0.34 - normal.y * startRadius * sideBend,
    startRight.x,
    startRight.y,
  );
  ctx.quadraticCurveTo(
    start.x - axis.x * startRadius * capRound,
    start.y - axis.y * startRadius * capRound,
    startLeft.x,
    startLeft.y,
  );
  ctx.closePath();
}

function traceBlockMass(geometry, language) {
  const {
    axis,
    startRadius,
    endRadius,
    startLeft,
    startRight,
    endLeft,
    endRight,
  } = geometry;
  const bevelStrength = clamp(0.26 - language.squareStrength * 0.1, 0.08, 0.22);
  const startBevel = startRadius * bevelStrength;
  const endBevel = endRadius * bevelStrength;

  ctx.beginPath();
  ctx.moveTo(startLeft.x + axis.x * startBevel, startLeft.y + axis.y * startBevel);
  ctx.lineTo(endLeft.x - axis.x * endBevel, endLeft.y - axis.y * endBevel);
  ctx.lineTo(endLeft.x, endLeft.y);
  ctx.lineTo(endRight.x, endRight.y);
  ctx.lineTo(endRight.x - axis.x * endBevel, endRight.y - axis.y * endBevel);
  ctx.lineTo(startRight.x + axis.x * startBevel, startRight.y + axis.y * startBevel);
  ctx.lineTo(startRight.x, startRight.y);
  ctx.lineTo(startLeft.x, startLeft.y);
  ctx.closePath();
}

function traceAngularMass(geometry, language) {
  const {
    axis,
    start,
    end,
    startRadius,
    endRadius,
    startLeft,
    startRight,
    endLeft,
    endRight,
    taperDirection,
  } = geometry;
  const pointStrength = 0.2 + clamp(language.triangleStrength, 0, 1.45) * 0.24;

  ctx.beginPath();
  if (taperDirection === 'toEnd') {
    const endTip = {
      x: end.x + axis.x * endRadius * pointStrength,
      y: end.y + axis.y * endRadius * pointStrength,
    };
    ctx.moveTo(startLeft.x, startLeft.y);
    ctx.lineTo(endLeft.x, endLeft.y);
    ctx.lineTo(endTip.x, endTip.y);
    ctx.lineTo(endRight.x, endRight.y);
    ctx.lineTo(startRight.x, startRight.y);
  } else {
    const startTip = {
      x: start.x - axis.x * startRadius * pointStrength,
      y: start.y - axis.y * startRadius * pointStrength,
    };
    ctx.moveTo(startTip.x, startTip.y);
    ctx.lineTo(startLeft.x, startLeft.y);
    ctx.lineTo(endLeft.x, endLeft.y);
    ctx.lineTo(endRight.x, endRight.y);
    ctx.lineTo(startRight.x, startRight.y);
  }
  ctx.closePath();
}

function traceMassPath(mass, language) {
  const geometry = getMassGeometry(mass, language);

  if (language.rigidity < 0.9) {
    traceInfluencedMass(geometry, language);
  } else if (language.dominant === 'square') {
    traceBlockMass(geometry, language);
  } else if (language.dominant === 'triangle') {
    traceAngularMass(geometry, language);
  } else {
    traceRoundedMass(geometry, language);
  }
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
  ctx.restore();

  if (debugToggle && debugToggle.checked) {
    drawDebugOverlay(masses, currentShapeLanguage);
  }

  if (editPoseToggle.checked) {
    drawPoseEditor(fittedSkeleton);
  }
}

function generateSilhouette() {
  currentShapeLanguage = getShapeLanguage();
  currentMassVariation = currentShapeLanguage ? createMassVariation() : null;
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

function continuePoseDrag(event) {
  if (!activePoseJoint || !currentPoseView) return;

  const pointerPosition = getCanvasPointerPosition(event);
  const scale = Math.max(0.001, currentPoseView.scale);
  poseOffsets[activePoseJoint].x += (pointerPosition.x - lastPointerPosition.x) / scale;
  poseOffsets[activePoseJoint].y += (pointerPosition.y - lastPointerPosition.y) / scale;
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
generateButton.addEventListener('click', generateSilhouette);
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
applyProportionStyle(proportionStyleControl.value);
generateSilhouette();
