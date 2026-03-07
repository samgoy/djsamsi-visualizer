// Flower of Life: 19 circles on a hexagonal grid
// Each circle has radius R, centers separated by distance R

export interface CirclePos {
  cx: number;
  cy: number;
  ring: number; // 0 = center, 1 = first ring (6), 2 = second ring (12)
}

export function flowerOfLifeCircles(radius: number): CirclePos[] {
  const circles: CirclePos[] = [];

  // Center circle
  circles.push({ cx: 0, cy: 0, ring: 0 });

  // First ring: 6 circles at distance R
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6; // start at -30° for upright orientation
    circles.push({
      cx: radius * Math.cos(angle),
      cy: radius * Math.sin(angle),
      ring: 1,
    });
  }

  // Second ring: 12 circles
  for (let i = 0; i < 6; i++) {
    const angle1 = (Math.PI / 3) * i - Math.PI / 6;
    // At distance 2R
    circles.push({
      cx: 2 * radius * Math.cos(angle1),
      cy: 2 * radius * Math.sin(angle1),
      ring: 2,
    });
    // Between the 2R positions at distance R*sqrt(3)
    const angle2 = (Math.PI / 3) * i + Math.PI / 6 - Math.PI / 6;
    const dist = radius * Math.sqrt(3);
    circles.push({
      cx: dist * Math.cos(angle2),
      cy: dist * Math.sin(angle2),
      ring: 2,
    });
  }

  return circles;
}

// Seed of Life: just the center + first ring (7 circles)
export function seedOfLifeCircles(radius: number): CirclePos[] {
  return flowerOfLifeCircles(radius).filter((c) => c.ring <= 1);
}

// Generate points along a torus surface (3D projected to 2D)
export interface TorusPoint {
  x: number;
  y: number;
  z: number;
  screenX: number;
  screenY: number;
  depth: number; // 0-1, for size/opacity scaling
}

export function torusPoints(
  count: number,
  majorRadius: number,
  minorRadius: number,
  phiOffset: number, // animates flow around the tube
  focalLength: number,
  distance: number,
): TorusPoint[] {
  const points: TorusPoint[] = [];
  const rings = Math.ceil(Math.sqrt(count));
  const perRing = Math.ceil(count / rings);

  for (let i = 0; i < rings; i++) {
    const theta = (i / rings) * Math.PI * 2;
    for (let j = 0; j < perRing; j++) {
      const phi = (j / perRing) * Math.PI * 2 + phiOffset;
      const x = (majorRadius + minorRadius * Math.cos(phi)) * Math.cos(theta);
      const y = (majorRadius + minorRadius * Math.cos(phi)) * Math.sin(theta);
      const z = minorRadius * Math.sin(phi);

      const scale = focalLength / (z + distance);
      points.push({
        x,
        y,
        z,
        screenX: x * scale,
        screenY: y * scale,
        depth: (z + minorRadius) / (2 * minorRadius), // 0-1
      });
    }
  }

  return points;
}
