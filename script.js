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
const massBiasControl = document.getElementById('massBias');
const taperDirectionControl = document.getElementById('taperDirection');
const heightControl = document.getElementById('heightControl');
const bodyWidthControl = document.getElementById('bodyWidthControl');
const shoulderControl = document.getElementById('shoulderControl');
const debugToggle = document.getElementById('debugRegions');
const editPoseToggle = document.getElementById('editPose');
const randomiseProportionsButton = document.getElementById('randomiseProportions');
const heightValue = document.getElementById('heightValue');
const bodyMassValue = document.getElementById('bodyMassValue');
const shoulderValue = document.getElementById('shoulderValue');
const heightDescription = document.getElementById('heightDescription');
const bodyMassDescription = document.getElementById('bodyMassDescription');
const shoulderDescription = document.getElementById('shoulderDescription');

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const proportionControls = [
  {
    input: heightControl,
    numberInput: heightValue,
    description: heightDescription,
    labels: { veryLow: 'Very Short', low: 'Short', middle: 'Neutral', high: 'Tall', veryHigh: 'Very Tall' },
  },
  {
    input: bodyWidthControl,
    numberInput: bodyMassValue,
    description: bodyMassDescription,
    labels: { veryLow: 'Very Slim', low: 'Slim', middle: 'Neutral', high: 'Broad', veryHigh: 'Very Broad' },
  },
  {
    input: shoulderControl,
    numberInput: shoulderValue,
    description: shoulderDescription,
    labels: { veryLow: 'Very Narrow', low: 'Narrow', middle: 'Neutral', high: 'Wide', veryHigh: 'Very Wide' },
  },
];

