const generateButton = document.getElementById('generateButton');
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
const cbCircle = document.getElementById('shapeCircle');
const cbSquare = document.getElementById('shapeSquare');
const cbTriangle = document.getElementById('shapeTriangle');
const wCircle = document.getElementById('weightCircle');
const wSquare = document.getElementById('weightSquare');
const wTriangle = document.getElementById('weightTriangle');
const heightControl = document.getElementById('heightControl');
const bodyWidthControl = document.getElementById('bodyWidthControl');
const shoulderControl = document.getElementById('shoulderControl');
const debugToggle = document.getElementById('debugRegions');

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getShapeLanguage() {
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
    roundness: clamp(0.08 + ratios.circle * 0.82, 0.06, 0.9),
    blockiness: clamp(0.12 + ratios.square * 0.88, 0.12, 1),
    taper: clamp(0.08 + ratios.triangle * 0.72, 0.08, 0.8),
  };
}

function makeMass(name, start, end, startWidth, endWidth, taperDirection = 'toEnd') {
  return { name, start, end, startWidth, endWidth, taperDirection };
}

function buildBodyMasses(modifiers) {
  const hf = modifiers.height;
  const bw = modifiers.bodyWidth;
  const sh = modifiers.shoulder;
  const cx = canvas.width / 2;
  const top = 38;

  const heightVariation = randomBetween(0.94, 1.06);
  const upperMass = randomBetween(0.9, 1.13);
  const lowerMass = randomBetween(0.88, 1.14);
  const limbMass = randomBetween(0.88, 1.16);
  const torsoTopBias = randomBetween(0.9, 1.14);
  const torsoBottomBias = randomBetween(0.82, 1.12);
  const asymmetry = randomBetween(-0.035, 0.035);

  const headHeight = 76 * hf * heightVariation;
  const headWidth = 72 * bw * randomBetween(0.88, 1.12);
  const torsoLength = 180 * hf * heightVariation;
  const torsoTopWidth = 176 * bw * sh * upperMass * torsoTopBias;
  const torsoBottomWidth = 132 * bw * lowerMass * torsoBottomBias;
  const pelvisHeight = 66 * hf;
  const pelvisWidth = 142 * bw * lowerMass * randomBetween(0.92, 1.12);

  const headTop = { x: cx + randomBetween(-4, 4), y: top };
  const headBottom = { x: cx + randomBetween(-3, 3), y: top + headHeight };
  const torsoTop = { x: cx, y: headBottom.y - 7 };
  const torsoBottom = { x: cx + randomBetween(-5, 5), y: torsoTop.y + torsoLength };
  const pelvisTop = { x: torsoBottom.x, y: torsoBottom.y - 18 };
  const pelvisBottom = { x: torsoBottom.x, y: pelvisTop.y + pelvisHeight };

  const shoulderY = torsoTop.y + 27 * hf;
  const shoulderHalfWidth = torsoTopWidth * 0.44;
  const leftShoulder = { x: cx - shoulderHalfWidth, y: shoulderY };
  const rightShoulder = { x: cx + shoulderHalfWidth, y: shoulderY };

  const upperArmLength = 118 * hf * randomBetween(0.92, 1.08);
  const lowerArmLength = 124 * hf * randomBetween(0.92, 1.08);
  const armDrop = randomBetween(0.48, 0.62);
  const armReach = Math.sqrt(1 - armDrop * armDrop);
  const leftElbow = {
    x: leftShoulder.x - upperArmLength * armReach,
    y: leftShoulder.y + upperArmLength * (armDrop + asymmetry),
  };
  const rightElbow = {
    x: rightShoulder.x + upperArmLength * armReach,
    y: rightShoulder.y + upperArmLength * (armDrop - asymmetry),
  };
  const forearmReach = randomBetween(0.28, 0.42);
  const forearmDrop = Math.sqrt(1 - forearmReach * forearmReach);
  const leftWrist = {
    x: leftElbow.x - lowerArmLength * forearmReach,
    y: leftElbow.y + lowerArmLength * forearmDrop,
  };
  const rightWrist = {
    x: rightElbow.x + lowerArmLength * forearmReach,
    y: rightElbow.y + lowerArmLength * forearmDrop,
  };

  const hipHalfWidth = pelvisWidth * 0.27;
  const leftHip = { x: pelvisBottom.x - hipHalfWidth, y: pelvisBottom.y - 12 };
  const rightHip = { x: pelvisBottom.x + hipHalfWidth, y: pelvisBottom.y - 12 };
  const upperLegLength = 158 * hf * heightVariation * randomBetween(0.94, 1.06);
  const lowerLegLength = 166 * hf * heightVariation * randomBetween(0.94, 1.06);
  const legSpread = randomBetween(0.09, 0.17);
  const leftKnee = {
    x: leftHip.x - upperLegLength * (legSpread + asymmetry),
    y: leftHip.y + upperLegLength,
  };
  const rightKnee = {
    x: rightHip.x + upperLegLength * (legSpread - asymmetry),
    y: rightHip.y + upperLegLength,
  };
  const ankleInset = randomBetween(0.01, 0.08);
  const leftAnkle = {
    x: leftKnee.x + lowerLegLength * ankleInset,
    y: leftKnee.y + lowerLegLength,
  };
  const rightAnkle = {
    x: rightKnee.x - lowerLegLength * ankleInset,
    y: rightKnee.y + lowerLegLength,
  };

  const armWidth = 50 * bw * limbMass;
  const forearmWidth = 40 * bw * limbMass;
  const thighWidth = 76 * bw * lowerMass;
  const calfWidth = 54 * bw * limbMass;

  return [
    makeMass('leftLowerLeg', leftKnee, leftAnkle, calfWidth, calfWidth * 0.55),
    makeMass('rightLowerLeg', rightKnee, rightAnkle, calfWidth * 1.02, calfWidth * 0.57),
    makeMass('leftUpperLeg', leftHip, leftKnee, thighWidth, calfWidth * 0.92),
    makeMass('rightUpperLeg', rightHip, rightKnee, thighWidth * 1.02, calfWidth * 0.94),
    makeMass('leftLowerArm', leftElbow, leftWrist, forearmWidth, forearmWidth * 0.58),
    makeMass('rightLowerArm', rightElbow, rightWrist, forearmWidth * 0.98, forearmWidth * 0.6),
    makeMass('leftUpperArm', leftShoulder, leftElbow, armWidth, forearmWidth * 1.04),
    makeMass('rightUpperArm', rightShoulder, rightElbow, armWidth * 1.02, forearmWidth * 1.02),
    makeMass('pelvis', pelvisTop, pelvisBottom, pelvisWidth * 0.9, pelvisWidth, 'toStart'),
    makeMass('torso', torsoTop, torsoBottom, torsoTopWidth, torsoBottomWidth),
    makeMass('head', headTop, headBottom, headWidth, headWidth * 0.9),
  ];
}

