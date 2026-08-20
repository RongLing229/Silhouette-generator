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

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildShapeHierarchy(shapes) {
  // Existing weights now express hierarchy preference: larger weights receive
  // the more visually dominant role. Random tie-breakers keep equal settings varied.
  const ranked = shapes
    .map(shape => ({ ...shape, tieBreaker: Math.random() }))
    .sort((a, b) => b.weight - a.weight || b.tieBreaker - a.tieBreaker);

  const primary = ranked[0].name;
  const secondary = ranked[1] ? ranked[1].name : primary;

  return {
    primary,
    secondary,
    // Do not pretend that one of two selected shapes is a distinct accent.
    accent: ranked[2] ? ranked[2].name : null,
  };
}

function getRegionalRoleWeights(region, pos) {
  if (region.name === 'torso') return { primary: 0.88, secondary: 0.12, accent: 0 };
  if (region.name === 'hips') return { primary: 0.84, secondary: 0.16, accent: 0 };
  if (region.name === 'head') return { primary: 0.2, secondary: 0.65, accent: 0.15 };

  if (region.name === 'leftArm' || region.name === 'rightArm') {
    // Measure outward from the shoulder so the current broad arm region can
    // still distinguish shoulder, elbow, and forearm detail areas.
    const fromShoulder = region.name === 'leftArm'
      ? (region.x + region.w - pos.x) / region.w
      : (pos.x - region.x) / region.w;
    const isShoulderTip = fromShoulder < 0.18;
    const isElbow = fromShoulder >= 0.42 && fromShoulder <= 0.58;

    return isShoulderTip || isElbow
      ? { primary: 0.12, secondary: 0.7, accent: 0.18 }
      : { primary: 0.18, secondary: 0.82, accent: 0 };
  }

  if (region.name === 'leftLeg' || region.name === 'rightLeg') {
    const downLeg = (pos.y - region.y) / region.h;
    if (downLeg < 0.45) return { primary: 0.78, secondary: 0.22, accent: 0 };
    if (downLeg <= 0.58) return { primary: 0.36, secondary: 0.46, accent: 0.18 };
    return { primary: 0.18, secondary: 0.82, accent: 0 };
  }

  return { primary: 0.5, secondary: 0.5, accent: 0 };
}

function pickHierarchicalShape(hierarchy, roleWeights) {
  const choices = Object.entries(roleWeights)
    .filter(([role, weight]) => weight > 0 && hierarchy[role])
    .map(([role, weight]) => ({ role, weight, type: hierarchy[role] }));
  const total = choices.reduce((sum, choice) => sum + choice.weight, 0);
  let roll = Math.random() * total;

  for (const choice of choices) {
    roll -= choice.weight;
    if (roll <= 0) return choice;
  }

  return choices[choices.length - 1];
}
// Define simple invisible body regions relative to the canvas.
function getBodyRegions(c, modifiers = { height: 1, bodyWidth: 1, shoulder: 1 }) {
  const w = c.width;
  const h = c.height;
  const cx = w / 2;
  const hf = modifiers.height;
  const bw = modifiers.bodyWidth;
  const sh = modifiers.shoulder;

  const headW = Math.floor(w * 0.18 * bw);
  const headH = Math.floor(h * 0.12 * hf);
  const headX = Math.floor(cx - headW / 2);
  const headY = Math.floor(h * 0.06 * hf);

  const torsoW = Math.floor(w * 0.28 * bw);
  const torsoH = Math.floor(h * 0.28 * hf);
  const torsoX = Math.floor(cx - torsoW / 2);
  const torsoY = headY + headH + Math.floor(6 * hf);

  const hipsW = Math.floor(w * 0.30 * bw);
  const hipsH = Math.floor(h * 0.12 * hf);
  const hipsX = Math.floor(cx - hipsW / 2);
  const hipsY = torsoY + torsoH - Math.floor(6 * hf);

  const armW = Math.floor(w * 0.22 * bw);
  const armH = Math.floor(h * 0.18 * hf);
  const leftArmX = Math.floor(torsoX - armW - Math.floor(6 * sh));
  const rightArmX = Math.floor(torsoX + torsoW + Math.floor(6 * sh));
  const armY = torsoY + Math.floor(8 * hf);

  const legW = Math.floor(w * 0.12 * bw);
  const legH = Math.floor(h * 0.30 * hf);
  const leftLegX = Math.floor(cx - legW - Math.floor(8 * bw));
  const rightLegX = Math.floor(cx + Math.floor(8 * bw));
  const legY = hipsY + hipsH - Math.floor(4 * hf);

  return [
    { name: 'head', x: headX, y: headY, w: headW, h: headH, weight: 1 },
    { name: 'torso', x: torsoX, y: torsoY, w: torsoW, h: torsoH, weight: 6 },
    { name: 'hips', x: hipsX, y: hipsY, w: hipsW, h: hipsH, weight: 4 },
    { name: 'leftArm', x: leftArmX, y: armY, w: armW, h: armH, weight: 3 },
    { name: 'rightArm', x: rightArmX, y: armY, w: armW, h: armH, weight: 3 },
    { name: 'leftLeg', x: leftLegX, y: legY, w: legW, h: legH, weight: 3 },
    { name: 'rightLeg', x: rightLegX, y: legY, w: legW, h: legH, weight: 3 },
  ];
}