const normalSliderRange = { min: 0.6, max: 1.4 };
const safeRandomRange = { min: 0.75, max: 1.25 };
const editableJointNames = [
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

function randomiseProportions() {
  proportionControls.forEach(control => {
    const step = Number.parseFloat(control.input.step);
    const stepCount = Math.round((safeRandomRange.max - safeRandomRange.min) / step);
    const randomStep = Math.floor(Math.random() * (stepCount + 1));
    const value = safeRandomRange.min + randomStep * step;

    updateSliderRange(control, value);
    control.input.value = value.toFixed(2);
    updateFromSlider(control);
  });
}

function getShapeLanguage() {
  const intensity = Number.parseFloat(shapeIntensityControl.value) || 1;
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

function makeMass(name, start, end, startWidth, endWidth, taperDirection = 'toEnd') {
  return { name, start, end, startWidth, endWidth, taperDirection };
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

function buildDefaultSkeleton(modifiers) {
  const hf = modifiers.height;
  const bw = modifiers.bodyWidth;
  const sh = modifiers.shoulder;
  const cx = canvas.width / 2;
  const top = 38;

  const headHeight = 76 * hf;
  const torsoLength = 180 * hf;
  const baseShoulderWidth = 176 * bw * sh;
  const pelvisHeight = 66 * hf;
  const basePelvisWidth = 142 * bw;

  const headTop = { x: cx, y: top };
  const headBottom = { x: cx, y: top + headHeight };
  const torsoTop = { x: cx, y: headBottom.y - 7 };
  const torsoBottom = { x: cx, y: torsoTop.y + torsoLength };
  const pelvisTop = { x: cx, y: torsoBottom.y - 18 };
  const pelvisBottom = { x: cx, y: pelvisTop.y + pelvisHeight };
  const neckBase = { x: cx, y: torsoTop.y + 5 * hf };

  // Mirrored shoulder points sit below the neck base, giving the shoulder
  // construction line a relaxed downward slope on both sides.
  const shoulderY = torsoTop.y + 30 * hf;
  const shoulderHalfWidth = baseShoulderWidth * 0.44;
  const leftShoulder = { x: cx - shoulderHalfWidth, y: shoulderY };
  const rightShoulder = { x: cx + shoulderHalfWidth, y: shoulderY };

  const upperArmLength = 118 * hf;
  const lowerArmLength = 124 * hf;
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
  const upperLegLength = 158 * hf;
  const lowerLegLength = 166 * hf;
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
    torsoTop,
    torsoBottom,
    pelvisTop,
    pelvisBottom,
    neckBase,
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
  const posedSkeleton = { ...skeleton };

  editableJointNames.forEach(name => {
    posedSkeleton[name] = {
      x: skeleton[name].x + poseOffsets[name].x,
      y: skeleton[name].y + poseOffsets[name].y,
    };
  });

  return posedSkeleton;
}

function getMassBiasScales(language) {
  if (language.massBias === 'top') return { upper: 1.2, lower: 0.88 };
  if (language.massBias === 'bottom') return { upper: 0.88, lower: 1.2 };
  return { upper: 1, lower: 1 };
}

function buildBodyMasses(modifiers, skeleton, variation, language) {
  const bw = modifiers.bodyWidth;
  const sh = modifiers.shoulder;
  const bias = getMassBiasScales(language);
  const fullness = 1 + language.circleStrength * 0.16 + language.squareStrength * 0.05;
  const torsoTopWidth = 176 * bw * sh * variation.upperMass * variation.torsoTopBias * fullness * bias.upper;
  const torsoBottomWidth = 132 * bw * variation.lowerMass * variation.torsoBottomBias * fullness * bias.upper;
  const pelvisWidth = 142 * bw * variation.lowerMass * variation.pelvisWidth * fullness * bias.lower;
  const headWidth = 72 * bw * variation.headWidth * (1 + language.circleStrength * 0.1);
  const armWidth = 50 * bw * variation.limbMass * fullness * bias.upper;
  const forearmWidth = 40 * bw * variation.limbMass * fullness * bias.upper;
  const thighWidth = 76 * bw * variation.lowerMass * fullness * bias.lower;
  const calfWidth = 54 * bw * variation.limbMass * fullness * bias.lower;

  return [
    makeMass('leftLowerLeg', skeleton.leftKnee, skeleton.leftAnkle, calfWidth, calfWidth * 0.55),
    makeMass('rightLowerLeg', skeleton.rightKnee, skeleton.rightAnkle, calfWidth * 1.02, calfWidth * 0.57),
    makeMass('leftUpperLeg', skeleton.leftHip, skeleton.leftKnee, thighWidth, calfWidth * 0.92),
    makeMass('rightUpperLeg', skeleton.rightHip, skeleton.rightKnee, thighWidth * 1.02, calfWidth * 0.94),
    makeMass('leftLowerArm', skeleton.leftElbow, skeleton.leftWrist, forearmWidth, forearmWidth * 0.58),
    makeMass('rightLowerArm', skeleton.rightElbow, skeleton.rightWrist, forearmWidth * 0.98, forearmWidth * 0.6),
    makeMass('leftUpperArm', skeleton.leftShoulder, skeleton.leftElbow, armWidth, forearmWidth * 1.04),
    makeMass('rightUpperArm', skeleton.rightShoulder, skeleton.rightElbow, armWidth * 1.02, forearmWidth * 1.02),
    makeMass('pelvis', skeleton.pelvisTop, skeleton.pelvisBottom, pelvisWidth * 0.9, pelvisWidth, 'toStart'),
    makeMass('torso', skeleton.torsoTop, skeleton.torsoBottom, torsoTopWidth, torsoBottomWidth),
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

  const overlapRatio = clamp(
    0.14 + language.circleStrength * 0.08 - language.squareStrength * 0.015,
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

  if (language.dominant === 'square') {
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
    ['neckBase', 'leftShoulder'],
    ['neckBase', 'rightShoulder'],
    ['leftShoulder', 'leftElbow'],
    ['leftElbow', 'leftWrist'],
    ['rightShoulder', 'rightElbow'],
    ['rightElbow', 'rightWrist'],
    ['leftHip', 'rightHip'],
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

function getCurrentModifiers() {
  return {
    height: clamp(Number.parseFloat(heightControl.value) || 1, 0.3, 2),
    bodyWidth: clamp(Number.parseFloat(bodyWidthControl.value) || 1, 0.3, 2),
    shoulder: clamp(Number.parseFloat(shoulderControl.value) || 1, 0.3, 2),
  };
}

function renderSilhouette() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!currentShapeLanguage || !currentMassVariation) {
    currentPoseView = null;
    return;
  }

  const modifiers = getCurrentModifiers();
  const skeleton = applyPoseOffsets(buildDefaultSkeleton(modifiers));
  const rawMasses = buildBodyMasses(modifiers, skeleton, currentMassVariation, currentShapeLanguage);
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
generateSilhouette();
