// Color utilities and ΔE calculation

export const calculateDeltaE = (lab1, lab2) => {
  // CIE76 formula (simple Euclidean distance in LAB space)
  const deltaL = lab1.L - lab2.L;
  const deltaA = lab1.A - lab2.A;
  const deltaB = lab1.B - lab2.B;
  
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
};

export const rgbToLab = (r, g, b) => {
  // Convert RGB to XYZ
  let rNorm = r / 255;
  let gNorm = g / 255;
  let bNorm = b / 255;
  
  rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92;
  gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92;
  bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92;
  
  const x = (rNorm * 0.4124 + gNorm * 0.3576 + bNorm * 0.1805) * 100;
  const y = (rNorm * 0.2126 + gNorm * 0.7152 + bNorm * 0.0722) * 100;
  const z = (rNorm * 0.0193 + gNorm * 0.1192 + bNorm * 0.9505) * 100;
  
  // Convert XYZ to LAB (D65 illuminant)
  const xn = 95.047;
  const yn = 100.000;
  const zn = 108.883;
  
  let xNorm = x / xn;
  let yNorm = y / yn;
  let zNorm = z / zn;
  
  xNorm = xNorm > 0.008856 ? Math.pow(xNorm, 1/3) : (7.787 * xNorm + 16/116);
  yNorm = yNorm > 0.008856 ? Math.pow(yNorm, 1/3) : (7.787 * yNorm + 16/116);
  zNorm = zNorm > 0.008856 ? Math.pow(zNorm, 1/3) : (7.787 * zNorm + 16/116);
  
  const L = (116 * yNorm) - 16;
  const A = 500 * (xNorm - yNorm);
  const B = 200 * (yNorm - zNorm);
  
  return { L, A, B };
};

export const labToHex = (lab) => {
  // Simplified conversion for display purposes
  // In production, use a proper color library
  return '#' + Math.floor(lab.L * 2.55).toString(16).padStart(2, '0').repeat(3);
};
