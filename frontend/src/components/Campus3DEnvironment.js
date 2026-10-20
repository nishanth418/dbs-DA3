import * as THREE from 'three';

/**
 * Creates high-resolution 2D Canvas Textures for modern architectural campus signage
 */
export function createSignTexture({ title, subtitle, bg = '#0f172a', border = '#38bdf8', text = '#ffffff', sub = '#94a3b8', width = 512, height = 128 }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = bg;
  ctx.roundRect ? ctx.roundRect(4, 4, width - 8, height - 8, 12) : ctx.rect(4, 4, width - 8, height - 8);
  ctx.fill();

  // Glowing Border
  ctx.strokeStyle = border;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Subtle interior glow
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // Title
  ctx.fillStyle = text;
  ctx.font = 'bold 36px "Inter", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, width / 2, subtitle ? height * 0.42 : height / 2);

  // Subtitle
  if (subtitle) {
    ctx.fillStyle = sub;
    ctx.font = '600 20px "Inter", "Segoe UI", sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText(subtitle, width / 2, height * 0.74);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural Sky Dome Texture (Sunset / Golden Hour / Blue-Hour Gradient)
 */
export function createSkyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Vertical gradient from Twilight Blue -> Lavender Periwinkle -> Golden Sunset Peach -> Horizon Amber
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0.0, '#1e3a8a'); // Twilight cobalt blue at zenith
  grad.addColorStop(0.3, '#2563eb'); // Rich royal blue
  grad.addColorStop(0.55, '#6366f1'); // Lavender twilight transition
  grad.addColorStop(0.72, '#f43f5e'); // Soft rose sunset horizon
  grad.addColorStop(0.85, '#f97316'); // Warm sunset peach
  grad.addColorStop(1.0, '#fde047'); // Golden horizon sun glow

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 1024);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Paved Courtyard Tiles Texture
 */
