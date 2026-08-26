const generateButton = document.getElementById('generateButton');
const canvas = document.getElementById('drawCanvas');
let ctx = canvas.getContext('2d');
const batchCanvas = document.getElementById('batchCanvas');
const batchContext = batchCanvas.getContext('2d');
const workspaceTitle = document.getElementById('workspaceTitle');
const workspaceCanvasSize = document.getElementById('workspaceCanvasSize');
const workspaceSymmetryControl = document.getElementById('workspaceSymmetryControl');
const generationModeControl = document.getElementById('generationMode');
const batchControls = document.getElementById('batchControls');
const batchCountControl = document.getElementById('batchCount');
const batchVariationModeControl = document.getElementById('batchVariationMode');
const randomizationScopeRow = document.getElementById('randomizationScopeRow');
const randomizationScopeControl = document.getElementById('randomizationScope');
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
const accentShapeTypeControl = document.getElementById('accentShapeType');
const customAccentControls = document.getElementById('customAccentControls');
const customAccentUpload = document.getElementById('customAccentUpload');
const customAccentPreview = document.getElementById('customAccentPreview');
const customAccentPreviewContext = customAccentPreview.getContext('2d');
const customAccentStatus = document.getElementById('customAccentStatus');
const customRotationVariationControl = document.getElementById('customRotationVariation');
const allowCustomRandomFlipToggle = document.getElementById('allowCustomRandomFlip');
const inheritAccentShapeLanguageToggle = document.getElementById('inheritAccentShapeLanguage');
const inheritAccentShapeLanguageState = document.getElementById('inheritAccentShapeLanguageState');
const accentAnchorHead = document.getElementById('accentAnchorHead');
const accentAnchorShoulder = document.getElementById('accentAnchorShoulder');
const accentAnchorElbow = document.getElementById('accentAnchorElbow');
const accentAnchorKnee = document.getElementById('accentAnchorKnee');
const maxAccentCountControl = document.getElementById('maxAccentCount');
const accentModeControl = document.getElementById('accentMode');
const silhouetteBreakStrengthControl = document.getElementById('silhouetteBreakStrength');
const accentSymmetryToggle = document.getElementById('accentSymmetry');
const accentSymmetryState = document.getElementById('accentSymmetryState');
const accentScaleMinControl = document.getElementById('accentScaleMin');
const accentScaleMaxControl = document.getElementById('accentScaleMax');
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
let currentAccentVariation = [];
let currentBatchModels = [];
const singleCanvasSize = { width: 600, height: 700 };
const batchStagingCanvas = document.createElement('canvas');
const batchStagingContext = batchStagingCanvas.getContext('2d');
let currentCustomAccentMotif = null;
let customAccentUploadSequence = 0;
const accentScaleRangesByMode = {
  builtIn: { minimum: 0.8, maximum: 1.8 },
  custom: { minimum: 1.1, maximum: 2.1 },
};
let activeAccentScaleMode = accentShapeTypeControl.value === 'custom'
  ? 'custom'
  : 'builtIn';
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

function setCustomAccentStatus(message, state = 'idle') {
  customAccentStatus.textContent = message;
  customAccentStatus.dataset.state = state;
}

function clearCustomAccentPreview() {
  customAccentPreviewContext.clearRect(
    0,
    0,
    customAccentPreview.width,
    customAccentPreview.height,
  );
}

function drawCustomAccentPreview(motif) {
  clearCustomAccentPreview();
  const margin = 8;
  const scale = Math.min(
    (customAccentPreview.width - margin * 2) / motif.width,
    (customAccentPreview.height - margin * 2) / motif.height,
  );
  const width = motif.width * scale;
  const height = motif.height * scale;

  customAccentPreviewContext.save();
  customAccentPreviewContext.imageSmoothingEnabled = true;
  customAccentPreviewContext.drawImage(
    motif.canvas,
    (customAccentPreview.width - width) / 2,
    (customAccentPreview.height - height) / 2,
    width,
    height,
  );
  customAccentPreviewContext.restore();
}

function loadLocalImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The PNG could not be decoded.'));
    image.src = url;
  });
}

function getBorderLuminance(pixelData, width, height) {
  let total = 0;
  let count = 0;
  const addPixel = (x, y) => {
    const index = (y * width + x) * 4;
    const alpha = pixelData[index + 3] / 255;
    if (alpha < 0.05) return;

    total += (
      pixelData[index] * 0.2126
      + pixelData[index + 1] * 0.7152
      + pixelData[index + 2] * 0.0722
    ) / 255;
    count += 1;
  };

  for (let x = 0; x < width; x += 1) {
    addPixel(x, 0);
    addPixel(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    addPixel(0, y);
    addPixel(width - 1, y);
  }

  return count > 0 ? total / count : 1;
}

function normaliseCustomAccentImage(image, fileName) {
  const maximumProcessingSize = 512;
  const processingScale = Math.min(
    1,
    maximumProcessingSize / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * processingScale));
  const height = Math.max(1, Math.round(image.naturalHeight * processingScale));
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = width;
  sourceCanvas.height = height;
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
  sourceContext.drawImage(image, 0, 0, width, height);
  const sourceImage = sourceContext.getImageData(0, 0, width, height);
  const pixelCount = width * height;
  let transparentPixelCount = 0;

  for (let index = 3; index < sourceImage.data.length; index += 4) {
    if (sourceImage.data[index] < 250) transparentPixelCount += 1;
  }

  const useAlphaMask = transparentPixelCount / pixelCount > 0.001;
  const borderLuminance = useAlphaMask
    ? 1
    : getBorderLuminance(sourceImage.data, width, height);
  const mask = new Uint8ClampedArray(pixelCount);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x;
      const dataIndex = pixelIndex * 4;
      const alpha = sourceImage.data[dataIndex + 3] / 255;
      const luminance = (
        sourceImage.data[dataIndex] * 0.2126
        + sourceImage.data[dataIndex + 1] * 0.7152
        + sourceImage.data[dataIndex + 2] * 0.0722
      ) / 255;
      const foreground = borderLuminance >= 0.5 ? 1 - luminance : luminance;
      const maskStrength = useAlphaMask
        ? alpha
        : clamp((foreground - 0.06) / 0.88, 0, 1) * alpha;
      const maskAlpha = Math.round(maskStrength * 255);
      mask[pixelIndex] = maskAlpha;

      if (maskAlpha >= 12) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    throw new Error('No visible shape was found in this PNG.');
  }

  const croppedWidth = maxX - minX + 1;
  const croppedHeight = maxY - minY + 1;
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = croppedWidth;
  maskCanvas.height = croppedHeight;
  const maskContext = maskCanvas.getContext('2d');
  const croppedImage = maskContext.createImageData(croppedWidth, croppedHeight);
  let visibleAlphaWeight = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (let y = 0; y < croppedHeight; y += 1) {
    for (let x = 0; x < croppedWidth; x += 1) {
      const sourceIndex = (y + minY) * width + (x + minX);
      const targetIndex = (y * croppedWidth + x) * 4;
      const alpha = mask[sourceIndex];
      croppedImage.data[targetIndex] = 17;
      croppedImage.data[targetIndex + 1] = 17;
      croppedImage.data[targetIndex + 2] = 17;
      croppedImage.data[targetIndex + 3] = alpha;

      const alphaWeight = alpha / 255;
      visibleAlphaWeight += alphaWeight;
      weightedX += (x + 0.5) * alphaWeight;
      weightedY += (y + 0.5) * alphaWeight;
    }
  }

  maskContext.putImageData(croppedImage, 0, 0);
  const maximumDimension = Math.max(croppedWidth, croppedHeight);
  const visibleFillRatio = visibleAlphaWeight / (croppedWidth * croppedHeight);
  const normalisationScale = clamp(
    1.14 + (1 - Math.sqrt(visibleFillRatio)) * 0.38,
    1.14,
    1.42,
  );
  const originX = weightedX / Math.max(visibleAlphaWeight, 0.001);
  const originY = weightedY / Math.max(visibleAlphaWeight, 0.001);
  const supportDirections = Array.from({ length: 32 }, (_, index) => {
    const angle = index / 32 * Math.PI * 2;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  });
  const supportPoints = supportDirections.map(direction => ({
    direction,
    dot: -Infinity,
    point: { x: 0, y: 0 },
  }));

  // Retain a compact set of actual visible-mask extremes. Placement can then
  // validate the transformed motif rather than its rectangular image canvas.
  for (let y = 0; y < croppedHeight; y += 1) {
    for (let x = 0; x < croppedWidth; x += 1) {
      const sourceIndex = (y + minY) * width + (x + minX);
      if (mask[sourceIndex] < 12) continue;

      const point = {
        x: (x + 0.5 - originX) / maximumDimension * normalisationScale,
        y: (y + 0.5 - originY) / maximumDimension * normalisationScale,
      };

      supportPoints.forEach(support => {
        const dot = point.x * support.direction.x + point.y * support.direction.y;
        if (dot > support.dot) {
          support.dot = dot;
          support.point = point;
        }
      });
    }
  }

  return {
    canvas: maskCanvas,
    width: croppedWidth,
    height: croppedHeight,
    scaleX: croppedWidth / maximumDimension * normalisationScale,
    scaleY: croppedHeight / maximumDimension * normalisationScale,
    normalisationScale,
    originX,
    originY,
    supportPoints: supportPoints.map(support => support.point),
    visibleFillRatio,
    sourceUsedAlpha: useAlphaMask,
    fileName,
  };
}