function getMassBounds(masses) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  masses.forEach(mass => {
    const radius = Math.max(mass.startWidth, mass.endWidth) * 0.62;
    [mass.start, mass.end].forEach(point => {
      minX = Math.min(minX, point.x - radius);
      minY = Math.min(minY, point.y - radius);
      maxX = Math.max(maxX, point.x + radius);
      maxY = Math.max(maxY, point.y + radius);
    });
  });

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function fitMassesToFrame(masses) {
  const margin = 24;
  const bounds = getMassBounds(masses);
  const scale = Math.min(
    1,
    (canvas.width - margin * 2) / bounds.width,
    (canvas.height - margin * 2) / bounds.height,
  );
  const offsetX = (canvas.width - bounds.width * scale) / 2 - bounds.minX * scale;
  const offsetY = (canvas.height - bounds.height * scale) / 2 - bounds.minY * scale;

  return masses.map(mass => ({
    ...mass,
    start: {
      x: mass.start.x * scale + offsetX,
      y: mass.start.y * scale + offsetY,
    },
    end: {
      x: mass.end.x * scale + offsetX,
      y: mass.end.y * scale + offsetY,
    },
    startWidth: mass.startWidth * scale,
    endWidth: mass.endWidth * scale,
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

  if (mass.taperDirection === 'toEnd') {
    endWidth *= 1 - language.taper * 0.42;
  } else {
    startWidth *= 1 - language.taper * 0.32;
  }

  const overlap = Math.min(startWidth, endWidth) * 0.14;
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
    startLeft: { x: start.x + normal.x * startRadius, y: start.y + normal.y * startRadius },
    startRight: { x: start.x - normal.x * startRadius, y: start.y - normal.y * startRadius },
    endLeft: { x: end.x + normal.x * endRadius, y: end.y + normal.y * endRadius },
    endRight: { x: end.x - normal.x * endRadius, y: end.y - normal.y * endRadius },
  };
}

function traceMassPath(mass, language) {
  const geometry = getMassGeometry(mass, language);
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
  const curve = language.roundness * (1 - language.blockiness * 0.38);
  const sideBend = curve * 0.14;
  const capRound = curve * 0.95;
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

function generateSilhouette() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const language = getShapeLanguage();
  if (!language) return;

  const modifiers = {
    height: clamp(Number.parseFloat(heightControl.value) || 1, 0.6, 1.6),
    bodyWidth: clamp(Number.parseFloat(bodyWidthControl.value) || 1, 0.6, 1.6),
    shoulder: clamp(Number.parseFloat(shoulderControl.value) || 1, 0.6, 1.6),
  };
  const masses = fitMassesToFrame(buildBodyMasses(modifiers));

  ctx.save();
  ctx.fillStyle = '#111111';
  masses.forEach(mass => {
    traceMassPath(mass, language);
    ctx.fill();
  });
  ctx.restore();

  if (debugToggle && debugToggle.checked) {
    drawDebugOverlay(masses, language);
  }
}

generateButton.addEventListener('click', generateSilhouette);
generateSilhouette();