export function createPavingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base stone paver color
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, 512, 512);

  // Paver tile joints
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;

  const tileSize = 64;
  for (let x = 0; x <= 512; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Subtle natural speckled texture
  ctx.fillStyle = 'rgba(100, 116, 139, 0.04)';
  for (let i = 0; i < 400; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    const rw = 2 + Math.random() * 4;
    ctx.fillRect(rx, ry, rw, rw);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
}

/**
 * Builds the complete 3D University Hostel Campus environment
 */
export function buildHostelCampusEnvironment(scene) {
  const animatedObjects = {
    trees: [],
    windows: [],
    dustParticles: null
  };
  const disposables = [];

  // ==========================================================================
  // 1. SKY DOME & ATMOSPHERE (Sunset / Golden Hour / Blue-Hour)
  // ==========================================================================
  const skyTex = createSkyTexture();
  disposables.push(skyTex);

  const skyGeo = new THREE.SphereGeometry(180, 32, 24);
  const skyMat = new THREE.MeshBasicMaterial({
    map: skyTex,
    side: THREE.BackSide,
    fog: false
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  skyDome.position.set(0, -10, 0);
  scene.add(skyDome);
  disposables.push(skyGeo, skyMat);

  // Warm Golden Sunset Distance Fog
  scene.fog = new THREE.FogExp2(0xfbcfe8, 0.0075);

  // ==========================================================================
  // 2. LIGHTING RIG (Bright, Welcoming, Sunset / Golden Hour Illumination)
  // ==========================================================================
  // A. Hemisphere Light (Soft Sky Blue down + Warm Earth Golden bounce up)
  const hemiLight = new THREE.HemisphereLight(0xbfdbfe, 0xfde047, 1.45);
  scene.add(hemiLight);

  // B. Main Golden Hour Sunlight (Directional Sun)
  const sunLight = new THREE.DirectionalLight(0xfff3d6, 2.4);
  sunLight.position.set(34, 28, -22);
  sunLight.target.position.set(0, 2, 0);
  scene.add(sunLight);
  scene.add(sunLight.target);

  // C. Soft Cool Periwinkle Fill Light (prevents dark back faces)
  const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.85);
  fillLight.position.set(-26, 18, 22);
  scene.add(fillLight);

  // D. Entrance Canopy Warm Lantern Light (Block A portico)
  const entrancePointLight = new THREE.PointLight(0xf59e0b, 3.2, 14);
  entrancePointLight.position.set(-0.5, 1.8, 1.8);
  scene.add(entrancePointLight);

  // E. Mess Dining Hall Interior Warm Glow
  const messPointLight = new THREE.PointLight(0xf59e0b, 2.8, 13);
  messPointLight.position.set(11, 2.0, -2.5);
  scene.add(messPointLight);

  // ==========================================================================
  // 3. SHARED ARCHITECTURAL MATERIALS
  // ==========================================================================
  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9, // Clean, modern light architectural concrete
    roughness: 0.65,
    metalness: 0.12
  });
  disposables.push(concreteMat);

  const slateTrimMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Dark slate floor bands, frames & curbs
    roughness: 0.45,
    metalness: 0.35
  });
  disposables.push(slateTrimMat);

  const darkFrameMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.3,
    metalness: 0.5
  });
  disposables.push(darkFrameMat);

  const warmWindowMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24, // Warm glowing dorm room windows
    emissive: 0xf59e0b,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.1
  });
  disposables.push(warmWindowMat);

  const coolWindowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8, // Daylit/reflective dorm room windows
    roughness: 0.1,
    metalness: 0.95
  });
  disposables.push(coolWindowMat);

  const glassFacadeMat = new THREE.MeshPhysicalMaterial({
    color: 0xbae6fd, // Mess hall glass curtain wall
    transparent: true,
    opacity: 0.5,
    roughness: 0.08,
    metalness: 0.6,
    transmission: 0.5,
    ior: 1.45,
    depthWrite: false
  });
  disposables.push(glassFacadeMat);

  const woodSoffitMat = new THREE.MeshStandardMaterial({
    color: 0xb45309, // Architectural warm timber soffit
    roughness: 0.6,
    metalness: 0.15
  });
  disposables.push(woodSoffitMat);

  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a, // Fresh natural campus lawn
    roughness: 0.9,
    metalness: 0.05
  });
  disposables.push(grassMat);

  const hedgeMat = new THREE.MeshStandardMaterial({
    color: 0x14532d, // Manicured geometric shrubs
    roughness: 0.85
  });
  disposables.push(hedgeMat);

  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x57534e,
    roughness: 0.85
  });
  disposables.push(barkMat);

  const foliageMats = [
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 })
  ];
  disposables.push(...foliageMats);

  const metalRailMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.7,
    roughness: 0.3
  });
  disposables.push(metalRailMat);

  const paverTex = createPavingTexture();
  disposables.push(paverTex);
  const walkwayMat = new THREE.MeshStandardMaterial({
    map: paverTex,
    roughness: 0.7,
    metalness: 0.15
  });
  disposables.push(walkwayMat);

  // Main Root Campus Group
  const campusGroup = new THREE.Group();
  scene.add(campusGroup);

  // ==========================================================================
  // 4. CAMPUS GROUND & COURTYARD HARDSCAPING
  // ==========================================================================
  // A. Wide Campus Ground Base
  const baseGroundGeo = new THREE.PlaneGeometry(120, 120);
  const baseGroundMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.85
  });
  const baseGround = new THREE.Mesh(baseGroundGeo, baseGroundMat);
  baseGround.rotation.x = -Math.PI / 2;
  baseGround.position.y = -0.05;
  campusGroup.add(baseGround);
  disposables.push(baseGroundGeo, baseGroundMat);

  // B. Main Central Promenade Walkway (Extends from foreground to Block A entrance)
  const mainWalkGeo = new THREE.BoxGeometry(4.2, 0.1, 24);
  const mainWalk = new THREE.Mesh(mainWalkGeo, walkwayMat);
  mainWalk.position.set(-0.5, 0.05, 7.0);
  campusGroup.add(mainWalk);
  disposables.push(mainWalkGeo);

  // Slate Border Curbs on Promenade
  const curbL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 24), slateTrimMat);
  curbL.position.set(-2.15, 0.07, 7.0);
  campusGroup.add(curbL);

  const curbR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 24), slateTrimMat);
  curbR.position.set(1.15, 0.07, 7.0);
  campusGroup.add(curbR);

  // C. Cross Walkway to Block B (West)
  const crossWalkB = new THREE.Mesh(new THREE.BoxGeometry(11, 0.09, 2.6), walkwayMat);
  crossWalkB.position.set(-7.5, 0.045, 1.5);
  campusGroup.add(crossWalkB);

  // D. Cross Walkway to Mess Hall (East)
  const crossWalkMess = new THREE.Mesh(new THREE.BoxGeometry(10, 0.09, 2.6), walkwayMat);
  crossWalkMess.position.set(6.5, 0.045, 0.5);
  crossWalkMess.rotation.y = -0.08;
  campusGroup.add(crossWalkMess);

  // E. Landscaped Lawns & Planters with Curbs
  function createLawn(x, z, width, depth) {
    const lawnGroup = new THREE.Group();
    lawnGroup.position.set(x, 0, z);

    // Stone Curb Raised Box
    const curbBox = new THREE.Mesh(new THREE.BoxGeometry(width + 0.3, 0.16, depth + 0.3), slateTrimMat);
    curbBox.position.y = 0.08;
    lawnGroup.add(curbBox);

    // Green Grass Bed
    const grassMesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.18, depth), grassMat);
    grassMesh.position.y = 0.09;
    lawnGroup.add(grassMesh);

    // Border Hedges
    const hedgeThick = 0.35;
    const hedgeH = 0.45;
    const hFront = new THREE.Mesh(new THREE.BoxGeometry(width, hedgeH, hedgeThick), hedgeMat);
    hFront.position.set(0, hedgeH / 2 + 0.08, depth / 2 - hedgeThick / 2);
    lawnGroup.add(hFront);

    campusGroup.add(lawnGroup);
  }

  // Left Courtyard Lawn
  createLawn(-6.2, 7.5, 6.2, 10.5);
  // Right Courtyard Lawn
  createLawn(5.6, 6.8, 5.8, 8.5);
  // West Lawn in front of Block B
  createLawn(-12.5, 4.5, 5.0, 6.0);
  // East Lawn beside Mess Hall
  createLawn(12.0, 5.0, 5.5, 6.5);

  // ==========================================================================
  // 5. DETAILED ARCHITECTURAL HOSTEL BUILDINGS
  // ==========================================================================

  // --------------------------------------------------------------------------
  // BUILDING 1: MAIN RESIDENTIAL HOSTEL (BLOCK A - 4 Floors)
  // --------------------------------------------------------------------------
  const blockA = new THREE.Group();
  blockA.position.set(-1.0, 0, -4.5);
  campusGroup.add(blockA);

  const bAWidth = 18.0;
  const bAHeight = 8.8;
  const bADepth = 7.0;

  // Main Concrete Facade Core
  const blockABody = new THREE.Mesh(new THREE.BoxGeometry(bAWidth, bAHeight, bADepth), concreteMat);
  blockABody.position.y = bAHeight / 2;
  blockA.add(blockABody);

  // Horizontal Floor Slabs / Spandrels (Floors 1, 2, 3, 4 + Roof Parapet)
  const floorCountA = 4;
  const floorHeightA = bAHeight / floorCountA;
  for (let f = 0; f <= floorCountA; f++) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(bAWidth + 0.4, 0.22, bADepth + 0.4), slateTrimMat);
    slab.position.y = f * floorHeightA;
    blockA.add(slab);
  }

  // Rooftop Parapet Wall & Staircase Penthouse
  const roofParapet = new THREE.Mesh(new THREE.BoxGeometry(bAWidth + 0.2, 0.6, bADepth + 0.2), concreteMat);
  roofParapet.position.y = bAHeight + 0.3;
  blockA.add(roofParapet);

  const penthouse = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.8, 3.5), slateTrimMat);
  penthouse.position.set(3.5, bAHeight + 0.9, 0);
  blockA.add(penthouse);

  // Front Dorm Windows & Balconies (Grid of 6 rooms per floor)
  const roomsPerRow = 6;
  const winWidth = 1.4;
  const winHeight = 1.15;
  const winZ = bADepth / 2 + 0.04;

  for (let floor = 0; floor < floorCountA; floor++) {
    const floorY = floor * floorHeightA + floorHeightA * 0.52;

    for (let c = 0; c < roomsPerRow; c++) {
      // Center ground floor is reserved for the Reception Entrance
      if (floor === 0 && (c === 2 || c === 3)) continue;

      const roomX = -bAWidth / 2 + 1.6 + c * (bAWidth - 3.2) / (roomsPerRow - 1);

      // Window Frame (Dark Bronze / Charcoal Metal)
      const frame = new THREE.Mesh(new THREE.BoxGeometry(winWidth + 0.16, winHeight + 0.16, 0.12), darkFrameMat);
      frame.position.set(roomX, floorY, winZ);
      blockA.add(frame);

      // Window Glass: mix of warm golden lit dorms and cool sky-reflective windows
      const isLit = (floor + c) % 2 === 0 || (floor === 1 && c === 1) || (floor === 2 && c === 4);
      const glassMat = isLit ? warmWindowMat.clone() : coolWindowMat;
      const glass = new THREE.Mesh(new THREE.BoxGeometry(winWidth, winHeight, 0.06), glassMat);
      glass.position.set(roomX, floorY, winZ + 0.04);
      blockA.add(glass);

      // Window Mullion divider (vertical center bar)
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.05, winHeight, 0.08), darkFrameMat);
      mullion.position.set(roomX, floorY, winZ + 0.05);
      blockA.add(mullion);

      if (isLit) {
        animatedObjects.windows.push(glassMat);
      }

      // Projecting Balconies on Upper Floors (Floors 1, 2, 3)
      if (floor >= 1 && (c === 0 || c === 1 || c === 4 || c === 5)) {
        const balcGroup = new THREE.Group();
        balcGroup.position.set(roomX, floor * floorHeightA + 0.1, winZ + 0.55);

        // Balcony Concrete Floor Slab
        const bSlab = new THREE.Mesh(new THREE.BoxGeometry(winWidth + 0.5, 0.14, 1.1), concreteMat);
        balcGroup.add(bSlab);

        // Balcony Front Railing
        const railFront = new THREE.Mesh(new THREE.BoxGeometry(winWidth + 0.5, 0.65, 0.05), metalRailMat);
        railFront.position.set(0, 0.38, 0.52);
        balcGroup.add(railFront);

        // Balcony Side Railings
        const railSideL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.65, 1.05), metalRailMat);
        railSideL.position.set(-(winWidth + 0.5) / 2, 0.38, 0);
        balcGroup.add(railSideL);

        const railSideR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.65, 1.05), metalRailMat);
        railSideR.position.set((winWidth + 0.5) / 2, 0.38, 0);
        balcGroup.add(railSideR);

        blockA.add(balcGroup);
      }
    }
  }

  // Ground Floor Main Entrance Portico / Reception Canopy
  const canopyWidth = 5.6;
  const canopyDepth = 3.6;
  const canopyHeight = 0.28;
  const canopyY = floorHeightA * 0.98;

  const entranceCanopy = new THREE.Mesh(new THREE.BoxGeometry(canopyWidth, canopyHeight, canopyDepth), concreteMat);
  entranceCanopy.position.set(0.5, canopyY, winZ + canopyDepth / 2 - 0.2);
  blockA.add(entranceCanopy);

  // Warm Timber Soffit Under Entrance Canopy
  const soffit = new THREE.Mesh(new THREE.BoxGeometry(canopyWidth - 0.2, 0.05, canopyDepth - 0.2), woodSoffitMat);
  soffit.position.set(0.5, canopyY - canopyHeight / 2 - 0.02, winZ + canopyDepth / 2 - 0.2);
  blockA.add(soffit);

  // Twin Entrance Support Columns
  const colGeo = new THREE.CylinderGeometry(0.12, 0.12, canopyY);
  const colL = new THREE.Mesh(colGeo, darkFrameMat);
  colL.position.set(0.5 - canopyWidth / 2 + 0.35, canopyY / 2, winZ + canopyDepth - 0.45);
  blockA.add(colL);

  const colR = new THREE.Mesh(colGeo, darkFrameMat);
  colR.position.set(0.5 + canopyWidth / 2 - 0.35, canopyY / 2, winZ + canopyDepth - 0.45);
  blockA.add(colR);

  // Reception Glass Double Doors
  const doorWidth = 2.6;
  const doorHeight = 1.85;
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(doorWidth + 0.14, doorHeight + 0.14, 0.1), darkFrameMat);
  doorFrame.position.set(0.5, doorHeight / 2, winZ + 0.02);
  blockA.add(doorFrame);

  const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, 0.05), glassFacadeMat);
  doorGlass.position.set(0.5, doorHeight / 2, winZ + 0.03);
  blockA.add(doorGlass);

  // Reception Door Handles
  const handleGeo = new THREE.BoxGeometry(0.04, 0.45, 0.06);
  const handleL = new THREE.Mesh(handleGeo, metalRailMat);
  handleL.position.set(0.42, doorHeight / 2, winZ + 0.07);
  blockA.add(handleL);

  const handleR = new THREE.Mesh(handleGeo, metalRailMat);
  handleR.position.set(0.58, doorHeight / 2, winZ + 0.07);
  blockA.add(handleR);

  // Reception Warm Interior Back-Plane (Emits warm glow into courtyard)
  const recepBack = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.0), warmWindowMat);
  recepBack.position.set(0.5, doorHeight / 2, winZ - 0.3);
  blockA.add(recepBack);

  // Crisp Architectural Building Sign Over Entrance: "HOSTEL BLOCK A • RECEPTION"
  const signBlockATex = createSignTexture({
    title: 'HOSTEL BLOCK A',
    subtitle: 'RESIDENCE & RECEPTION',
    bg: '#0f172a',
    border: '#38bdf8',
    text: '#ffffff',
    sub: '#38bdf8',
    width: 512,
    height: 128
  });
  disposables.push(signBlockATex);

  const signBlockAMat = new THREE.MeshBasicMaterial({
    map: signBlockATex,
    transparent: true
  });
  disposables.push(signBlockAMat);

  const signBlockAMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.85), signBlockAMat);
  signBlockAMesh.position.set(0.5, canopyY + 0.6, winZ + 0.08);
  blockA.add(signBlockAMesh);

  // --------------------------------------------------------------------------
  // BUILDING 2: WEST RESIDENCE WING (BLOCK B - 3 Floors)
  // --------------------------------------------------------------------------
  const blockB = new THREE.Group();
  blockB.position.set(-13.5, 0, -1.8);
  blockB.rotation.y = 0.28; // Angled ~16 degrees to create quad enclosure
  campusGroup.add(blockB);

  const bBWidth = 12.0;
  const bBHeight = 6.6;
  const bBDepth = 6.0;

  const blockBBody = new THREE.Mesh(new THREE.BoxGeometry(bBWidth, bBHeight, bBDepth), concreteMat);
  blockBBody.position.y = bBHeight / 2;
  blockB.add(blockBBody);

  // Floor Slabs
  const floorCountB = 3;
  const floorHeightB = bBHeight / floorCountB;
  for (let f = 0; f <= floorCountB; f++) {
    const slabB = new THREE.Mesh(new THREE.BoxGeometry(bBWidth + 0.35, 0.2, bBDepth + 0.35), slateTrimMat);
    slabB.position.y = f * floorHeightB;
    blockB.add(slabB);
  }

  // Windows on Block B
  const roomsB = 4;
  const winZB = bBDepth / 2 + 0.04;
  for (let floor = 0; floor < floorCountB; floor++) {
    const floorYB = floor * floorHeightB + floorHeightB * 0.52;
    for (let c = 0; c < roomsB; c++) {
      const roomXB = -bBWidth / 2 + 1.8 + c * (bBWidth - 3.6) / (roomsB - 1);
      const isLitB = (floor + c) % 2 === 1;

      const frameB = new THREE.Mesh(new THREE.BoxGeometry(winWidth + 0.14, winHeight + 0.14, 0.1), darkFrameMat);
      frameB.position.set(roomXB, floorYB, winZB);
      blockB.add(frameB);

      const glassMatB = isLitB ? warmWindowMat.clone() : coolWindowMat;
      const glassB = new THREE.Mesh(new THREE.BoxGeometry(winWidth, winHeight, 0.06), glassMatB);
      glassB.position.set(roomXB, floorYB, winZB + 0.03);
      blockB.add(glassB);

      if (isLitB) {
        animatedObjects.windows.push(glassMatB);
      }
    }
  }

  // Architectural Sun Louvers on Corner of Block B
  for (let l = 0; l < 8; l++) {
    const louver = new THREE.Mesh(new THREE.BoxGeometry(0.08, bBHeight - 0.4, 0.5), slateTrimMat);
    louver.position.set(bBWidth / 2 - 0.3, bBHeight / 2, -bBDepth / 2 + 0.6 + l * 0.65);
    blockB.add(louver);
  }

  // Sign on Block B
  const signBlockBTex = createSignTexture({
    title: 'HOSTEL BLOCK B',
    subtitle: 'STUDENT RESIDENCE WING',
    bg: '#0f172a',
    border: '#38bdf8',
    text: '#ffffff',
    sub: '#38bdf8',
    width: 512,
    height: 128
  });
  disposables.push(signBlockBTex);
  const signBlockBMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), new THREE.MeshBasicMaterial({ map: signBlockBTex, transparent: true }));
  signBlockBMesh.position.set(0, floorHeightB * 0.95, winZB + 0.06);
  blockB.add(signBlockBMesh);

  // --------------------------------------------------------------------------
  // BUILDING 3: CAMPUS DINING & MESS HALL PAVILION ("MESS")
  // --------------------------------------------------------------------------
  const messGroup = new THREE.Group();
  messGroup.position.set(11.2, 0, -2.6);
  messGroup.rotation.y = -0.18; // Angled slightly inward
  campusGroup.add(messGroup);

  const messWidth = 10.5;
  const messHeight = 4.8;
  const messDepth = 7.5;

  // Solid Rear & Side Concrete Enclosure
  const messRear = new THREE.Mesh(new THREE.BoxGeometry(messWidth, messHeight, 1.2), concreteMat);
  messRear.position.set(0, messHeight / 2, -messDepth / 2 + 0.6);
  messGroup.add(messRear);

  const messSideL = new THREE.Mesh(new THREE.BoxGeometry(1.2, messHeight, messDepth), concreteMat);
  messSideL.position.set(-messWidth / 2 + 0.6, messHeight / 2, 0);
  messGroup.add(messSideL);

  const messSideR = new THREE.Mesh(new THREE.BoxGeometry(1.2, messHeight, messDepth), concreteMat);
  messSideR.position.set(messWidth / 2 - 0.6, messHeight / 2, 0);
  messGroup.add(messSideR);

  // Expansive Contemporary Double-Height Glass Curtain Wall Facade
  const glassFront = new THREE.Mesh(new THREE.BoxGeometry(messWidth - 1.2, messHeight - 0.5, 0.1), glassFacadeMat);
  glassFront.position.set(0, messHeight / 2, messDepth / 2 - 0.2);
  messGroup.add(glassFront);

  // Architectural Steel Mullion Grid on Glass
  for (let m = -3; m <= 3; m += 1.5) {
    const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.08, messHeight - 0.5, 0.14), darkFrameMat);
    mullionV.position.set(m, messHeight / 2, messDepth / 2 - 0.16);
    messGroup.add(mullionV);
  }
  const mullionH = new THREE.Mesh(new THREE.BoxGeometry(messWidth - 1.2, 0.08, 0.14), darkFrameMat);
  mullionH.position.set(0, messHeight * 0.5, messDepth / 2 - 0.16);
  messGroup.add(mullionH);

  // Warm Dining Hall Interior Backing Plane (Creates bustling dining atmosphere)
  const messGlowPlane = new THREE.Mesh(new THREE.PlaneGeometry(messWidth - 2, messHeight - 1), warmWindowMat);
  messGlowPlane.position.set(0, messHeight / 2, 0);
  messGroup.add(messGlowPlane);

  // Cantilevered Floating Roof Overhang with Warm Timber Soffit
  const messRoof = new THREE.Mesh(new THREE.BoxGeometry(messWidth + 1.2, 0.35, messDepth + 1.6), slateTrimMat);
  messRoof.position.set(0, messHeight + 0.18, 0.3);
  messGroup.add(messRoof);

  const messSoffit = new THREE.Mesh(new THREE.BoxGeometry(messWidth + 1.0, 0.06, messDepth + 1.4), woodSoffitMat);
  messSoffit.position.set(0, messHeight - 0.01, 0.3);
  messGroup.add(messSoffit);

  // Prominent Glowing Illuminated Mess Sign: "CAMPUS MESS & DINING"
  const signMessTex = createSignTexture({
    title: 'MESS & DINING',
    subtitle: 'CENTRAL STUDENT FOOD COURT',
    bg: '#0f172a',
    border: '#f59e0b',
    text: '#ffffff',
    sub: '#f59e0b',
    width: 512,
    height: 128
  });
  disposables.push(signMessTex);
  const signMessMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.75), new THREE.MeshBasicMaterial({ map: signMessTex, transparent: true }));
  signMessMesh.position.set(0, messHeight + 0.75, messDepth / 2 + 0.6);
  messGroup.add(signMessMesh);

  // --------------------------------------------------------------------------
  // BUILDING 4: BACKGROUND HOSTEL BLOCK C (Adds depth & campus scale)
  // --------------------------------------------------------------------------
  const blockC = new THREE.Group();
  blockC.position.set(2.0, 0, -22.0);
  campusGroup.add(blockC);

  const bCBody = new THREE.Mesh(new THREE.BoxGeometry(22, 10, 6.5), concreteMat);
  bCBody.position.y = 5.0;
  blockC.add(bCBody);

  // Windows across Block C
  for (let f = 1; f <= 3; f++) {
    for (let c = 0; c < 8; c++) {
      const isLitC = (f + c) % 2 === 0;
      const wC = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.0), isLitC ? warmWindowMat : coolWindowMat);
      wC.position.set(-9.5 + c * 2.7, f * 2.5, 3.28);
      blockC.add(wC);
    }
  }

  // ==========================================================================
  // 6. CAMPUS TREES & LIVING VEGETATION
  // ==========================================================================
  function createTree(x, z, scale = 1.0) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, 0, z);
    treeGroup.scale.set(scale, scale, scale);

    // Tree Trunk
    const trunkH = 2.4 * scale;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, trunkH, 8), barkMat);
    trunk.position.y = trunkH / 2;
    treeGroup.add(trunk);

    // Multi-tier layered lush green canopy
    const canopyGroup = new THREE.Group();
    canopyGroup.position.y = trunkH;

    const layers = [
      { r: 1.4, y: 0.2, mat: foliageMats[0] },
      { r: 1.15, y: 0.9, mat: foliageMats[1] },
      { r: 0.85, y: 1.5, mat: foliageMats[2] }
    ];

    layers.forEach(({ r, y, mat }) => {
      const folMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), mat);
      folMesh.position.y = y;
      folMesh.rotation.y = Math.random() * Math.PI;
      canopyGroup.add(folMesh);
    });

    treeGroup.add(canopyGroup);
    campusGroup.add(treeGroup);

    animatedObjects.trees.push({
      group: canopyGroup,
      phase: Math.random() * Math.PI * 2,
      speed: 1.0 + Math.random() * 0.6
    });
  }

  // Natural Tree Placement along Courtyard, Paths, and Buildings
  const treePositions = [
    [-3.8, 4.0, 1.1],
    [-8.8, 5.2, 1.0],
    [-7.2, 11.5, 1.15],
    [3.2, 4.8, 1.05],
    [8.2, 8.5, 1.2],
    [5.0, 11.0, 0.95],
    [-11.5, 9.0, 1.0],
    [13.8, 2.0, 1.1],
    [-16.5, 4.5, 1.2],
    [-1.0, -11.0, 1.4],
    [-7.5, -10.5, 1.3],
    [6.0, -11.5, 1.35],
    [15.0, -9.0, 1.25]
  ];
  treePositions.forEach(([x, z, s]) => createTree(x, z, s));

  // ==========================================================================
  // 7. COURTYARD AMENITIES: BENCHES & CAMPUS LAMP POSTS
  // ==========================================================================
  // Modern Campus Lamp Posts
  const lampGeo = new THREE.CylinderGeometry(0.06, 0.08, 2.8, 8);
  const lampPositions = [
    [-2.4, 3.0],
    [-2.4, 9.5],
    [-2.4, 15.5],
    [1.4, 3.0],
    [1.4, 9.5],
    [1.4, 15.5],
    [-7.0, 2.8],
    [6.5, 1.8]
  ];

  const lampHeadMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a // Warm glowing LED luminaire
  });
  disposables.push(lampHeadMat);

  lampPositions.forEach(([lx, lz]) => {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(lx, 0, lz);

    // Vertical Pole
    const pole = new THREE.Mesh(lampGeo, slateTrimMat);
    pole.position.y = 1.4;
    lampGroup.add(pole);

    // Cantilever Arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.06), slateTrimMat);
    arm.position.set(0.18, 2.75, 0);
    lampGroup.add(arm);

    // Glowing LED Diffuser Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.16), lampHeadMat);
    head.position.set(0.32, 2.7, 0);
    lampGroup.add(head);

    campusGroup.add(lampGroup);
  });

  // Benches along Lawns
  function createBench(bx, bz, rotY = 0) {
    const benchGroup = new THREE.Group();
    benchGroup.position.set(bx, 0, bz);
    benchGroup.rotation.y = rotY;

    // Wood Slat Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.45), woodSoffitMat);
    seat.position.y = 0.42;
    benchGroup.add(seat);

    // Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.06), woodSoffitMat);
    back.position.set(0, 0.65, -0.2);
    benchGroup.add(back);

    // Dark Metal Legs
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.45), slateTrimMat);
    legL.position.set(-0.7, 0.21, 0);
    benchGroup.add(legL);

    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.45), slateTrimMat);
    legR.position.set(0.7, 0.21, 0);
    benchGroup.add(legR);

    campusGroup.add(benchGroup);
  }

  createBench(-2.7, 5.5, Math.PI / 2);
  createBench(-2.7, 12.0, Math.PI / 2);
  createBench(1.8, 6.0, -Math.PI / 2);
  createBench(1.8, 12.5, -Math.PI / 2);

  // Campus Quad Directional Signboard
  const quadSignTex = createSignTexture({
    title: 'CENTRAL CAMPUS QUAD',
    subtitle: '← HOSTEL BLOCK B | BLOCK A ↑ | MESS →',
    bg: '#0f172a',
    border: '#38bdf8',
    text: '#ffffff',
    sub: '#38bdf8',
    width: 512,
    height: 128
  });
  disposables.push(quadSignTex);

  const quadSignGroup = new THREE.Group();
  quadSignGroup.position.set(1.6, 0, 16.5);
  quadSignGroup.rotation.y = -Math.PI / 6;

  const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8), slateTrimMat);
  signPost.position.y = 0.9;
  quadSignGroup.add(signPost);

  const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.45), new THREE.MeshBasicMaterial({ map: quadSignTex, transparent: true }));
  signBoard.position.y = 1.6;
  quadSignGroup.add(signBoard);

  campusGroup.add(quadSignGroup);

  // ==========================================================================
  // 8. ALIVE PARTICLES (Golden Sunset Dust Motes / Ambient Air Specks)
  // ==========================================================================
  const particleCount = 120;
  const pGeo = new THREE.BufferGeometry();
  const pPositions = new Float32Array(particleCount * 3);
  const pSpeeds = [];

  for (let i = 0; i < particleCount; i++) {
    pPositions[i * 3] = (Math.random() - 0.5) * 40;
    pPositions[i * 3 + 1] = 0.5 + Math.random() * 8.0;
    pPositions[i * 3 + 2] = -5 + (Math.random() - 0.5) * 35;
    pSpeeds.push({
      y: 0.003 + Math.random() * 0.006,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.5 + Math.random() * 1.0
    });
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

  const pMat = new THREE.PointsMaterial({
    color: 0xfde047,
    size: 0.12,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending
  });
  disposables.push(pGeo, pMat);

  const dustPoints = new THREE.Points(pGeo, pMat);
  scene.add(dustPoints);
  animatedObjects.dustParticles = { points: dustPoints, speeds: pSpeeds, positions: pPositions };

  // ==========================================================================
  // 9. ANIMATION RUNTIME UPDATE & RESOURCE DISPOSAL
  // ==========================================================================
  return {
    campusGroup,
    animatedObjects,
    update(time) {
      // A. Trees swaying gently in breeze
      animatedObjects.trees.forEach(({ group, phase, speed }) => {
        group.rotation.z = Math.sin(time * speed + phase) * 0.035;
        group.rotation.x = Math.cos(time * speed * 0.8 + phase) * 0.025;
      });

      // B. Subtle breathing glow in dorm room windows (alive campus feel)
      animatedObjects.windows.forEach((wMat, idx) => {
        wMat.emissiveIntensity = 1.35 + Math.sin(time * 1.5 + idx * 0.8) * 0.25;
      });

      // C. Floating golden sunset dust particles
      if (animatedObjects.dustParticles) {
        const { points, speeds, positions } = animatedObjects.dustParticles;
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] += speeds[i].y;
          positions[i * 3] += Math.sin(time * speeds[i].wobbleSpeed + speeds[i].wobble) * 0.003;
          if (positions[i * 3 + 1] > 9.0) {
            positions[i * 3 + 1] = 0.6;
          }
        }
        points.geometry.attributes.position.needsUpdate = true;
      }
    },
    dispose() {
      disposables.forEach((res) => {
        if (res && res.dispose) res.dispose();
      });
      if (dustPoints && dustPoints.geometry) dustPoints.geometry.dispose();
    }
  };
}