async function handleCustomAccentUpload(event) {
  const uploadSequence = ++customAccentUploadSequence;
  const [file] = event.target.files;
  if (!file) return;

  if (file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) {
    currentCustomAccentMotif = null;
    clearCustomAccentPreview();
    setCustomAccentStatus('Please choose a PNG image.', 'error');
    return;
  }

  if (file.size > 8 * 1024 * 1024) {
    currentCustomAccentMotif = null;
    clearCustomAccentPreview();
    setCustomAccentStatus('Please choose a PNG smaller than 8 MB.', 'error');
    return;
  }

  setCustomAccentStatus('Loading and normalising the uploaded shape…');
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadLocalImage(objectUrl);
    const motif = normaliseCustomAccentImage(image, file.name);
    if (uploadSequence !== customAccentUploadSequence) return;

    currentCustomAccentMotif = motif;
    drawCustomAccentPreview(motif);
    const maskDescription = motif.sourceUsedAlpha
      ? 'alpha mask'
      : 'black/white mask';
    setCustomAccentStatus(
      `Ready — ${motif.width} × ${motif.height}px ${maskDescription}.`,
      'ready',
    );
  } catch (error) {
    if (uploadSequence !== customAccentUploadSequence) return;

    currentCustomAccentMotif = null;
    clearCustomAccentPreview();
    setCustomAccentStatus(error.message || 'The PNG could not be processed.', 'error');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function updateCustomAccentControls() {
  const customSelected = accentShapeTypeControl.value === 'custom';
  const nextScaleMode = customSelected ? 'custom' : 'builtIn';
  customAccentControls.hidden = !customSelected;

  if (nextScaleMode !== activeAccentScaleMode) {
    accentScaleRangesByMode[activeAccentScaleMode] = normaliseAccentScaleInputs();
    activeAccentScaleMode = nextScaleMode;
    const nextScale = accentScaleRangesByMode[nextScaleMode];
    accentScaleMinControl.value = nextScale.minimum.toFixed(2);
    accentScaleMaxControl.value = nextScale.maximum.toFixed(2);
  }

  if (customSelected && !currentCustomAccentMotif) {
    setCustomAccentStatus('Upload an accent shape first.', 'error');
  }
}

function normaliseAccentScaleInputs() {
  const minimumLimit = Number.parseFloat(accentScaleMinControl.min);
  const maximumLimit = Number.parseFloat(accentScaleMinControl.max);
  const parsedMinimum = Number.parseFloat(accentScaleMinControl.value);
  const parsedMaximum = Number.parseFloat(accentScaleMaxControl.value);
  let minimum = clamp(
    Number.isFinite(parsedMinimum) ? parsedMinimum : 0.8,
    minimumLimit,
    maximumLimit,
  );
  let maximum = clamp(
    Number.isFinite(parsedMaximum) ? parsedMaximum : 1.8,
    minimumLimit,
    maximumLimit,
  );

  if (minimum > maximum) {
    [minimum, maximum] = [maximum, minimum];
  }

  accentScaleMinControl.value = minimum.toFixed(2);
  accentScaleMaxControl.value = maximum.toFixed(2);
  return { minimum, maximum };
}

function getAccentSettings() {
  const scale = normaliseAccentScaleInputs();
  const breakFractions = { subtle: 0.26, medium: 0.48, strong: 0.7 };
  const customRotationRanges = { low: 10, medium: 30, high: 60, random: 90 };
  const breakStrength = silhouetteBreakStrengthControl.value;
  const shape = accentShapeTypeControl.value;

  if (shape === 'custom' && !currentCustomAccentMotif) {
    setCustomAccentStatus('Upload an accent shape first.', 'error');
  }

  return {
    shape,
    customMotif: shape === 'custom' ? currentCustomAccentMotif : null,
    anchors: {
      head: accentAnchorHead.checked,
      shoulder: accentAnchorShoulder.checked,
      elbow: accentAnchorElbow.checked,
      knee: accentAnchorKnee.checked,
    },
    maxCount: clamp(Number.parseInt(maxAccentCountControl.value, 10) || 1, 1, 3),
    symmetry: accentSymmetryToggle.checked,
    minimumScale: scale.minimum,
    maximumScale: scale.maximum,
    mode: accentModeControl.value,
    inheritShapeLanguage: inheritAccentShapeLanguageToggle.checked,
    rotationVariation: customRotationVariationControl.value,
    rotationRange: customRotationRanges[customRotationVariationControl.value]
      ?? customRotationRanges.medium,
    allowRandomFlip: allowCustomRandomFlipToggle.checked,
    breakStrength,
    breakFraction: breakFractions[breakStrength] ?? breakFractions.medium,
  };
}

function getAccentCandidateGroups(settings) {
  const groups = [];

  if (settings.anchors.head) {
    groups.push(['head']);
  }

  const addPairedCandidates = (leftName, rightName) => {
    if (settings.symmetry) {
      groups.push([leftName, rightName]);
    } else {
      groups.push([leftName], [rightName]);
    }
  };

  if (settings.anchors.shoulder) {
    addPairedCandidates('leftShoulder', 'rightShoulder');
  }
  if (settings.anchors.elbow) {
    addPairedCandidates('leftElbow', 'rightElbow');
  }
  if (settings.anchors.knee) {
    addPairedCandidates('leftKnee', 'rightKnee');
  }

  return groups;
}

const accentShapeVariants = {
  triangle: ['skewedTriangle', 'wedge', 'longShard', 'bluntTriangle', 'taperedHybrid'],
  square: ['offsetRectangle', 'elongatedBlock', 'taperedBlock', 'steppedSlab', 'bevelledSquare'],
  circle: ['oval', 'offCentreRound', 'roundedWedge', 'capsule', 'droplet'],
  custom: ['uploadedMotif'],
};

const accentAnchorProfiles = {
  head: {
    rotationRange: 24,
    minimumOverlap: 0.18,
    minimumScale: 0.68,
    scaleBias: 0.9,
    shapeScaleX: 1.08,
    shapeScaleY: 0.94,
    maximumPrimaryMassRatio: 0.96,
    bridgeWidth: 0.24,
    maskAlong: 0.34,
    maskOutward: 0.22,
    breakTargets: { subtle: 0.17, medium: 0.36, strong: 0.58 },
  },
  shoulder: {
    rotationRange: 36,
    minimumOverlap: 0.22,
    minimumScale: 0.76,
    scaleBias: 1.12,
    shapeScaleX: 0.84,
    shapeScaleY: 1.2,
    maximumPrimaryMassRatio: 1,
    bridgeWidth: 0.34,
    maskAlong: 0.42,
    maskOutward: 0.28,
    breakTargets: { subtle: 0.2, medium: 0.42, strong: 0.68 },
  },
  elbow: {
    rotationRange: 21,
    minimumOverlap: 0.18,
    minimumScale: 0.68,
    scaleBias: 0.9,
    shapeScaleX: 1.16,
    shapeScaleY: 0.84,
    maximumPrimaryMassRatio: 0.82,
    bridgeWidth: 0.25,
    maskAlong: 0.3,
    maskOutward: 0.2,
    breakTargets: { subtle: 0.16, medium: 0.34, strong: 0.52 },
  },
  knee: {
    rotationRange: 19,
    minimumOverlap: 0.19,
    minimumScale: 0.72,
    scaleBias: 0.98,
    shapeScaleX: 1.18,
    shapeScaleY: 0.9,
    maximumPrimaryMassRatio: 0.92,
    bridgeWidth: 0.28,
    maskAlong: 0.34,
    maskOutward: 0.22,
    breakTargets: { subtle: 0.18, medium: 0.38, strong: 0.58 },
  },
};

function applyInheritedShapeLanguage(profile, language, influenceMultiplier = 1) {
  if (!language) return profile;

  const { circle, square, triangle } = language.shapeBlend;
  const influence = clamp(language.intensity * 0.16, 0.08, 0.24) * influenceMultiplier;
  const softness = circle * influence;
  const bluntness = square * influence;
  const directionality = triangle * influence;
  const taperDirection = Math.sign(profile.taper || profile.apexOffset || 1);

  return {
    ...profile,
    stretchX: profile.stretchX * (1 + directionality * 0.18 + bluntness * 0.04),
    stretchY: profile.stretchY * (1 + softness * 0.08 - directionality * 0.06),
    skew: profile.skew * (1 + directionality * 0.7 - softness * 0.3),
    asymmetry: profile.asymmetry * (1 + directionality * 0.35 - bluntness * 0.2),
    taper: clamp(
      profile.taper * (1 - softness * 0.3 - bluntness * 0.12)
        + taperDirection * directionality * 0.1,
      -0.24,
      0.24,
    ),
    cornerCut: clamp(profile.cornerCut + softness * 0.06 + bluntness * 0.025, 0.14, 0.34),
    bulge: clamp(profile.bulge + softness * 0.12 - bluntness * 0.05, 0.86, 1.16),
    inheritedShapeLanguage: true,
  };
}

function createAccentShapeProfile(
  shape,
  random,
  language,
  inheritShapeLanguage,
  customMotif = null,
) {
  const variants = accentShapeVariants[shape] || accentShapeVariants.circle;
  const deformation = shape === 'triangle'
    ? 1.15
    : shape === 'square'
      ? 0.9
      : shape === 'custom'
        ? 0.36
        : 0.72;
  const contourScale = {
    clean: 0.68,
    natural: 1,
    expressive: 1.2,
  }[language?.contourVariationName] ?? 1;
  const variant = variants[Math.floor(random() * variants.length)];

  if (shape === 'custom' && customMotif) {
    const customProfile = {
      variant,
      attachmentRatioX: 0.22,
      attachmentRatioY: 0.22,
      stretchX: randomBetween(0.96, 1.05, random),
      stretchY: randomBetween(0.95, 1.05, random),
      skew: randomBetween(-0.05, 0.05, random) * contourScale,
      asymmetry: randomBetween(-0.035, 0.035, random) * contourScale,
      offsetX: randomBetween(-0.02, 0.02, random),
      offsetY: randomBetween(-0.025, 0.025, random),
      apexOffset: 0,
      taper: randomBetween(-0.045, 0.045, random) * contourScale,
      cornerCut: 0.2,
      bulge: 1,
      motifScaleX: customMotif.scaleX,
      motifScaleY: customMotif.scaleY,
      customMotif,
      inheritedShapeLanguage: false,
    };

    return inheritShapeLanguage
      ? applyInheritedShapeLanguage(customProfile, language, 0.45)
      : customProfile;
  }

  const attachmentRatios = {
    skewedTriangle: { x: 0.34, y: 0.32 },
    wedge: { x: 0.32, y: 0.32 },
    longShard: { x: 0.34, y: 0.23 },
    bluntTriangle: { x: 0.34, y: 0.34 },
    taperedHybrid: { x: 0.33, y: 0.33 },
    offsetRectangle: { x: 0.4, y: 0.34 },
    elongatedBlock: { x: 0.44, y: 0.27 },
    taperedBlock: { x: 0.4, y: 0.33 },
    steppedSlab: { x: 0.41, y: 0.3 },
    bevelledSquare: { x: 0.41, y: 0.34 },
    oval: { x: 0.44, y: 0.35 },
    offCentreRound: { x: 0.42, y: 0.4 },
    roundedWedge: { x: 0.4, y: 0.36 },
    capsule: { x: 0.44, y: 0.27 },
    droplet: { x: 0.4, y: 0.36 },
  };
  const attachmentRatio = attachmentRatios[variant] || { x: 0.32, y: 0.3 };

  const profile = {
    variant,
    attachmentRatioX: attachmentRatio.x,
    attachmentRatioY: attachmentRatio.y,
    stretchX: randomBetween(0.88, 1.18, random),
    stretchY: randomBetween(0.86, 1.14, random),
    skew: randomBetween(-0.16, 0.16, random) * deformation * contourScale,
    asymmetry: randomBetween(-0.12, 0.12, random) * deformation * contourScale,
    offsetX: randomBetween(-0.055, 0.055, random),
    offsetY: randomBetween(-0.075, 0.075, random) * deformation * contourScale,
    apexOffset: randomBetween(-0.3, 0.3, random),
    taper: randomBetween(-0.16, 0.16, random) * contourScale,
    cornerCut: randomBetween(0.16, 0.28, random),
    bulge: randomBetween(0.9, 1.1, random),
    motifScaleX: 1,
    motifScaleY: 1,
    customMotif: null,
    inheritedShapeLanguage: false,
  };

  return inheritShapeLanguage
    ? applyInheritedShapeLanguage(profile, language)
    : profile;
}

function getAccentAnchorType(anchorName) {
  if (anchorName === 'head') return 'head';
  if (anchorName.includes('Shoulder')) return 'shoulder';
  if (anchorName.includes('Elbow')) return 'elbow';
  return 'knee';
}

function chooseWeightedAccentCandidate(candidates, sideLoad, random) {
  const weightedCandidates = candidates.map(anchorNames => {
    if (anchorNames.length === 2 || anchorNames[0] === 'head') {
      return { anchorNames, weight: 1 };
    }

    const side = anchorNames[0].startsWith('left') ? 'left' : 'right';
    const otherSide = side === 'left' ? 'right' : 'left';
    const excessLoad = Math.max(0, sideLoad[side] - sideLoad[otherSide]);

    return {
      anchorNames,
      // Large same-side accents reduce the probability of another same-side
      // choice without turning asymmetry into a hard rule.
      weight: Math.max(0.18, 1 / (1 + excessLoad * 1.15)),
    };
  });
  const totalWeight = weightedCandidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  let target = random() * totalWeight;

  for (const candidate of weightedCandidates) {
    target -= candidate.weight;
    if (target <= 0) return candidate.anchorNames;
  }

  return weightedCandidates[weightedCandidates.length - 1].anchorNames;
}

function chooseHeadAccentPlacement(random) {
  const value = random();
  if (value < 0.46) return 'top';
  return value < 0.73 ? 'left' : 'right';
}

function createAccentVariation(settings, random, language) {
  if (settings.shape === 'custom' && !settings.customMotif) return [];

  const candidates = getAccentCandidateGroups(settings);
  if (candidates.length === 0) return [];

  // A mirrored pair is one design placement, although it produces two
  // physical accents. This keeps Max Accent Count predictable with symmetry.
  const maximum = Math.min(settings.maxCount, candidates.length);
  const placementCount = 1 + Math.floor(random() * maximum);
  const availableCandidates = [...candidates];
  const sideLoad = { left: 0, right: 0 };
  const placements = [];

  for (let designIndex = 0; designIndex < placementCount; designIndex += 1) {
    const anchorNames = chooseWeightedAccentCandidate(availableCandidates, sideLoad, random);
    const candidateIndex = availableCandidates.indexOf(anchorNames);
    availableCandidates.splice(candidateIndex, 1);
    const anchorType = getAccentAnchorType(anchorNames[0]);
    const anchorProfile = accentAnchorProfiles[anchorType];
    const scale = randomBetween(settings.minimumScale, settings.maximumScale, random);
    const mode = settings.mode === 'mixed'
      ? (random() < 0.5 ? 'additive' : 'replace')
      : settings.mode;
    const profile = createAccentShapeProfile(
      settings.shape,
      random,
      language,
      settings.inheritShapeLanguage,
      settings.customMotif,
    );
    const rotationRange = settings.shape === 'custom'
      ? settings.rotationRange
      : anchorProfile.rotationRange;
    const rotationOffset = randomBetween(
      -rotationRange,
      rotationRange,
      random,
    ) * (Math.PI / 180);
    const flipX = settings.shape === 'custom'
      && settings.allowRandomFlip
      && random() < 0.5;
    const headPlacement = anchorType === 'head' ? chooseHeadAccentPlacement(random) : null;

    anchorNames.forEach((anchorName, index) => {
      placements.push({
        anchorName,
        anchorType,
        designIndex,
        shape: settings.shape,
        profile,
        scale,
        mode,
        headPlacement,
        breakStrength: settings.breakStrength,
        breakFraction: settings.breakFraction,
        flipX,
        mirrorSign: anchorName.startsWith('right') ? -1 : 1,
        rotationOffset: anchorNames.length === 2 && index === 1
          ? -rotationOffset
          : rotationOffset,
      });

      if (anchorName.startsWith('left')) sideLoad.left += scale;
      if (anchorName.startsWith('right')) sideLoad.right += scale;
    });
  }

  return placements;
}

function completeShapeLanguage({
  intensity,
  rigidityName,
  contourVariationName,
  shapeBlend,
  massBias,
  taperDirection,
}) {
  const rigidityValues = { organic: 0.18, balanced: 0.58, geometric: 1 };
  const rigidity = rigidityValues[rigidityName] ?? rigidityValues.balanced;
  const contourVariationValues = { clean: 0.008, natural: 0.035, expressive: 0.07 };

  return {
    intensity,
    rigidity,
    rigidityName,
    contourVariationName,
    contourVariation: contourVariationValues[contourVariationName]
      ?? contourVariationValues.natural,
    shapeBlend,
    massBias,
    taperDirection,
    circleStrength: clamp(shapeBlend.circle * intensity, 0, 1.45),
    squareStrength: clamp(shapeBlend.square * intensity, 0, 1.45),
    triangleStrength: clamp(shapeBlend.triangle * intensity, 0, 1.45),
  };
}

function getShapeLanguage() {
  const intensity = Number.parseFloat(shapeIntensityControl.value) || 1;
  const rigidityName = shapeRigidityControl.value;
  const contourVariationName = contourVariationControl.value;
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

  return completeShapeLanguage({
    intensity,
    rigidityName,
    contourVariationName,
    shapeBlend,
    massBias: massBiasControl.value,
    taperDirection: taperDirectionControl.value,
  });
}

function makeMass(name, start, end, startWidth, endWidth, taperDirection = 'toEnd', options = {}) {
  return { name, start, end, startWidth, endWidth, taperDirection, ...options };
}

function createProceduralContourProfile(language, random, massName) {
  const { circle, square, triangle } = language.shapeBlend;
  const variationLevel = clamp(language.contourVariation / 0.07, 0, 1);
  const nodeCount = { clean: 2, natural: 3, expressive: 4 }[language.contourVariationName] ?? 3;
  const grammarScale = language.intensity * (0.72 + variationLevel * 0.28);
  const circleAmplitude = circle * (0.055 + variationLevel * 0.025) * grammarScale;
  const squareAmplitude = square * (0.035 + variationLevel * 0.03) * grammarScale;
  const triangleAmplitude = triangle * (0.085 + variationLevel * 0.055) * grammarScale;
  const cornerCandidates = Array.from({ length: nodeCount }, (_, index) => index)
    .filter(index => !(massName === 'torso' && index === nodeCount - 1))
    .filter(index => !(massName === 'pelvis' && index === 0));
  const strongCornerIndex = triangle > 0.25
    && cornerCandidates.length > 0
    && random() < 0.28 + triangle * 0.35
    ? cornerCandidates[Math.floor(random() * cornerCandidates.length)]
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

    const isProtectedWaistNode = (massName === 'torso' && index === nodeCount - 1)
      || (massName === 'pelvis' && index === 0);
    if (isProtectedWaistNode) {
      // Keep broad inward taper, but suppress the small outward vertices that
      // become spikes when two independently generated contours meet.
      const outwardLimit = 0.012 + circle * 0.025 + square * 0.01;

      leftOffset = clamp(leftOffset, -0.13, outwardLimit);
      rightOffset = clamp(rightOffset, -0.13, outwardLimit);
      leftSharpness = Math.min(leftSharpness, 0.52);
      rightSharpness = Math.min(rightSharpness, 0.52);
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
    massNames.map(name => [name, createProceduralContourProfile(language, random, name)]),
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
  const cx = singleCanvasSize.width / 2;
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

function applyPoseOffsets(skeleton, offsetMap = poseOffsets) {
  const posedSkeleton = Object.fromEntries(
    Object.entries(skeleton).map(([name, point]) => [name, { ...point }]),
  );

  // Moving the pelvis centre shifts the pelvis and hip anchors as one
  // structural unit. Knees and ankles remain independent landmark edits.
  const pelvisOffset = offsetMap.pelvisCenter;
  ['pelvisCenter', 'torsoBottom', 'pelvisTop', 'pelvisBottom', 'leftHip', 'rightHip'].forEach(name => {
    posedSkeleton[name].x += pelvisOffset.x;
    posedSkeleton[name].y += pelvisOffset.y;
  });

  // The head anchor is a translation control: both head endpoints move by
  // the same amount, so Head Size remains entirely proportion-driven.
  const headOffset = offsetMap.headAnchor;
  ['headAnchor', 'headTop', 'headBottom'].forEach(name => {
    posedSkeleton[name].x += headOffset.x;
    posedSkeleton[name].y += headOffset.y;
  });

  editableJointNames
    .filter(name => name !== 'headAnchor' && name !== 'pelvisCenter')
    .forEach(name => {
      posedSkeleton[name].x += offsetMap[name].x;
      posedSkeleton[name].y += offsetMap[name].y;
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

  // Torso and pelvis meet at one protected waist boundary. Shape language can
  // move that boundary inward or keep it full, but cannot create two competing
  // endpoint corners in the same narrow transition zone.
  const transitionAverage = (torsoBottomWidth + pelvisTopWidth) / 2;
  const taperTarget = language.taperDirection === 'top'
    ? torsoBottomWidth
    : language.taperDirection === 'bottom'
      ? pelvisTopWidth
      : transitionAverage;
  const triangleNarrowing = clamp(
    language.triangleStrength * (0.08 + language.rigidity * 0.06),
    0,
    0.2,
  );
  const circleFullness = clamp(language.circleStrength * 0.025, 0, 0.04);
  const squareStability = clamp(language.squareStrength * 0.16, 0, 0.22);
  const directionalWaistWidth = transitionAverage * 0.76 + taperTarget * 0.24;
  const shapedWaistWidth = directionalWaistWidth
    * (1 - triangleNarrowing + circleFullness);
  const waistWidth = shapedWaistWidth * (1 - squareStability)
    + transitionAverage * squareStability;
  const waistAnchor = {
    x: (skeleton.torsoBottom.x + skeleton.pelvisTop.x) / 2,
    y: (skeleton.torsoBottom.y + skeleton.pelvisTop.y) / 2,
  };
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
      'pelvis', waistAnchor, skeleton.pelvisBottom,
      waistWidth, pelvisWidth, 'toStart',
      massOptions('pelvis', {
        lockStartWidth: true,
        jointOverlap: true,
        protectedStartWidth: pelvisTopWidth,
      }),
    ),
    makeMass(
      'torso', skeleton.neckAnchor, waistAnchor,
      torsoTopWidth, waistWidth, 'toEnd',
      massOptions('torso', {
        lockEndWidth: true,
        jointOverlap: true,
        protectedEndWidth: torsoBottomWidth,
      }),
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

function getDirection(start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(0.001, Math.hypot(dx, dy));

  return {
    x: dx / length,
    y: dy / length,
    angle: Math.atan2(dy, dx),
  };
}

function getOutwardNormal(point, direction, centreX, fallbackX) {
  let outward = { x: -direction.y, y: direction.x };
  const radialX = Math.abs(point.x - centreX) > 0.001
    ? Math.sign(point.x - centreX)
    : fallbackX;

  if (outward.x * radialX < 0) {
    outward = { x: -outward.x, y: -outward.y };
  }

  // Blend a small centreline-away component into the local contour normal.
  // This stays stable for heavily edited or nearly horizontal limbs.
  return getDirection(
    { x: 0, y: 0 },
    { x: outward.x * 0.78 + radialX * 0.22, y: outward.y * 0.78 },
  );
}

function getHeadAccentDirection(skeleton, placement) {
  const up = getDirection(skeleton.headAnchor, skeleton.headTop);
  const right = { x: -up.y, y: up.x };
  const placementDirection = {
    top: up,
    left: getDirection(
      { x: 0, y: 0 },
      { x: -right.x + up.x * 0.2, y: -right.y + up.y * 0.2 },
    ),
    right: getDirection(
      { x: 0, y: 0 },
      { x: right.x + up.x * 0.2, y: right.y + up.y * 0.2 },
    ),
  };

  return placementDirection[placement.headPlacement] || up;
}

function getAccentAnchorGeometry(byName, skeleton, placement, centreX) {
  const anchorProfile = accentAnchorProfiles[placement.anchorType];
  const makeLimbGeometry = (point, direction, width, fallbackX, edgeScale = 0.5) => ({
    point,
    direction,
    tangent: direction,
    outward: getOutwardNormal(point, direction, centreX, fallbackX),
    width,
    edgeDistance: width * edgeScale,
    anchorProfile,
  });

  if (placement.anchorName === 'head') {
    const direction = getHeadAccentDirection(skeleton, placement);
    const width = (byName.head.startWidth + byName.head.endWidth) / 2;
    const topDistance = Math.hypot(
      skeleton.headTop.x - skeleton.headAnchor.x,
      skeleton.headTop.y - skeleton.headAnchor.y,
    ) + byName.head.startWidth * 0.1;
    const isTopPlacement = placement.headPlacement === 'top';

    return {
      point: skeleton.headAnchor,
      direction,
      tangent: { x: -direction.y, y: direction.x },
      outward: direction,
      width,
      edgeDistance: isTopPlacement ? topDistance : width * 0.52,
      anchorProfile,
    };
  }

  const geometryByAnchor = {
    leftShoulder: () => makeLimbGeometry(
      skeleton.leftShoulder,
      getDirection(skeleton.leftShoulder, skeleton.leftElbow),
      byName.leftUpperArm.startWidth,
      -1,
      0.42,
    ),
    rightShoulder: () => makeLimbGeometry(
      skeleton.rightShoulder,
      getDirection(skeleton.rightShoulder, skeleton.rightElbow),
      byName.rightUpperArm.startWidth,
      1,
      0.42,
    ),
    leftElbow: () => makeLimbGeometry(
      skeleton.leftElbow,
      getDirection(skeleton.leftShoulder, skeleton.leftWrist),
      (byName.leftUpperArm.endWidth + byName.leftLowerArm.startWidth) / 2,
      -1,
    ),
    rightElbow: () => makeLimbGeometry(
      skeleton.rightElbow,
      getDirection(skeleton.rightShoulder, skeleton.rightWrist),
      (byName.rightUpperArm.endWidth + byName.rightLowerArm.startWidth) / 2,
      1,
    ),
    leftKnee: () => makeLimbGeometry(
      skeleton.leftKnee,
      getDirection(skeleton.leftHip, skeleton.leftAnkle),
      (byName.leftUpperLeg.endWidth + byName.leftLowerLeg.startWidth) / 2,
      -1,
    ),
    rightKnee: () => makeLimbGeometry(
      skeleton.rightKnee,
      getDirection(skeleton.rightHip, skeleton.rightAnkle),
      (byName.rightUpperLeg.endWidth + byName.rightLowerLeg.startWidth) / 2,
      1,
    ),
  };

  return geometryByAnchor[placement.anchorName]?.() || null;
}

function findHeavyAccentCollision(candidate, acceptedAccents) {
  return acceptedAccents.find(accent => {
    const distance = Math.hypot(
      candidate.center.x - accent.center.x,
      candidate.center.y - accent.center.y,
    );
    const smallerRadius = Math.max(1, Math.min(candidate.boundRadius, accent.boundRadius));
    const intrusion = candidate.boundRadius + accent.boundRadius - distance;

    return intrusion / smallerRadius > 0.72;
  });
}

function getCustomMotifTransformMetrics(placement, geometry) {
  const { profile } = placement;
  const supportPoints = profile.customMotif?.supportPoints || [];
  const flipScaleX = placement.flipX ? -1 : 1;
  const mirrorScaleY = placement.mirrorSign ?? 1;
  const scaleX = geometry.anchorProfile.shapeScaleX * profile.stretchX * flipScaleX;
  const scaleY = geometry.anchorProfile.shapeScaleY * profile.stretchY * mirrorScaleY;
  const angle = geometry.direction.angle + placement.rotationOffset;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  let minimumOutward = Infinity;
  let maximumOutward = -Infinity;
  let boundRadius = 0;

  supportPoints.forEach(point => {
    const deformedX = point.x
      + profile.skew * point.y
      + profile.offsetX * 0.5;
    const deformedY = profile.asymmetry * point.x
      + point.y
      + profile.offsetY * 0.5;
    const localX = deformedX * scaleX;
    const localY = deformedY * scaleY;
    const worldX = cosine * localX - sine * localY;
    const worldY = sine * localX + cosine * localY;
    const outwardProjection = worldX * geometry.outward.x
      + worldY * geometry.outward.y;

    minimumOutward = Math.min(minimumOutward, outwardProjection);
    maximumOutward = Math.max(maximumOutward, outwardProjection);
    boundRadius = Math.max(boundRadius, Math.hypot(worldX, worldY));
  });

  if (!Number.isFinite(minimumOutward) || !Number.isFinite(maximumOutward)) {
    return null;
  }

  return {
    outwardRadiusScale: Math.max(0, maximumOutward),
    inwardReachScale: Math.max(0, -minimumOutward),
    boundRadiusScale: boundRadius,
  };
}

function buildValidatedAccent(placement, geometry, primaryMassWidth, acceptedAccents) {
  const { anchorProfile } = geometry;
  const requestedSize = geometry.width * placement.scale * anchorProfile.scaleBias;
  const minimumSize = geometry.width * anchorProfile.minimumScale;
  const maximumSize = placement.shape === 'custom'
    ? Math.max(requestedSize, primaryMassWidth * anchorProfile.maximumPrimaryMassRatio)
    : primaryMassWidth * anchorProfile.maximumPrimaryMassRatio;
  let size = clamp(requestedSize, minimumSize, maximumSize);
  const customTransformMetrics = placement.shape === 'custom'
    ? getCustomMotifTransformMetrics(placement, geometry)
    : null;
  if (placement.shape === 'custom' && !customTransformMetrics) return null;
  const localShapeScaleX = anchorProfile.shapeScaleX
    * placement.profile.stretchX
    * (placement.profile.motifScaleX ?? 1);
  const localShapeScaleY = anchorProfile.shapeScaleY
    * placement.profile.stretchY
    * (placement.profile.motifScaleY ?? 1);
  const rotationCos = Math.abs(Math.cos(placement.rotationOffset));
  const rotationSin = Math.abs(Math.sin(placement.rotationOffset));
  const attachmentAxisScale = placement.shape === 'custom'
    ? placement.anchorType === 'head'
      ? rotationCos * localShapeScaleX + rotationSin * localShapeScaleY
      : rotationCos * localShapeScaleY + rotationSin * localShapeScaleX
    : placement.anchorType === 'head'
      ? localShapeScaleX
      : localShapeScaleY;
  const attachmentRatio = placement.anchorType === 'head'
    ? placement.profile.attachmentRatioX
    : placement.profile.attachmentRatioY;
  // Raster motifs use their rotated rectangular extent directly. Built-in
  // profiles retain the simpler conservative rotation allowance.
  const rotationReachScale = placement.shape === 'custom'
    ? 1
    : Math.max(0.7, rotationCos);
  const targetBreakRatio = anchorProfile.breakTargets[placement.breakStrength]
    ?? anchorProfile.breakTargets.medium;

  const calculateMetrics = candidateSize => {
    const outwardShapeRadius = customTransformMetrics
      ? candidateSize * customTransformMetrics.outwardRadiusScale
      : candidateSize * 0.5 * attachmentAxisScale;
    const shapeAttachmentReach = customTransformMetrics
      ? candidateSize * customTransformMetrics.inwardReachScale * 0.86
      : candidateSize * attachmentRatio * attachmentAxisScale * rotationReachScale;
    const attachmentReach = placement.shape === 'custom'
      ? Math.max(shapeAttachmentReach, geometry.width * 0.34)
      : shapeAttachmentReach;
    const minimumOverlap = Math.min(
      geometry.width * anchorProfile.minimumOverlap,
      candidateSize * 0.16,
    );
    const minimumVisibleBreak = Math.max(
      geometry.width * targetBreakRatio,
      Math.min(candidateSize * 0.14, geometry.width * 0.62),
    );
    const desiredCentreOffset = geometry.edgeDistance
      + candidateSize * placement.breakFraction
      - outwardShapeRadius;
    const minimumBreakOffset = geometry.edgeDistance
      + minimumVisibleBreak
      - outwardShapeRadius;
    const maximumAttachedOffset = geometry.edgeDistance
      + attachmentReach
      - minimumOverlap;

    return {
      outwardShapeRadius,
      attachmentReach,
      minimumOverlap,
      minimumVisibleBreak,
      desiredCentreOffset,
      minimumBreakOffset,
      maximumAttachedOffset,
    };
  };

  let metrics = calculateMetrics(size);
  if (metrics.minimumBreakOffset > metrics.maximumAttachedOffset && size < maximumSize) {
    // One correction pass: slightly enlarge an under-performing candidate
    // before deciding that this procedural variant should be rerolled.
    size = Math.min(maximumSize, size * 1.12);
    metrics = calculateMetrics(size);
  }

  if (metrics.minimumBreakOffset > metrics.maximumAttachedOffset) return null;

  const centreOffset = clamp(
    metrics.desiredCentreOffset,
    metrics.minimumBreakOffset,
    metrics.maximumAttachedOffset,
  );
  const inwardCorrection = Math.max(0, metrics.desiredCentreOffset - centreOffset);
  const overlap = geometry.edgeDistance + metrics.attachmentReach - centreOffset;
  const visibleBreak = centreOffset + metrics.outwardShapeRadius - geometry.edgeDistance;

  if (
    !Number.isFinite(centreOffset)
    || overlap < metrics.minimumOverlap * 0.98
    || visibleBreak < metrics.minimumVisibleBreak * 0.98
  ) {
    return null;
  }

  const center = {
    x: geometry.point.x + geometry.outward.x * centreOffset,
    y: geometry.point.y + geometry.outward.y * centreOffset,
  };
  const boundRadius = customTransformMetrics
    ? size * customTransformMetrics.boundRadiusScale * 1.04
    : size * 0.85 * Math.max(
      anchorProfile.shapeScaleX
        * placement.profile.stretchX
        * (placement.profile.motifScaleX ?? 1),
      anchorProfile.shapeScaleY
        * placement.profile.stretchY
        * (placement.profile.motifScaleY ?? 1),
    );
  const candidate = { center, boundRadius };
  const collision = findHeavyAccentCollision(candidate, acceptedAccents);
  let tangentShift = 0;

  if (collision) {
    const relativeTangent = (center.x - collision.center.x) * geometry.tangent.x
      + (center.y - collision.center.y) * geometry.tangent.y;
    const shiftDirection = Math.abs(relativeTangent) > 0.01
      ? Math.sign(relativeTangent)
      : Math.sign(placement.profile.offsetX || 1);
    tangentShift = Math.min(geometry.width * 0.34, size * 0.14) * shiftDirection;
    center.x += geometry.tangent.x * tangentShift;
    center.y += geometry.tangent.y * tangentShift;

    if (findHeavyAccentCollision(candidate, acceptedAccents)) return null;
  }

  // A collision correction normally moves along the limb, but edited poses
  // can make that tangent slightly non-perpendicular to the outward normal.
  // Recheck attachment using the final corrected centre.
  const outwardShift = tangentShift * (
    geometry.tangent.x * geometry.outward.x
    + geometry.tangent.y * geometry.outward.y
  );
  const finalCentreOffset = centreOffset + outwardShift;
  const finalOverlap = geometry.edgeDistance + metrics.attachmentReach - finalCentreOffset;
  const finalVisibleBreak = finalCentreOffset
    + metrics.outwardShapeRadius
    - geometry.edgeDistance;

  if (
    finalOverlap < metrics.minimumOverlap * 0.98
    || finalVisibleBreak < metrics.minimumVisibleBreak * 0.98
  ) {
    return null;
  }

  const maskAlongRadius = Math.min(
    size * anchorProfile.maskAlong,
    geometry.width * 0.68,
  );
  const maskOutwardRadius = Math.min(
    size * anchorProfile.maskOutward,
    geometry.width * 0.44,
  );
  const maskOffset = geometry.edgeDistance + maskOutwardRadius * 0.42;
  const bridgeWidth = Math.min(
    geometry.width * anchorProfile.bridgeWidth,
    size * 0.2,
  );
  const needsBridge = placement.mode === 'replace'
    || placement.shape === 'custom'
    || placement.anchorType === 'shoulder'
    || inwardCorrection > size * 0.012
    || finalOverlap < metrics.minimumOverlap * 1.5
    || attachmentRatio < 0.3;
  const bridgeInset = placement.anchorType === 'shoulder' ? 0.9 : 0.58;
  const bridgeStart = {
    x: geometry.point.x
      + geometry.outward.x * (geometry.edgeDistance - bridgeWidth * bridgeInset),
    y: geometry.point.y
      + geometry.outward.y * (geometry.edgeDistance - bridgeWidth * bridgeInset),
  };
  const bridgeEnd = {
    x: center.x - geometry.outward.x * metrics.attachmentReach * 0.32,
    y: center.y - geometry.outward.y * metrics.attachmentReach * 0.32,
  };
  const bridgeStartWidth = placement.mode === 'replace'
    ? Math.max(bridgeWidth, maskAlongRadius * 1.35)
    : bridgeWidth;
  const bridgeEndWidth = placement.mode === 'replace'
    ? Math.max(bridgeWidth * 0.7, maskAlongRadius * 0.85)
    : bridgeWidth * 0.7;

  return {
    ...placement,
    anchorPoint: geometry.point,
    outward: geometry.outward,
    center,
    maskCenter: {
      x: geometry.point.x + geometry.outward.x * maskOffset,
      y: geometry.point.y + geometry.outward.y * maskOffset,
    },
    size,
    requestedSize,
    tangentShift,
    angle: geometry.direction.angle + placement.rotationOffset,
    bodyAngle: geometry.direction.angle,
    shapeScaleX: anchorProfile.shapeScaleX,
    shapeScaleY: anchorProfile.shapeScaleY,
    overlap: finalOverlap,
    minimumOverlap: metrics.minimumOverlap,
    visibleBreak: finalVisibleBreak,
    minimumVisibleBreak: metrics.minimumVisibleBreak,
    needsBridge,
    bridgeStart,
    bridgeEnd,
    bridgeStartWidth,
    bridgeEndWidth,
    boundRadius,
    maskAlongRadius,
    maskOutwardRadius,
  };
}

function getAccentRenderData(masses, skeleton, placements) {
  const byName = Object.fromEntries(masses.map(mass => [mass.name, mass]));
  const centreX = (skeleton.neckAnchor.x + skeleton.pelvisCenter.x) / 2;
  const primaryMassWidth = Math.max(
    byName.torso.startWidth,
    byName.torso.endWidth,
    byName.pelvis.startWidth,
    byName.pelvis.endWidth,
  );
  const acceptedAccents = [];

  placements.forEach(placement => {
    const geometry = getAccentAnchorGeometry(byName, skeleton, placement, centreX);
    if (!geometry) return;

    const accent = buildValidatedAccent(
      placement,
      geometry,
      primaryMassWidth,
      acceptedAccents,
    );
    if (accent) acceptedAccents.push(accent);
  });

  return acceptedAccents;
}

function createAttachedAccentVariation(settings, random, masses, skeleton, language) {
  const maximumAttempts = 5;

  for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
    const variation = createAccentVariation(settings, random, language);
    if (variation.length === 0) return variation;

    const attachedAccents = getAccentRenderData(masses, skeleton, variation);
    if (attachedAccents.length === variation.length) {
      return variation;
    }
  }

  // A final conservative candidate preserves the requested shape family and
  // mode while avoiding a completely empty result after several unusual
  // collisions or extreme manual scale choices.
  const fallbackVariation = createAccentVariation(
    { ...settings, maxCount: 1 },
    random,
    language,
  ).map(placement => ({
    ...placement,
    scale: placement.shape === 'custom'
      ? placement.scale
      : Math.min(placement.scale, 2.8),
    rotationOffset: placement.rotationOffset * 0.65,
  }));
  const fallbackAccents = getAccentRenderData(masses, skeleton, fallbackVariation);
  if (fallbackAccents.length === fallbackVariation.length) {
    return fallbackVariation;
  }

  // Omitting an irrecoverable candidate is preferable to a floating fragment.
  return [];
}

function getMassBounds(masses, accents = []) {
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

  accents.forEach(accent => {
    const radius = accent.boundRadius;
    minX = Math.min(minX, accent.center.x - radius);
    minY = Math.min(minY, accent.center.y - radius);
    maxX = Math.max(maxX, accent.center.x + radius);
    maxY = Math.max(maxY, accent.center.y + radius);
  });

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function getFrameTransformForRect(
  masses,
  accents,
  frame,
  margin = 24,
  allowUpscale = false,
) {
  const bounds = getMassBounds(masses, accents);
  const scale = Math.min(
    allowUpscale ? Infinity : 1,
    (frame.width - margin * 2) / bounds.width,
    (frame.height - margin * 2) / bounds.height,
  );
  const offsetX = frame.x
    + (frame.width - bounds.width * scale) / 2
    - bounds.minX * scale;
  const offsetY = frame.y
    + (frame.height - bounds.height * scale) / 2
    - bounds.minY * scale;

  return { scale, offsetX, offsetY };
}

function getFrameTransform(masses, accents = []) {
  return getFrameTransformForRect(
    masses,
    accents,
    { x: 0, y: 0, width: canvas.width, height: canvas.height },
  );
}

function transformPoint(point, transform) {
  return {
    x: point.x * transform.scale + transform.offsetX,
    y: point.y * transform.scale + transform.offsetY,
  };
}

function transformAccents(accents, transform) {
  return accents.map(accent => ({
    ...accent,
    anchorPoint: transformPoint(accent.anchorPoint, transform),
    center: transformPoint(accent.center, transform),
    maskCenter: transformPoint(accent.maskCenter, transform),
    bridgeStart: transformPoint(accent.bridgeStart, transform),
    bridgeEnd: transformPoint(accent.bridgeEnd, transform),
    size: accent.size * transform.scale,
    boundRadius: accent.boundRadius * transform.scale,
    bridgeStartWidth: accent.bridgeStartWidth * transform.scale,
    bridgeEndWidth: accent.bridgeEndWidth * transform.scale,
    maskAlongRadius: accent.maskAlongRadius * transform.scale,
    maskOutwardRadius: accent.maskOutwardRadius * transform.scale,
  }));
}

function fitMassesToFrame(masses, transform = getFrameTransform(masses)) {

  return masses.map(mass => ({
    ...mass,
    start: transformPoint(mass.start, transform),
    end: transformPoint(mass.end, transform),
    startWidth: mass.startWidth * transform.scale,
    endWidth: mass.endWidth * transform.scale,
    protectedStartWidth: mass.protectedStartWidth
      ? mass.protectedStartWidth * transform.scale
      : undefined,
    protectedEndWidth: mass.protectedEndWidth
      ? mass.protectedEndWidth * transform.scale
      : undefined,
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
    protectedStartWidth: mass.protectedStartWidth,
    protectedEndWidth: mass.protectedEndWidth,
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
    protectedStartWidth,
    protectedEndWidth,
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

  contourNodes.forEach((node, index) => {
    const centre = {
      x: start.x + axis.x * length * node.t,
      y: start.y + axis.y * length * node.t,
    };
    let radius = startRadius + (endRadius - startRadius) * node.t;
    if (protectedStartWidth && index === 0) {
      radius = radius * 0.35 + (protectedStartWidth / 2) * 0.65;
    }
    if (protectedEndWidth && index === contourNodes.length - 1) {
      radius = radius * 0.35 + (protectedEndWidth / 2) * 0.65;
    }
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

function traceAccentPolygon(points, halfSize) {
  ctx.moveTo(points[0][0] * halfSize, points[0][1] * halfSize);
  points.slice(1).forEach(([x, y]) => ctx.lineTo(x * halfSize, y * halfSize));
  ctx.closePath();
}

function traceTriangleAccent(profile, halfSize) {
  const apex = profile.apexOffset;
  const taper = profile.taper;

  if (profile.variant === 'skewedTriangle') {
    traceAccentPolygon([
      [1.02, apex], [-0.82, -0.74 + taper], [-0.68, 0.82 + taper * 0.3],
    ], halfSize);
  } else if (profile.variant === 'wedge') {
    traceAccentPolygon([
      [1, -0.24 + apex * 0.35], [0.82, 0.34 + apex * 0.25],
      [-0.78, 0.76], [-0.64, -0.72],
    ], halfSize);
  } else if (profile.variant === 'longShard') {
    traceAccentPolygon([
      [1.2, apex * 0.5], [-0.2, 0.52], [-0.86, 0.34 + taper],
      [-0.68, -0.4 + taper], [0.1, -0.58],
    ], halfSize);
  } else if (profile.variant === 'bluntTriangle') {
    traceAccentPolygon([
      [0.88, -0.15 + apex * 0.4], [0.86, 0.18 + apex * 0.4],
      [-0.72, 0.78], [-0.84, -0.66],
    ], halfSize);
  } else {
    traceAccentPolygon([
      [0.96, -0.24 + apex * 0.35], [0.72, 0.4 + apex * 0.2],
      [-0.8, 0.7 + taper], [-0.68, -0.76 + taper],
    ], halfSize);
  }
}

function traceSquareAccent(profile, halfSize) {
  const taper = profile.taper;

  if (profile.variant === 'offsetRectangle') {
    traceAccentPolygon([
      [-0.92, -0.68], [0.78, -0.62 + taper],
      [0.92, 0.66 + taper], [-0.72, 0.8],
    ], halfSize);
  } else if (profile.variant === 'elongatedBlock') {
    traceAccentPolygon([
      [-1.08, -0.56], [0.94, -0.62], [1.02, 0.54], [-1, 0.62],
    ], halfSize);
  } else if (profile.variant === 'taperedBlock') {
    traceAccentPolygon([
      [-0.92, -0.78], [0.94, -0.52 + taper],
      [0.9, 0.5 + taper], [-0.82, 0.76],
    ], halfSize);
  } else if (profile.variant === 'steppedSlab') {
    traceAccentPolygon([
      [-0.96, -0.7], [0.24, -0.7], [0.3, -0.48],
      [0.96, -0.44], [0.9, 0.62], [-0.92, 0.72],
    ], halfSize);
  } else {
    const cut = profile.cornerCut;
    traceAccentPolygon([
      [-0.92 + cut, -0.78], [0.86 - cut, -0.72],
      [0.92, -0.72 + cut], [0.88, 0.68 - cut],
      [0.88 - cut, 0.74], [-0.84 + cut, 0.78],
      [-0.92, 0.78 - cut], [-0.94, -0.78 + cut],
    ], halfSize);
  }
}

function traceCircleAccent(profile, halfSize) {
  const bulge = profile.bulge;

  if (profile.variant === 'oval') {
    ctx.ellipse(0, 0, halfSize, halfSize * 0.82 * bulge, 0, 0, Math.PI * 2);
  } else if (profile.variant === 'offCentreRound') {
    ctx.moveTo(halfSize * 0.94, -halfSize * 0.08);
    ctx.bezierCurveTo(
      halfSize * 0.76, -halfSize * 0.78 * bulge,
      halfSize * 0.04, -halfSize * 1.02 * bulge,
      -halfSize * 0.68, -halfSize * 0.7,
    );
    ctx.bezierCurveTo(
      -halfSize, -halfSize * 0.28,
      -halfSize * 0.82, halfSize * 0.58,
      -halfSize * 0.26, halfSize * 0.84 * bulge,
    );
    ctx.bezierCurveTo(
      halfSize * 0.32, halfSize,
      halfSize * 0.9, halfSize * 0.56,
      halfSize * 0.94, -halfSize * 0.08,
    );
  } else if (profile.variant === 'roundedWedge') {
    ctx.moveTo(halfSize, halfSize * profile.apexOffset * 0.35);
    ctx.bezierCurveTo(
      halfSize * 0.7, -halfSize * 0.42,
      -halfSize * 0.38, -halfSize * 0.88 * bulge,
      -halfSize * 0.82, -halfSize * 0.52,
    );
    ctx.bezierCurveTo(
      -halfSize * 1.02, -halfSize * 0.18,
      -halfSize * 0.9, halfSize * 0.52,
      -halfSize * 0.48, halfSize * 0.7 * bulge,
    );
    ctx.bezierCurveTo(
      halfSize * 0.08, halfSize * 0.9,
      halfSize * 0.72, halfSize * 0.42,
      halfSize, halfSize * profile.apexOffset * 0.35,
    );
  } else if (profile.variant === 'capsule') {
    ctx.moveTo(-halfSize * 0.62, -halfSize * 0.58);
    ctx.lineTo(halfSize * 0.56, -halfSize * 0.54);
    ctx.bezierCurveTo(
      halfSize * 1.08, -halfSize * 0.5,
      halfSize * 1.06, halfSize * 0.48,
      halfSize * 0.54, halfSize * 0.58,
    );
    ctx.lineTo(-halfSize * 0.64, halfSize * 0.62);
    ctx.bezierCurveTo(
      -halfSize * 1.08, halfSize * 0.54,
      -halfSize * 1.04, -halfSize * 0.5,
      -halfSize * 0.62, -halfSize * 0.58,
    );
  } else {
    ctx.moveTo(halfSize * 1.04, halfSize * profile.apexOffset * 0.25);
    ctx.bezierCurveTo(
      halfSize * 0.48, -halfSize * 0.5,
      -halfSize * 0.12, -halfSize * 0.9 * bulge,
      -halfSize * 0.64, -halfSize * 0.62,
    );
    ctx.bezierCurveTo(
      -halfSize * 1.02, -halfSize * 0.2,
      -halfSize * 0.92, halfSize * 0.58,
      -halfSize * 0.34, halfSize * 0.82 * bulge,
    );
    ctx.bezierCurveTo(
      halfSize * 0.18, halfSize,
      halfSize * 0.72, halfSize * 0.5,
      halfSize * 1.04, halfSize * profile.apexOffset * 0.25,
    );
  }

  ctx.closePath();
}

function drawAccentShape(accent) {
  const halfSize = accent.size / 2;
  const profile = accent.profile;

  ctx.save();
  ctx.translate(accent.center.x, accent.center.y);
  ctx.rotate(accent.angle);
  ctx.scale(
    accent.shapeScaleX * profile.stretchX * (accent.flipX ? -1 : 1),
    accent.shapeScaleY * profile.stretchY * accent.mirrorSign,
  );
  ctx.transform(
    1,
    profile.asymmetry,
    profile.skew,
    1,
    profile.offsetX * halfSize,
    profile.offsetY * halfSize,
  );

  if (accent.shape === 'custom' && profile.customMotif) {
    const motifWidth = accent.size * profile.motifScaleX;
    const motifHeight = accent.size * profile.motifScaleY;
    const motifX = -profile.customMotif.originX
      / profile.customMotif.width
      * motifWidth;
    const motifY = -profile.customMotif.originY
      / profile.customMotif.height
      * motifHeight;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      profile.customMotif.canvas,
      motifX,
      motifY,
      motifWidth,
      motifHeight,
    );
    ctx.restore();
    return;
  }

  ctx.beginPath();

  if (accent.shape === 'circle') {
    traceCircleAccent(profile, halfSize);
  } else if (accent.shape === 'square') {
    traceSquareAccent(profile, halfSize);
  } else {
    traceTriangleAccent(profile, halfSize);
  }

  ctx.fill();
  ctx.restore();
}

function drawAccents(accents) {
  accents.forEach(accent => {
    if (accent.mode === 'replace') {
      // Clear only a shallow outer cap, then immediately rebuild its inner
      // connection with the merge base below. This rewrites the contour
      // without leaving a retained hole or negative-space notch.
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.ellipse(
        accent.maskCenter.x,
        accent.maskCenter.y,
        accent.maskAlongRadius,
        accent.maskOutwardRadius,
        accent.bodyAngle,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();
    }

    if (accent.needsBridge) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#111111';
      fillTaperedTransition(
        accent.bridgeStart,
        accent.bridgeEnd,
        accent.bridgeStartWidth,
        accent.bridgeEndWidth,
      );
      ctx.restore();
    }

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#111111';
    drawAccentShape(accent);
    ctx.restore();
  });
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

function clonePoseOffsetMap(offsetMap = poseOffsets) {
  return Object.fromEntries(
    Object.entries(offsetMap).map(([name, offset]) => [name, { ...offset }]),
  );
}

function cloneAccentSettings(settings) {
  return {
    ...settings,
    anchors: { ...settings.anchors },
  };
}

function createSilhouetteModel({
  seed,
  proportions,
  language,
  accentSettings,
  poseOffsetMap,
  massVariation = null,
}) {
  if (!language) return null;

  const random = createSeededRandom(seed);
  const variation = massVariation || createMassVariation(language, random, seed);
  const skeleton = applyPoseOffsets(
    buildDefaultSkeleton(proportions),
    poseOffsetMap,
  );
  const masses = buildBodyMasses(proportions, skeleton, variation, language);
  const accentVariation = createAttachedAccentVariation(
    accentSettings,
    random,
    masses,
    skeleton,
    language,
  );

  return {
    seed,
    proportions,
    language,
    massVariation: variation,
    accentVariation,
    poseOffsetMap,
  };
}

function renderSilhouetteModel(model, {
  width,
  height,
  margin = 24,
  allowUpscale = false,
  showDebug = false,
  showPoseEditor = false,
  updatePoseView = false,
} = {}) {
  const targetWidth = width ?? canvas.width;
  const targetHeight = height ?? canvas.height;
  ctx.clearRect(0, 0, targetWidth, targetHeight);

  if (!model?.language || !model?.massVariation) {
    if (updatePoseView) currentPoseView = null;
    return null;
  }

  const skeleton = applyPoseOffsets(
    buildDefaultSkeleton(model.proportions),
    model.poseOffsetMap,
  );
  const rawMasses = buildBodyMasses(
    model.proportions,
    skeleton,
    model.massVariation,
    model.language,
  );
  const rawAccents = getAccentRenderData(rawMasses, skeleton, model.accentVariation);
  const frameTransform = getFrameTransformForRect(
    rawMasses,
    rawAccents,
    { x: 0, y: 0, width: targetWidth, height: targetHeight },
    margin,
    allowUpscale,
  );
  const masses = fitMassesToFrame(rawMasses, frameTransform);
  const accents = transformAccents(rawAccents, frameTransform);
  const fittedSkeleton = transformSkeleton(skeleton, frameTransform);

  if (updatePoseView) {
    currentPoseView = { landmarks: fittedSkeleton, scale: frameTransform.scale };
  }

  ctx.save();
  ctx.fillStyle = '#111111';
  masses.forEach(mass => {
    traceMassPath(mass, model.language);
    ctx.fill();
  });
  drawMassTransitions(masses);
  drawAccents(accents);
  ctx.restore();

  if (showDebug) drawDebugOverlay(masses, model.language);
  if (showPoseEditor) drawPoseEditor(fittedSkeleton);

  return { masses, accents, fittedSkeleton, frameTransform };
}

function renderSilhouette() {
  if (!currentShapeLanguage || !currentMassVariation) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    currentPoseView = null;
    return;
  }

  renderSilhouetteModel({
    proportions: getCurrentProportions(),
    language: currentShapeLanguage,
    massVariation: currentMassVariation,
    accentVariation: currentAccentVariation,
    poseOffsetMap: poseOffsets,
  }, {
    width: canvas.width,
    height: canvas.height,
    showDebug: Boolean(debugToggle?.checked),
    showPoseEditor: editPoseToggle.checked,
    updatePoseView: true,
  });
}

function generateSilhouette(requestedSeed) {
  // Passing a stored canvas.dataset.seed value back as a number reproduces
  // the procedural contour while the same controls and proportions are active.
  const seed = Number.isInteger(requestedSeed)
    ? requestedSeed >>> 0
    : createGenerationSeed();
  const model = createSilhouetteModel({
    seed,
    proportions: getCurrentProportions(),
    language: getShapeLanguage(),
    accentSettings: getAccentSettings(),
    poseOffsetMap: poseOffsets,
  });

  currentShapeLanguage = model?.language ?? null;
  currentMassVariation = model?.massVariation ?? null;
  currentAccentVariation = model?.accentVariation ?? [];
  canvas.dataset.seed = String(seed);
  renderSilhouette();
}

function chooseRandomItem(items, random) {
  return items[Math.floor(random() * items.length)];
}

function createRandomizedShapeLanguage(baseLanguage, random, includeContourVariation) {
  const rawBlend = {
    circle: 0.12 + random() ** 1.35,
    square: 0.12 + random() ** 1.35,
    triangle: 0.12 + random() ** 1.35,
  };
  const dominantShape = chooseRandomItem(['circle', 'square', 'triangle'], random);
  rawBlend[dominantShape] += randomBetween(0.35, 0.85, random);
  const total = rawBlend.circle + rawBlend.square + rawBlend.triangle;
  const shapeBlend = {
    circle: rawBlend.circle / total,
    square: rawBlend.square / total,
    triangle: rawBlend.triangle / total,
  };

  return completeShapeLanguage({
    intensity: chooseRandomItem([0.55, 1, 1.45], random),
    rigidityName: chooseRandomItem(['organic', 'balanced', 'geometric'], random),
    contourVariationName: includeContourVariation
      ? chooseRandomItem(['clean', 'natural', 'expressive'], random)
      : baseLanguage.contourVariationName,
    shapeBlend,
    massBias: chooseRandomItem(['top', 'balanced', 'bottom'], random),
    taperDirection: chooseRandomItem(['top', 'neutral', 'bottom'], random),
  });
}

function createRandomizedProportions(random) {
  const style = proportionStyles[
    chooseRandomItem(Object.keys(proportionStyles), random)
  ];

  return Object.fromEntries(
    Object.entries(style.ranges).map(([name, [minimum, maximum]]) => [
      name,
      randomBetween(minimum, maximum, random),
    ]),
  );
}

function createRandomizedPoseOffsets(baseOffsets, random, preserveSymmetry) {
  const offsets = clonePoseOffsetMap(baseOffsets);
  const addJitter = (name, xAmount, yAmount) => {
    offsets[name].x += randomBetween(-xAmount, xAmount, random);
    offsets[name].y += randomBetween(-yAmount, yAmount, random);
  };

  addJitter('headAnchor', 8, 7);
  addJitter('neckAnchor', 5, 6);
  addJitter('pelvisCenter', 6, 7);

  const pairedJoints = [
    ['leftShoulder', 'rightShoulder', 10, 9],
    ['leftElbow', 'rightElbow', 17, 15],
    ['leftWrist', 'rightWrist', 22, 18],
    ['leftHip', 'rightHip', 9, 8],
    ['leftKnee', 'rightKnee', 15, 15],
    ['leftAnkle', 'rightAnkle', 18, 14],
  ];

  pairedJoints.forEach(([leftName, rightName, xAmount, yAmount]) => {
    const xJitter = randomBetween(-xAmount, xAmount, random);
    const yJitter = randomBetween(-yAmount, yAmount, random);
    offsets[leftName].x += xJitter;
    offsets[leftName].y += yJitter;

    if (preserveSymmetry) {
      offsets[rightName].x -= xJitter;
      offsets[rightName].y += yJitter;
    } else {
      offsets[rightName].x += randomBetween(-xAmount, xAmount, random);
      offsets[rightName].y += randomBetween(-yAmount, yAmount, random);
    }
  });

  return offsets;
}

function createRandomizedAccentSettings(baseSettings, random, broadenShapeType) {
  const settings = cloneAccentSettings(baseSettings);
  const availableShapes = ['circle', 'square', 'triangle'];
  if (currentCustomAccentMotif) availableShapes.push('custom');

  if (broadenShapeType) {
    settings.shape = chooseRandomItem(availableShapes, random);
    settings.customMotif = settings.shape === 'custom'
      ? currentCustomAccentMotif
      : null;
  }

  const anchorNames = Object.keys(settings.anchors);
  settings.anchors = Object.fromEntries(
    anchorNames.map(name => [name, random() < 0.58]),
  );
  if (!Object.values(settings.anchors).some(Boolean)) {
    settings.anchors[chooseRandomItem(anchorNames, random)] = true;
  }

  settings.maxCount = 1 + Math.floor(random() * 3);
  settings.symmetry = random() < 0.5;
  settings.mode = chooseRandomItem(['additive', 'replace', 'mixed'], random);
  settings.breakStrength = chooseRandomItem(['subtle', 'medium', 'strong'], random);
  settings.breakFraction = {
    subtle: 0.26,
    medium: 0.48,
    strong: 0.7,
  }[settings.breakStrength];
  settings.rotationRange = chooseRandomItem([10, 30, 60, 90], random);
  settings.allowRandomFlip = random() < 0.65;

  return settings;
}

function getBatchGridLayout(count) {
  const commonLayouts = {
    4: { columns: 2, rows: 2 },
    6: { columns: 3, rows: 2 },
    9: { columns: 3, rows: 3 },
    12: { columns: 4, rows: 3 },
    16: { columns: 4, rows: 4 },
    20: { columns: 5, rows: 4 },
    24: { columns: 6, rows: 4 },
    30: { columns: 6, rows: 5 },
  };
  if (commonLayouts[count]) return commonLayouts[count];

  let bestLayout = null;
  for (let rows = 1; rows <= count; rows += 1) {
    const columns = Math.ceil(count / rows);
    if (columns < rows) continue;

    const emptyCells = columns * rows - count;
    const gridRatio = columns / rows;
    const score = Math.abs(gridRatio - 1.35) + emptyCells * 0.24;
    if (!bestLayout || score < bestLayout.score) {
      bestLayout = { columns, rows, score };
    }
  }

  return {
    columns: bestLayout?.columns ?? 1,
    rows: bestLayout?.rows ?? count,
  };
}

function renderBatchSheet(models) {
  const count = models.length;
  batchContext.save();
  batchContext.fillStyle = '#e8e7e3';
  batchContext.fillRect(0, 0, batchCanvas.width, batchCanvas.height);

  if (count === 0) {
    batchContext.restore();
    return;
  }

  const { columns, rows } = getBatchGridLayout(count);
  const outerMargin = 36;
  const gap = count >= 20 ? 12 : 18;
  const availableWidth = batchCanvas.width - outerMargin * 2 - gap * (columns - 1);
  const availableHeight = batchCanvas.height - outerMargin * 2 - gap * (rows - 1);
  const cellWidth = availableWidth / columns;
  const cellHeight = availableHeight / rows;
  const renderWidth = Math.max(1, Math.round(cellWidth));
  const renderHeight = Math.max(1, Math.round(cellHeight));
  const previousContext = ctx;

  batchStagingCanvas.width = renderWidth;
  batchStagingCanvas.height = renderHeight;
  ctx = batchStagingContext;

  try {
    models.forEach((model, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const cellX = outerMargin + column * (cellWidth + gap);
      const cellY = outerMargin + row * (cellHeight + gap);
      const fitMargin = Math.max(8, Math.min(renderWidth, renderHeight) * 0.055);

      batchContext.fillStyle = '#ffffff';
      batchContext.fillRect(cellX, cellY, cellWidth, cellHeight);
      renderSilhouetteModel(model, {
        width: renderWidth,
        height: renderHeight,
        margin: fitMargin,
        allowUpscale: true,
      });
      batchContext.drawImage(
        batchStagingCanvas,
        cellX,
        cellY,
        cellWidth,
        cellHeight,
      );
    });
  } finally {
    ctx = previousContext;
    batchContext.restore();
  }
}

function generateBatchSilhouettes() {
  const count = clamp(Number.parseInt(batchCountControl.value, 10) || 9, 2, 30);
  batchCountControl.value = String(count);
  const variationMode = batchVariationModeControl.value;
  const randomizationScope = randomizationScopeControl.value;
  const batchSeed = createGenerationSeed();
  const baseLanguage = getShapeLanguage();
  const baseProportions = getCurrentProportions();
  const basePoseOffsets = clonePoseOffsetMap();
  const baseAccentSettings = getAccentSettings();

  if (!baseLanguage) {
    currentBatchModels = [];
    renderBatchSheet(currentBatchModels);
    return;
  }

  const sharedBodyRandom = createSeededRandom(batchSeed ^ 0xA53A9E21);
  const sharedMassVariation = variationMode === 'randomized'
    && randomizationScope === 'accent'
    && baseLanguage
    ? createMassVariation(baseLanguage, sharedBodyRandom, batchSeed)
    : null;
  const models = [];

  for (let index = 0; index < count; index += 1) {
    const seed = (batchSeed + Math.imul(index + 1, 0x9E3779B9)) >>> 0;
    const settingsRandom = createSeededRandom(seed ^ 0x85EBCA6B);
    let language = baseLanguage;
    let proportions = { ...baseProportions };
    let modelPoseOffsets = clonePoseOffsetMap(basePoseOffsets);
    let accentSettings = cloneAccentSettings(baseAccentSettings);
    let massVariation = null;

    if (variationMode === 'randomized') {
      if (randomizationScope === 'accent') {
        accentSettings = createRandomizedAccentSettings(
          baseAccentSettings,
          settingsRandom,
          false,
        );
        massVariation = sharedMassVariation;
      } else {
        language = createRandomizedShapeLanguage(
          baseLanguage,
          settingsRandom,
          randomizationScope === 'everything',
        );
        proportions = createRandomizedProportions(settingsRandom);

        if (randomizationScope === 'everything') {
          modelPoseOffsets = createRandomizedPoseOffsets(
            basePoseOffsets,
            settingsRandom,
            symmetryToggle.checked,
          );
          accentSettings = createRandomizedAccentSettings(
            baseAccentSettings,
            settingsRandom,
            true,
          );
        }
      }
    }

    const model = createSilhouetteModel({
      seed,
      proportions,
      language,
      accentSettings,
      poseOffsetMap: modelPoseOffsets,
      massVariation,
    });
    if (model) models.push(model);
  }

  currentBatchModels = models;
  batchCanvas.dataset.seed = String(batchSeed);
  renderBatchSheet(models);
}

function updateBatchVariationControls() {
  randomizationScopeRow.hidden = batchVariationModeControl.value !== 'randomized';
}

function updateGenerationMode() {
  const batchMode = generationModeControl.value === 'batch';
  batchControls.hidden = !batchMode;
  canvas.hidden = batchMode;
  batchCanvas.hidden = !batchMode;
  workspaceSymmetryControl.hidden = batchMode;
  workspaceTitle.textContent = batchMode ? 'Silhouette sheet' : 'Single blockout';
  workspaceCanvasSize.textContent = batchMode ? '1920 × 1080' : '600 × 700';
  generateButton.textContent = batchMode ? 'Generate Silhouette Sheet' : 'Generate Silhouette';

  if (batchMode) {
    renderBatchSheet(currentBatchModels);
  } else {
    renderSilhouette();
  }
}

function generateFromCurrentMode() {
  if (generationModeControl.value === 'batch') {
    generateBatchSilhouettes();
  } else {
    generateSilhouette();
  }
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

function updateAccentSymmetryState() {
  accentSymmetryState.textContent = accentSymmetryToggle.checked ? 'ON' : 'OFF';
}

function updateAccentInheritanceState() {
  inheritAccentShapeLanguageState.textContent = inheritAccentShapeLanguageToggle.checked
    ? 'ON'
    : 'OFF';
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
generateButton.addEventListener('click', generateFromCurrentMode);
generationModeControl.addEventListener('change', updateGenerationMode);
batchVariationModeControl.addEventListener('change', updateBatchVariationControls);
symmetryToggle.addEventListener('change', updateSymmetryState);
accentSymmetryToggle.addEventListener('change', updateAccentSymmetryState);
inheritAccentShapeLanguageToggle.addEventListener('change', updateAccentInheritanceState);
accentShapeTypeControl.addEventListener('change', updateCustomAccentControls);
customAccentUpload.addEventListener('change', handleCustomAccentUpload);
accentScaleMinControl.addEventListener('change', normaliseAccentScaleInputs);
accentScaleMaxControl.addEventListener('change', normaliseAccentScaleInputs);
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
updateAccentSymmetryState();
updateAccentInheritanceState();
updateCustomAccentControls();
updateBatchVariationControls();
normaliseAccentScaleInputs();
applyProportionStyle(proportionStyleControl.value);
generateSilhouette();
updateGenerationMode();