generateButton.addEventListener('click', () => {
  const selectedShapes = [];
  const addShape = (checked, weightInput, name) => {
    if (!checked) return;
    let w = parseInt(weightInput.value, 10);
    if (!Number.isFinite(w) || w < 0) w = 0;
    w = Math.min(10, w);
    if (w > 0) selectedShapes.push({ name, weight: w });
  };

  addShape(cbCircle.checked, wCircle, 'circle');
  addShape(cbSquare.checked, wSquare, 'square');
  addShape(cbTriangle.checked, wTriangle, 'triangle');

  // clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (selectedShapes.length === 0) return; // nothing selected or all weights zero

  // Assign the three roles once per figure, then reuse them in every region.
  const shapeHierarchy = buildShapeHierarchy(selectedShapes);

  // read modifiers (simple float values, default 1)
  const hf = Math.max(0.6, Math.min(1.6, parseFloat(heightControl.value) || 1));
  const bw = Math.max(0.6, Math.min(1.6, parseFloat(bodyWidthControl.value) || 1));
  const sh = Math.max(0.6, Math.min(1.6, parseFloat(shoulderControl.value) || 1));

  const regions = getBodyRegions(canvas, { height: hf, bodyWidth: bw, shoulder: sh });

  // Auto-scale regions so the whole humanoid (all regions) fits inside canvas with a margin.
  function bboxOf(regs) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    regs.forEach(r => {
      minX = Math.min(minX, r.x);
      minY = Math.min(minY, r.y);
      maxX = Math.max(maxX, r.x + r.w);
      maxY = Math.max(maxY, r.y + r.h);
    });
    return { minX, minY, maxX, maxY, width: Math.max(0, maxX - minX), height: Math.max(0, maxY - minY) };
  }

  const margin = 16;
  const bb = bboxOf(regions);
  let scale = 1;
  if (bb.width > 0 && bb.height > 0) {
    const scaleX = (canvas.width - margin * 2) / bb.width;
    const scaleY = (canvas.height - margin * 2) / bb.height;
    scale = Math.min(1, scaleX, scaleY);
    if (scale < 1) {
      // scale each region relative to bounding-box origin, then center the scaled bbox within canvas margins
      const scaled = regions.map(r => ({
        name: r.name,
        x: Math.round((r.x - bb.minX) * scale),
        y: Math.round((r.y - bb.minY) * scale),
        w: Math.max(1, Math.round(r.w * scale)),
        h: Math.max(1, Math.round(r.h * scale)),
        weight: r.weight,
      }));

      const sbb = bboxOf(scaled);
      const dx = margin + Math.round(((canvas.width - margin * 2) - sbb.width) / 2);
      const dy = margin + Math.round(((canvas.height - margin * 2) - sbb.height) / 2);

      for (let i = 0; i < regions.length; i++) {
        regions[i] = {
          name: scaled[i].name,
          x: scaled[i].x + dx,
          y: scaled[i].y + dy,
          w: scaled[i].w,
          h: scaled[i].h,
          weight: scaled[i].weight,
        };
      }
    }
  }

  // anchors on torso/hips to keep body connected
  const torso = regions.find(r => r.name === 'torso');
  const hips = regions.find(r => r.name === 'hips');
  const anchor = {
    neck: { x: Math.floor(torso.x + torso.w / 2), y: Math.floor(torso.y + 4) },
    leftShoulder: { x: torso.x + 6, y: Math.floor(torso.y + torso.h * 0.18) },
    rightShoulder: { x: torso.x + torso.w - 6, y: Math.floor(torso.y + torso.h * 0.18) },
    leftHip: { x: hips.x + 8, y: hips.y + 6 },
    rightHip: { x: hips.x + hips.w - 8, y: hips.y + 6 },
  };

  // Debug: draw region outlines and anchor points when toggle is enabled
  if (debugToggle && debugToggle.checked) {
    ctx.save();
    ctx.strokeStyle = 'rgba(200,40,40,0.9)';
    ctx.lineWidth = 1;
    regions.forEach(r => {
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    });
    // draw anchors
    ctx.fillStyle = 'rgba(20,120,200,0.9)';
    const anchors = [anchor.neck, anchor.leftShoulder, anchor.rightShoulder, anchor.leftHip, anchor.rightHip];
    anchors.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // helper: pick a position inside region but biased toward anchor
  function pickPos(region, anchorPoint, bias, size) {
    const minX = region.x + Math.floor(size / 2);
    const maxX = region.x + region.w - Math.floor(size / 2);
    const minY = region.y + Math.floor(size / 2);
    const maxY = region.y + region.h - Math.floor(size / 2);

    const rx = randInt(minX, Math.max(minX, maxX));
    const ry = randInt(minY, Math.max(minY, maxY));

    // lerp toward anchor
    const x = Math.round(rx * (1 - bias) + anchorPoint.x * bias + randInt(-4, 4));
    const y = Math.round(ry * (1 - bias) + anchorPoint.y * bias + randInt(-4, 4));

    return {
      x: clamp(x, minX, maxX),
      y: clamp(y, minY, maxY),
    };
  }

  // distribute shapes proportionally to region weights
  const totalWeight = regions.reduce((s, r) => s + r.weight, 0);
  const totalCount = 40;
  let placed = 0;

  ctx.fillStyle = '#000';

  regions.forEach((region, idx) => {
    // allocate count for this region
    let n = Math.round((region.weight / totalWeight) * totalCount);
    // ensure we place exactly totalCount shapes
    if (idx === regions.length - 1) n = totalCount - placed;
    placed += n;

    // choose an anchor and bias per region to encourage connections
    let regionAnchor = { x: region.x + Math.floor(region.w / 2), y: region.y + Math.floor(region.h / 2) };
    let bias = 0.35;
    if (region.name === 'head') { regionAnchor = anchor.neck; bias = 0.9; }
    if (region.name === 'leftArm') { regionAnchor = anchor.leftShoulder; bias = 0.7; }
    if (region.name === 'rightArm') { regionAnchor = anchor.rightShoulder; bias = 0.7; }
    if (region.name === 'leftLeg') { regionAnchor = anchor.leftHip; bias = 0.7; }
    if (region.name === 'rightLeg') { regionAnchor = anchor.rightHip; bias = 0.7; }
    if (region.name === 'torso') { bias = 0.25; }
    if (region.name === 'hips') { bias = 0.35; }

    for (let i = 0; i < n; i++) {
      const maxSize = Math.max(8, Math.min(region.w, region.h));
      const base = randInt(8, Math.min(60, Math.floor(maxSize)));
      // scale shape sizes by height factor so taller body yields larger shapes
      const baseSize = Math.max(4, Math.round(base * hf * scale));
      const pos = pickPos(region, regionAnchor, bias, baseSize);
      const shape = pickHierarchicalShape(
        shapeHierarchy,
        getRegionalRoleWeights(region, pos),
      );
      const roleScale = { primary: 1, secondary: 0.86, accent: 0.62 };
      const size = Math.max(4, Math.round(baseSize * roleScale[shape.role]));
      const type = shape.type;

      if (type === 'circle') {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'square') {
        ctx.fillRect(pos.x - size / 2, pos.y - size / 2, size, size);
      } else if (type === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y - size / 2);
        ctx.lineTo(pos.x - size / 2, pos.y + size / 2);
        ctx.lineTo(pos.x + size / 2, pos.y + size / 2);
        ctx.closePath();
        ctx.fill();
      }
    }
  });
});
