// Three.js variables
let scene, camera, renderer;
let letterGroup, frontPage;
let autoRotate = false;
let mouseX = 0,
  mouseY = 0;

// Mouse controls
let isMouseDown = false;
let mouseXOnMouseDown = 0;
let mouseYOnMouseDown = 0;
let targetRotationX = 0;
let targetRotationY = 0;
let targetRotationOnMouseDownX = 0;
let targetRotationOnMouseDownY = 0;

function isMobileDevice() {
  return window.innerWidth <= 768;
}

// Touch controls for pinch zoom
let lastTouchDistance = 0;
let initialZoom = isMobileDevice() ? 8 : 7;
let targetZoom = initialZoom;
let isPinching = false;
let lastTouchCenter = { x: 0, y: 0 };

const themeColor = "#923840";
const textColor = "#111111";

// Cache for THREE fonts parsed from typeface JSON files
let mightyThreeFont = null;
let bohemeThreeFont = null;

function init() {
  // Scene setup
  scene = new THREE.Scene();
  // scene.background = new THREE.Color(0x1a1a2e);

  // Camera setup
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, initialZoom);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // renderer.setClearColor(0x0f0f23, 1);
  document.getElementById("canvas-container").appendChild(renderer.domElement);

  // Lighting
  setupLighting();

  // Create the invitation letter
  createInvitationLetter();

  // Event listeners
  setupEventListeners();
}

function setupLighting() {
  // Balanced ambient light for good base illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Main directional light - positioned for better coverage
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  scene.add(directionalLight);

  // Secondary directional light from opposite side to fill shadows
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
  fillLight.position.set(-5, 5, -5);
  scene.add(fillLight);

  // Additional fill lights from different angles - reduced intensity
  const sideLight1 = new THREE.DirectionalLight(0xffffff, 0.25);
  sideLight1.position.set(10, 0, 0);
  scene.add(sideLight1);

  const sideLight2 = new THREE.DirectionalLight(0xffffff, 0.25);
  sideLight2.position.set(-10, 0, 0);
  scene.add(sideLight2);

  // Top light for even illumination from above - minimal intensity
  const topLight = new THREE.DirectionalLight(0xffffff, 0.15);
  topLight.position.set(0, 15, 0);
  scene.add(topLight);

  // Subtle accent lights with very low intensity
  const accentLight1 = new THREE.PointLight(0xfff5f5, 0.2);
  accentLight1.position.set(-3, 3, 2);
  scene.add(accentLight1);

  const accentLight2 = new THREE.PointLight(0xf0f8ff, 0.2);
  accentLight2.position.set(3, -2, 3);
  scene.add(accentLight2);
}

function createTexturesWithImages(letterGeometry) {
  const letterWidth = 4;
  const letterHeight = 6;
  const letterDepth = 0.05;

  // Create the main letter body with solid color (no textures)
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: themeColor });
  frontPage = new THREE.Mesh(letterGeometry, bodyMaterial);
  frontPage.castShadow = true;
  frontPage.receiveShadow = true;
  letterGroup.add(frontPage);

  // Create rounded white background planes that match the ExtrudeGeometry shape
  const roundedPlaneGeometry = createRoundedPlaneGeometry(
    letterWidth - 0.08,
    letterHeight - 0.08,
    0.3
  );
  const whiteMaterial = new THREE.MeshLambertMaterial({ color: "#ffffff" });

  // Front white background plane
  const frontBackground = new THREE.Mesh(roundedPlaneGeometry, whiteMaterial);
  frontBackground.position.z = letterDepth / 2 + 0.005; // Slightly in front of main body
  frontBackground.castShadow = false;
  frontBackground.receiveShadow = true;
  letterGroup.add(frontBackground);

  // Back white background plane
  const backBackground = new THREE.Mesh(roundedPlaneGeometry, whiteMaterial);
  backBackground.position.z = -letterDepth / 2 - 0.005; // Slightly behind main body
  backBackground.rotation.y = Math.PI; // Flip to face the back
  backBackground.castShadow = false;
  backBackground.receiveShadow = true;
  letterGroup.add(backBackground);

  // Add shadow-receiving planes slightly behind the white backgrounds for better shadow visibility
  const shadowMaterial = new THREE.MeshLambertMaterial({
    color: "#f8f8f8",
    transparent: true,
    opacity: 0.3,
  });

  // Front shadow plane
  const frontShadowPlane = new THREE.Mesh(roundedPlaneGeometry, shadowMaterial);
  frontShadowPlane.position.z = letterDepth / 2 + 0.002; // Between main body and white background
  frontShadowPlane.castShadow = false;
  frontShadowPlane.receiveShadow = true;
  letterGroup.add(frontShadowPlane);

  // Back shadow plane
  const backShadowPlane = new THREE.Mesh(roundedPlaneGeometry, shadowMaterial);
  backShadowPlane.position.z = -letterDepth / 2 - 0.002; // Between main body and white background
  backShadowPlane.rotation.y = Math.PI; // Flip to face the back
  backShadowPlane.castShadow = false;
  backShadowPlane.receiveShadow = true;
  letterGroup.add(backShadowPlane);

  // Add all 3D text and images
  addAll3DContent();
}

// Function to add all 3D content (text and images)
function addAll3DContent() {
  if (!letterGroup) return;

  const letterWidth = 4;
  const letterHeight = 6;
  const letterDepth = 0.05;

  const toWorldY = (canvasY) => (0.5 - canvasY / 768) * letterHeight;
  const toWorldX = (canvasX) => (canvasX / 512 - 0.5) * letterWidth;

  const frontZ = letterDepth / 2 + 0.01; // On top of white background
  const backZ = -letterDepth / 2 - 0.01; // On top of white background

  const createTextMesh = (text, size, canvasX, canvasY, z, rotationY = 0) => {
    const geometry = new THREE.TextGeometry(text, {
      font: mightyThreeFont,
      size: size,
      height: 0.02,
      curveSegments: 8,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.002,
      bevelSegments: 2,
    });
    geometry.computeBoundingBox();
    geometry.center();

    const material = new THREE.MeshPhongMaterial({
      color: textColor,
      shininess: 30,
      specular: 0x222222,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(toWorldX(canvasX), toWorldY(canvasY), z);
    mesh.rotation.y = rotationY;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    return mesh;
  };

  const createBohemeTextMesh = (
    text,
    size,
    canvasX,
    canvasY,
    z,
    rotationY = 0
  ) => {
    const geometry = new THREE.TextGeometry(text, {
      font: bohemeThreeFont,
      size: size,
      height: 0.03,
      curveSegments: 8,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.004,
      bevelSegments: 2,
    });
    geometry.computeBoundingBox();
    geometry.center();

    const material = new THREE.MeshPhongMaterial({
      color: themeColor,
      shininess: 30,
      specular: 0x222222,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(toWorldX(canvasX), toWorldY(canvasY), z);
    mesh.rotation.y = rotationY;
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    return mesh;
  };

  const createImageMesh = (
    imageSrc,
    width,
    height,
    canvasX,
    canvasY,
    z,
    rotationY = 0
  ) => {
    const texture = new THREE.TextureLoader().load(imageSrc);
    const geometry = new THREE.PlaneGeometry(width / 100, height / 100);
    const material = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(toWorldX(canvasX), toWorldY(canvasY), z);
    mesh.rotation.y = rotationY;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    return mesh;
  };

  const createHeartMesh = (canvasX, canvasY, z) => {
    // Create heart shape using THREE.Shape
    const heartShape = new THREE.Shape();

    // Heart shape path - using proven heart shape code
    const x = 0,
      y = 0;
    const scale = 0.002; // Scale down the heart to fit under calendar

    heartShape
      .moveTo(x + 25 * scale, y + 25 * scale)
      .bezierCurveTo(x + 25 * scale, y + 25 * scale, x + 20 * scale, y, x, y)
      .bezierCurveTo(
        x - 30 * scale,
        y,
        x - 30 * scale,
        y + 35 * scale,
        x - 30 * scale,
        y + 35 * scale
      )
      .bezierCurveTo(
        x - 30 * scale,
        y + 55 * scale,
        x - 10 * scale,
        y + 77 * scale,
        x + 25 * scale,
        y + 95 * scale
      )
      .bezierCurveTo(
        x + 60 * scale,
        y + 77 * scale,
        x + 80 * scale,
        y + 55 * scale,
        x + 80 * scale,
        y + 35 * scale
      )
      .bezierCurveTo(
        x + 80 * scale,
        y + 35 * scale,
        x + 80 * scale,
        y,
        x + 50 * scale,
        y
      )
      .bezierCurveTo(
        x + 35 * scale,
        y,
        x + 25 * scale,
        y + 25 * scale,
        x + 25 * scale,
        y + 25 * scale
      );

    // Create extrude settings for the heart
    const extrudeSettings = {
      depth: 0.03, // Small depth for the heart
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.005,
      bevelOffset: 0,
      bevelSegments: 3,
    };

    const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    const material = new THREE.MeshLambertMaterial({
      color: themeColor,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(toWorldX(canvasX), toWorldY(canvasY), z);
    mesh.rotation.z = Math.PI;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    return mesh;
  };

  const placeAllContent = () => {
    // Front face content
    const smallTextSize = (11 / 768) * 6;
    const mediumTextSize = (13 / 768) * 6;
    const largeTextSize = (15 / 768) * 6;
    const extraLargeTextSize = (50 / 768) * 6;

    // Front - Left side (Nhà gái)
    letterGroup.add(createTextMesh("NHÀ GÁI", mediumTextSize, 130, 60, frontZ));
    letterGroup.add(
      createTextMesh("ÔNG NGUYỄN TRỌNG BẰNG", smallTextSize, 130, 90, frontZ)
    );
    letterGroup.add(
      createTextMesh("BÀ NGUYỄN THỊ HOA", smallTextSize, 130, 120, frontZ)
    );
    letterGroup.add(
      createTextMesh("HIỂN KHÁNH, NINH BÌNH", smallTextSize, 130, 150, frontZ)
    );

    // Front - Right side (Nhà trai)
    letterGroup.add(
      createTextMesh("NHÀ TRAI", mediumTextSize, 382, 60, frontZ)
    );
    letterGroup.add(
      createTextMesh("ÔNG HÀ VĂN LONG", smallTextSize, 382, 90, frontZ)
    );
    letterGroup.add(
      createTextMesh("BÀ DƯƠNG THỊ KHÁNH", smallTextSize, 382, 120, frontZ)
    );
    letterGroup.add(
      createTextMesh("KINH BẮC, BẮC NINH", smallTextSize, 382, 150, frontZ)
    );

    // Front - Center content
    // Add 3D line divider above center content
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.5, toWorldY(180), frontZ),
      new THREE.Vector3(1.5, toWorldY(180), frontZ),
    ]);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: textColor,
      linewidth: 2,
    });
    const dividerLine = new THREE.Line(lineGeometry, lineMaterial);
    letterGroup.add(dividerLine);

    letterGroup.add(
      createTextMesh("TRÂN TRỌNG BÁO TIN", mediumTextSize, 256, 215, frontZ)
    );
    letterGroup.add(
      createTextMesh(
        "LỄ THÀNH HÔN CỦA CON CHÚNG TÔI",
        mediumTextSize,
        256,
        245,
        frontZ
      )
    );
    letterGroup.add(
      createBohemeTextMesh("and", extraLargeTextSize, 256, 350, frontZ)
    );

    // Front - Names (already handled by addNames3D)
    addNames3D();

    // Front - Bottom content
    letterGroup.add(
      createTextMesh(
        "HÔN LỄ ĐƯỢC CỬ HÀNH TẠI TƯ GIA",
        largeTextSize,
        256,
        570,
        frontZ
      )
    );
    letterGroup.add(
      createTextMesh(
        "Xóm Nhì, xã Hiển Khánh, tỉnh Ninh Bình",
        mediumTextSize,
        256,
        600,
        frontZ
      )
    );
    letterGroup.add(
      createTextMesh("VÀO LÚC 6:00 - THỨ BẢY", largeTextSize, 256, 635, frontZ)
    );
    letterGroup.add(
      createTextMesh(
        "NGÀY 01 THÁNG 11 NĂM 2025",
        largeTextSize,
        256,
        665,
        frontZ
      )
    );
    letterGroup.add(
      createTextMesh(
        "Tức ngày 12 tháng 09 năm Ất Tỵ",
        mediumTextSize,
        256,
        695,
        frontZ
      )
    );

    // Front - Flower image
    const flowerMesh = createImageMesh(
      "assets/hoa1.webp",
      150,
      150,
      256,
      490,
      frontZ
    );
    flowerMesh.rotation.z = Math.PI / 3; // 60 degrees rotation
    flowerMesh.material.opacity = 0.7; // Set opacity to 0.7
    flowerMesh.material.transparent = true; // Enable transparency
    letterGroup.add(flowerMesh);

    // White text on themed box
    const createWhiteTextMesh = (
      text,
      size,
      canvasX,
      canvasY,
      z,
      rotationY = 0
    ) => {
      const geometry = new THREE.TextGeometry(text, {
        font: mightyThreeFont,
        size: size,
        height: 0.02,
        curveSegments: 8,
        bevelEnabled: true,
        bevelThickness: 0.005,
        bevelSize: 0.002,
        bevelSegments: 2,
      });
      geometry.computeBoundingBox();
      geometry.center();

      const material = new THREE.MeshPhongMaterial({
        color: "#ffffff",
        shininess: 30,
        specular: 0x222222,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(toWorldX(canvasX), toWorldY(canvasY), z);
      mesh.rotation.y = rotationY;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      return mesh;
    };

    letterGroup.add(
      createTextMesh(
        "THÁNG 11 - NĂM 2025",
        mediumTextSize,
        256,
        105,
        backZ,
        Math.PI
      )
    );
    letterGroup.add(
      createTextMesh(
        "TRÂN TRỌNG KÍNH MỜI",
        mediumTextSize,
        256,
        330,
        backZ,
        Math.PI
      )
    );
    const backLineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.5, toWorldY(355), backZ),
      new THREE.Vector3(1.5, toWorldY(355), backZ),
    ]);
    const backLineMaterial = new THREE.LineBasicMaterial({
      color: textColor,
      linewidth: 2,
    });
    const backDividerLine = new THREE.Line(backLineGeometry, backLineMaterial);
    letterGroup.add(backDividerLine);
    letterGroup.add(
      createTextMesh(
        "Đến dự buổi tiệc chung vui cùng gia đình chúng tôi tại",
        smallTextSize,
        256,
        380,
        backZ,
        Math.PI
      )
    );

    letterGroup.add(
      createTextMesh(
        "Xóm Nhì, xã Hiển Khánh, tỉnh Ninh Bình",
        smallTextSize,
        256,
        505,
        backZ,
        Math.PI
      )
    );
    letterGroup.add(
      createTextMesh(
        "VÀO LÚC 17 GIỜ 30 - NGÀY 31.10.2025",
        mediumTextSize,
        256,
        540,
        backZ,
        Math.PI
      )
    );
    letterGroup.add(
      createTextMesh(
        "Tức ngày 11 tháng 09 năm Ất Tỵ",
        smallTextSize,
        256,
        570,
        backZ,
        Math.PI
      )
    );
    letterGroup.add(
      createTextMesh(
        "Trân trọng cảm ơn sự hiện diện của Quý Khách!",
        smallTextSize,
        256,
        610,
        backZ,
        Math.PI
      )
    );
    letterGroup.add(
      createTextMesh("Đón khách 17:30", smallTextSize, 356, 715, backZ, Math.PI)
    );

    letterGroup.add(
      createTextMesh("Khai tiệc 17:30", smallTextSize, 156, 715, backZ, Math.PI)
    );

    // Back face content

    // Back - Header date with themed box background (positioned under calendar days)
    const headerBoxGeometry = new THREE.BoxGeometry(3.2, 0.27, 0.01);
    const headerBoxMaterial = new THREE.MeshLambertMaterial({
      color: themeColor,
    });
    const headerBox = new THREE.Mesh(headerBoxGeometry, headerBoxMaterial);
    headerBox.position.set(0, toWorldY(150), backZ + 0.005); // Positioned under the calendar days
    headerBox.rotation.y = Math.PI;
    letterGroup.add(headerBox);

    // Back - Calendar days (positioned above the box, right to left for back side)
    const days = ["CN", "T.7", "T.6", "T.5", "T.4", "T.3", "T.2"];
    const textSpacing = (512 - 140) / 7;
    days.forEach((day, index) => {
      const textX = 70 + (index + 0.5) * textSpacing;
      letterGroup.add(
        createWhiteTextMesh(
          day,
          mediumTextSize,
          textX,
          150,
          backZ - 0.01,
          Math.PI
        )
      );
    });

    // Back - Calendar numbers (right to left order for back side)
    let number = 1;
    const numberY = 180;
    for (let row = 0; row < 5; row++) {
      for (let col = 6; col >= 0; col--) {
        // Reverse column order (right to left)
        if (number <= 35) {
          if (row === 0 && col > 1) continue; // Skip empty cells at start of first row
          const numberX = 70 + (col + 0.5) * textSpacing;
          const currentY = numberY + row * 28;

          if (number === 1) {
            // Special styling for number 1 - add heart shape here
            letterGroup.add(
              createWhiteTextMesh(
                number.toString(),
                smallTextSize,
                numberX,
                currentY,
                backZ,
                Math.PI
              )
            );
            // Add heart shape under day 1 to make it special
            letterGroup.add(
              createHeartMesh(
                numberX + 6,
                currentY - 10,
                backZ + 0.005,
                Math.PI
              )
            );
          } else {
            letterGroup.add(
              createTextMesh(
                number.toString(),
                smallTextSize,
                numberX,
                currentY,
                backZ,
                Math.PI
              )
            );
          }
          number++;
        }
      }
    }

    // Back - Images
    letterGroup.add(
      createImageMesh("assets/QA.png", 130, 130, 256, 45, backZ, Math.PI)
    );
    letterGroup.add(
      createImageMesh("assets/item3.png", 45, 45, 156, 665, backZ, Math.PI)
    );

    letterGroup.add(
      createImageMesh("assets/item1.png", 45, 45, 356, 665, backZ, Math.PI)
    );

    // Add back venue text
    addBackVenue3D();
  };

  if (mightyThreeFont && bohemeThreeFont) {
    placeAllContent();
    return;
  }

  const loader = new THREE.FontLoader();
  let fontsLoaded = 0;
  const totalFonts = 2;

  const checkAllFontsLoaded = () => {
    fontsLoaded++;
    if (fontsLoaded === totalFonts) {
      placeAllContent();
    }
  };

  // Load MightyWings font
  loader.load(
    "assets/MightyWings.json",
    (font) => {
      mightyThreeFont = font;
      checkAllFontsLoaded();
    },
    undefined,
    (err) => {
      console.error("Failed to load MightyWings.json for 3D text:", err);
      checkAllFontsLoaded();
    }
  );

  // Load BohemeFloral font
  loader.load(
    "assets/BohemeFloral.json",
    (font) => {
      bohemeThreeFont = font;
      checkAllFontsLoaded();
    },
    undefined,
    (err) => {
      console.error("Failed to load BohemeFloral.json for 3D text:", err);
      checkAllFontsLoaded();
    }
  );
}

// Function to create rounded plane geometry
function createRoundedPlaneGeometry(width, height, radius) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Create rounded rectangle shape
  const shape = new THREE.Shape();

  // Start from bottom-left corner
  shape.moveTo(-halfWidth + radius, -halfHeight);

  // Bottom edge
  shape.lineTo(halfWidth - radius, -halfHeight);

  // Bottom-right corner
  shape.quadraticCurveTo(
    halfWidth,
    -halfHeight,
    halfWidth,
    -halfHeight + radius
  );

  // Right edge
  shape.lineTo(halfWidth, halfHeight - radius);

  // Top-right corner
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - radius, halfHeight);

  // Top edge
  shape.lineTo(-halfWidth + radius, halfHeight);

  // Top-left corner
  shape.quadraticCurveTo(
    -halfWidth,
    halfHeight,
    -halfWidth,
    halfHeight - radius
  );

  // Left edge
  shape.lineTo(-halfWidth, -halfHeight + radius);

  // Bottom-left corner
  shape.quadraticCurveTo(
    -halfWidth,
    -halfHeight,
    -halfWidth + radius,
    -halfHeight
  );

  // Create plane geometry from shape
  const geometry = new THREE.ShapeGeometry(shape);

  return geometry;
}

// Function to create rounded rectangle geometry using ExtrudeGeometry
function createRoundedBoxGeometry(width, height, depth, radius) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const halfDepth = depth / 2;

  // Create rounded rectangle shape
  const shape = new THREE.Shape();

  // Start from bottom-left corner
  shape.moveTo(-halfWidth + radius, -halfHeight);

  // Bottom edge
  shape.lineTo(halfWidth - radius, -halfHeight);

  // Bottom-right corner
  shape.quadraticCurveTo(
    halfWidth,
    -halfHeight,
    halfWidth,
    -halfHeight + radius
  );

  // Right edge
  shape.lineTo(halfWidth, halfHeight - radius);

  // Top-right corner
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - radius, halfHeight);

  // Top edge
  shape.lineTo(-halfWidth + radius, halfHeight);

  // Top-left corner
  shape.quadraticCurveTo(
    -halfWidth,
    halfHeight,
    -halfWidth,
    halfHeight - radius
  );

  // Left edge
  shape.lineTo(-halfWidth, -halfHeight + radius);

  // Bottom-left corner
  shape.quadraticCurveTo(
    -halfWidth,
    -halfHeight,
    -halfWidth + radius,
    -halfHeight
  );

  // Extrude the shape
  const extrudeSettings = {
    depth: depth,
    bevelEnabled: false,
  };

  const extrudeGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // Center the geometry
  extrudeGeometry.translate(0, 0, -halfDepth);

  return extrudeGeometry;
}

function createInvitationLetter() {
  letterGroup = new THREE.Group();

  const letterWidth = 4;
  const letterHeight = 6;
  const letterDepth = 0.05;
  const cornerRadius = 0.3;

  // Use ExtrudeGeometry for rounded corners
  const letterGeometry = createRoundedBoxGeometry(
    letterWidth,
    letterHeight,
    letterDepth,
    cornerRadius
  );

  createTexturesWithImages(letterGeometry);

  scene.add(letterGroup);
}

function addNames3D() {
  if (!letterGroup) return;

  const letterWidth = 4;
  const letterHeight = 6;
  const letterDepth = 0.05;

  const toWorldY = (canvasY) => (0.5 - canvasY / 768) * letterHeight;
  const toWorldX = (canvasX) => (canvasX / 512 - 0.5) * letterWidth;

  const z = letterDepth / 2 + 0.01;

  const createTextMesh = (text, size, canvasX, canvasY) => {
    const geometry = new THREE.TextGeometry(text, {
      font: mightyThreeFont,
      size: size,
      height: 0.03,
      curveSegments: 8,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.004,
      bevelSegments: 3,
    });
    geometry.computeBoundingBox();
    geometry.center();

    const material = new THREE.MeshPhongMaterial({ color: themeColor });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(toWorldX(canvasX), toWorldY(canvasY), z);
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    return mesh;
  };

  const placeTexts = () => {
    // Map canvas font sizes to world units: size ≈ (px/768) * 6
    const sizeText = (32 / 768) * 6; // ≈ 0.3125

    const name1 = createTextMesh("NGUYỄN THỊ MỸ AN", sizeText, 256, 300);
    const name2 = createTextMesh("HÀ PHÚ QUÝ", sizeText, 256, 410);

    letterGroup.add(name1);
    letterGroup.add(name2);
  };

  if (mightyThreeFont) {
    placeTexts();
    // Ensure back venue text is also added if font is ready
    addBackVenue3D();
    return;
  }

  const loader = new THREE.FontLoader();
  loader.load(
    "assets/MightyWings.json",
    (font) => {
      mightyThreeFont = font;
      placeTexts();
      addBackVenue3D();
    },
    undefined,
    (err) => {
      console.error(
        "Failed to load MightyWings.json for 3D text. Please add it under assets/",
        err
      );
    }
  );
}

function addBackVenue3D() {
  if (!letterGroup || !mightyThreeFont) return;

  const letterWidth = 4;
  const letterHeight = 6;
  const letterDepth = 0.05;

  const toWorldY = (canvasY) => (0.5 - canvasY / 768) * letterHeight;
  const toWorldX = (canvasX) => (canvasX / 512 - 0.5) * letterWidth;

  const z = -letterDepth / 2 - 0.01; // slightly behind back face (negative z)

  const sizeText = (32 / 768) * 6;

  const geometry = new THREE.TextGeometry("TƯ GIA NHÀ GÁI", {
    font: mightyThreeFont,
    size: sizeText,
    height: 0.03,
    curveSegments: 8,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.004,
    bevelSegments: 3,
  });
  geometry.computeBoundingBox();
  geometry.center();

  const material = new THREE.MeshPhongMaterial({ color: themeColor });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(toWorldX(256), toWorldY(440), z);
  mesh.rotation.y = Math.PI; // face back side
  mesh.castShadow = true;
  mesh.receiveShadow = false;

  letterGroup.add(mesh);
}

function setupEventListeners() {
  // Mouse events
  renderer.domElement.addEventListener("mousedown", onMouseDown, false);
  renderer.domElement.addEventListener("mousemove", onMouseMove, false);
  renderer.domElement.addEventListener("mouseup", onMouseUp, false);
  renderer.domElement.addEventListener("wheel", onMouseWheel, false);

  // Touch events
  renderer.domElement.addEventListener("touchstart", onTouchStart, false);
  renderer.domElement.addEventListener("touchmove", onTouchMove, false);
  renderer.domElement.addEventListener("touchend", onTouchEnd, false);

  // Resize
  window.addEventListener("resize", onWindowResize, false);
}

function onMouseDown(event) {
  event.preventDefault();
  isMouseDown = true;
  mouseXOnMouseDown = event.clientX - window.innerWidth / 2;
  mouseYOnMouseDown = event.clientY - window.innerHeight / 2;
  targetRotationOnMouseDownX = targetRotationX;
  targetRotationOnMouseDownY = targetRotationY;
}

function onMouseMove(event) {
  mouseX = event.clientX - window.innerWidth / 2;
  mouseY = event.clientY - window.innerHeight / 2;

  if (isMouseDown) {
    targetRotationY =
      targetRotationOnMouseDownY + (mouseX - mouseXOnMouseDown) * 0.02;
    targetRotationX =
      targetRotationOnMouseDownX + (mouseY - mouseYOnMouseDown) * 0.02;
  }
}

function onMouseUp(event) {
  isMouseDown = false;
}

function onMouseWheel(event) {
  targetZoom += event.deltaY * 0.01;
  targetZoom = Math.max(3, Math.min(15, targetZoom));
}

// Helper functions for touch gestures
function getTouchDistance(touches) {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchCenter(touches) {
  if (touches.length < 2) return { x: 0, y: 0 };
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

function onTouchStart(event) {
  if (event.touches.length === 1) {
    const touch = event.touches[0];
    onMouseDown({
      preventDefault: () => {},
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
  } else if (event.touches.length === 2) {
    // Start pinch gesture
    isPinching = true;
    lastTouchDistance = getTouchDistance(event.touches);
    lastTouchCenter = getTouchCenter(event.touches);
    event.preventDefault();
  }
}

function onTouchMove(event) {
  if (event.touches.length === 1 && !isPinching) {
    const touch = event.touches[0];
    onMouseMove({
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
  } else if (event.touches.length === 2 && isPinching) {
    // Handle pinch zoom
    const currentDistance = getTouchDistance(event.touches);
    if (lastTouchDistance > 0) {
      const scale = currentDistance / lastTouchDistance;
      targetZoom = Math.max(3, Math.min(15, targetZoom / scale));
    }
    lastTouchDistance = currentDistance;
    event.preventDefault();
  }
}

function onTouchEnd(event) {
  if (event.touches.length < 2) {
    isPinching = false;
    lastTouchDistance = 0;
  }
  if (event.touches.length === 0) {
    onMouseUp(event);
  }
}

// Performance optimization: detect device capabilities and adjust settings
let cachedPixelRatio = null;

function getOptimalPixelRatio() {
  // Return cached value if already calculated
  if (cachedPixelRatio !== null) {
    return cachedPixelRatio;
  }

  const devicePixelRatio = window.devicePixelRatio;
  const isMobile = isMobileDevice();

  // For mobile devices, be more conservative with pixel ratio
  if (isMobile) {
    cachedPixelRatio = Math.min(devicePixelRatio, 1.2);
    return cachedPixelRatio;
  }

  // For desktop, allow higher pixel ratio but cap it for performance
  // Check if device has sufficient GPU memory by testing canvas performance
  const testCanvas = document.createElement("canvas");
  const testCtx = testCanvas.getContext("2d");
  testCanvas.width = 1000;
  testCanvas.height = 1000;

  const startTime = performance.now();
  testCtx.fillRect(0, 0, 1000, 1000);
  const endTime = performance.now();

  // If basic canvas operations are slow, reduce pixel ratio
  if (endTime - startTime > 1) {
    cachedPixelRatio = Math.min(devicePixelRatio, 1.2);
  } else {
    cachedPixelRatio = Math.min(devicePixelRatio, 2);
  }

  return cachedPixelRatio;
}

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const pixelRatio = getOptimalPixelRatio(); // e.g., Math.min(window.devicePixelRatio, 2)

  const width = Math.floor(canvas.clientWidth * pixelRatio);
  const height = Math.floor(canvas.clientHeight * pixelRatio);
  const needResize = canvas.width !== width || canvas.height !== height;

  if (needResize) {
    console.log("resize renderer to display size");
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
  }
  return needResize;
}

function animate() {
  requestAnimationFrame(animate);

  if (letterGroup) {
    // Smooth rotation
    letterGroup.rotation.y += (targetRotationY - letterGroup.rotation.y) * 0.05;
    letterGroup.rotation.x += (targetRotationX - letterGroup.rotation.x) * 0.05;

    // Auto rotate if enabled
    if (autoRotate) {
      targetRotationY += 0.01;
    }
  }

  // Smooth zoom
  camera.position.z += (targetZoom - camera.position.z) * 0.1;

  renderer.render(scene, camera);
}

// Control functions
function setView(view) {
  targetRotationX = 0;
  targetRotationY = 0;

  const baseZoom = isMobileDevice() ? 8 : 7;

  switch (view) {
    case "front":
      camera.position.set(0, 0, baseZoom);
      targetZoom = baseZoom;
      targetRotationY = 0;
      break;
    case "back":
      camera.position.set(0, 0, baseZoom);
      targetZoom = baseZoom;
      targetRotationY = Math.PI;
      break;
    case "top":
      camera.position.set(0, 10, 2);
      targetZoom = 2;
      targetRotationX = -Math.PI / 3;
      break;
    case "perspective":
      camera.position.set(5, 3, baseZoom);
      targetZoom = baseZoom;
      targetRotationY = Math.PI / 6;
      targetRotationX = Math.PI / 12;
      break;
  }
}

function onWindowResize() {
  // Update camera aspect ratio
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Update renderer size to match window dimensions
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Handle renderer resize with pixel ratio optimization
  resizeRendererToDisplaySize(renderer);

  // Update zoom values based on new screen size
  const newBaseZoom = isMobileDevice() ? 8 : 7;
  if (Math.abs(targetZoom - newBaseZoom) > 1) {
    targetZoom = newBaseZoom;
  }
}

const mightyFont = new FontFace("MightyWings", "url(assets/MightyWings.otf)");

Promise.all([
  mightyFont.load().then(function (font) {
    document.fonts.add(font);
  }),
])
  .then(() => {
    init();
    animate();
    // Initialize RSVP button visibility
    updateRSVPButtonVisibility();
  })
  .catch((error) => {
    console.log("Font loading failed:", error);
    // Fallback if font loading fails
    init();
    animate();
    // Initialize RSVP button visibility
    updateRSVPButtonVisibility();
  });

const qrButton = document.getElementById("qrButton");
const mapButton = document.getElementById("mapButton");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalClose = document.getElementById("modalClose");
const qrModalContent = document.getElementById("qrModalContent");
const mapModalContent = document.getElementById("mapModalContent");

// RSVP Modal elements
const rsvpModalBackdrop = document.getElementById("rsvpModalBackdrop");
const rsvpModalClose = document.getElementById("rsvpModalClose");
const rsvpForm = document.getElementById("rsvpForm");
const rsvpBtn = document.getElementById("rsvp-btn");

// Gallery Modal elements
const galleryModalBackdrop = document.getElementById("galleryModalBackdrop");
const galleryModalClose = document.getElementById("galleryModalClose");
const galleryBtn = document.getElementById("open-gallery-btn");

// Music control elements
const musicBtn = document.getElementById("music-btn");
const musicIcon = document.getElementById("music-icon");
const backgroundMusic = document.getElementById("backgroundMusic");
let isMusicMuted = false;

function openModal(type) {
  if (type === "qr") {
    qrModalContent.style.display = "block";
    mapModalContent.style.display = "none";
  } else if (type === "map") {
    mapModalContent.style.display = "block";
    qrModalContent.style.display = "none";
  }
  modalBackdrop.classList.add("active");
}

function closeModal() {
  modalBackdrop.classList.remove("active");
}

qrButton.addEventListener("click", () => openModal("qr"));
mapButton.addEventListener("click", () => openModal("map"));
modalClose.addEventListener("click", closeModal);

modalBackdrop.addEventListener("click", (event) => {
  if (event.target === modalBackdrop) {
    closeModal();
  }
});

function openRSVPModal() {
  rsvpModalBackdrop.classList.add("active");
}

function closeRSVPModal() {
  rsvpModalBackdrop.classList.remove("active");
}

function hasSubmittedRSVP() {
  return localStorage.getItem("rsvpSubmitted") === "true";
}

function markRSVPSubmitted() {
  localStorage.setItem("rsvpSubmitted", "true");
}

function scheduleRSVPModal() {
  if (!hasSubmittedRSVP()) {
    setTimeout(() => {
      openRSVPModal();
    }, 30000); // 30 seconds
  }
}

function updateRSVPButtonVisibility() {
  if (hasSubmittedRSVP()) {
    rsvpBtn.style.display = "none";
  } else {
    rsvpBtn.style.display = "flex";
  }
}

async function submitToGoogleSheets(formData) {
  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyV5CCMHp_YNRKvGKJaDKD6e-K7fv3KXeA_ZpTrR-okDbofFicaqEgbdBtGq5CeP09Q/exec";

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    // Since we're using no-cors mode, we can't read the response
    // But we assume it was successful if no error was thrown
    return true;
  } catch (error) {
    console.error("Error submitting to Google Sheets:", error);
    return false;
  }
}

// Handle RSVP form submission
rsvpForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = rsvpForm.querySelector(".submit-btn");
  const originalText = submitBtn.textContent;

  // Disable button and show loading
  submitBtn.disabled = true;
  submitBtn.textContent = "Đang gửi...";

  // Get form data
  const formData = {
    name: document.getElementById("guestName").value,
    attendance: document.querySelector('input[name="attendance"]:checked')
      .value,
    wishes: document.getElementById("wishes").value || "",
    timestamp: new Date().toISOString(),
  };

  try {
    const success = await submitToGoogleSheets(formData);

    if (success) {
      markRSVPSubmitted();
      updateRSVPButtonVisibility(); // Hide the RSVP button
      closeRSVPModal();
    } else {
      throw new Error("Failed to submit");
    }
  } catch (error) {
    alert("Có lỗi xảy ra khi gửi phản hồi. Vui lòng thử lại sau.");
    console.error("Submission error:", error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

rsvpModalClose.addEventListener("click", closeRSVPModal);
rsvpModalBackdrop.addEventListener("click", (event) => {
  if (event.target === rsvpModalBackdrop) {
    closeRSVPModal();
  }
});

// RSVP button click event
rsvpBtn.addEventListener("click", openRSVPModal);

// Gallery Modal functions
function openGalleryModal() {
  galleryModalBackdrop.classList.add("active");
}

function closeGalleryModal() {
  galleryModalBackdrop.classList.remove("active");
}

// Gallery button click event
galleryBtn.addEventListener("click", openGalleryModal);

// Gallery modal close events
galleryModalClose.addEventListener("click", closeGalleryModal);
galleryModalBackdrop.addEventListener("click", (event) => {
  if (event.target === galleryModalBackdrop) {
    closeGalleryModal();
  }
});

// Music control functions
function toggleMusic() {
  if (!backgroundMusic) return;

  if (isMusicMuted) {
    // Unmute music
    backgroundMusic.volume = 0.5;
    isMusicMuted = false;
    updateMusicIcon(false);
  } else {
    // Mute music
    backgroundMusic.volume = 0;
    isMusicMuted = true;
    updateMusicIcon(true);
  }
}

function updateMusicIcon(muted) {
  if (!musicIcon) return;

  if (muted) {
    // Show muted icon (speaker with X)
    musicIcon.innerHTML = `
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
      <path d="M2 2l20 20" stroke="currentColor" stroke-width="2"/>
    `;
  } else {
    // Show normal music icon
    musicIcon.innerHTML = `
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    `;
  }
}

// Music button click event
musicBtn.addEventListener("click", toggleMusic);

const openLetterBtn = document.getElementById("open-letter-btn");
openLetterBtn.addEventListener("click", openLetter);

function openLetter() {
  // Start background music
  if (backgroundMusic) {
    backgroundMusic.volume = 0.4; // Set volume to 50%
    backgroundMusic.loop = true; // Enable looping
    backgroundMusic.play().catch((error) => {
      console.log("Autoplay prevented:", error);
      // If autoplay is prevented, we can show a play button or handle it differently
    });
  }

  const envelopeContainer = document.querySelector(".evelope-container");
  if (envelopeContainer) {
    envelopeContainer.classList.add("disapear");
  }

  const envelopeWrapper = document.querySelector(".envelopeWrapper");
  if (envelopeWrapper) {
    envelopeWrapper.classList.add("flap");
  }

  const envelopImg = document.querySelector(".envelopImg");
  if (envelopImg) {
    envelopImg.classList.add("envelopOpen");
  }

  const letter = document.querySelector(".letter");
  if (letter) {
    letter.classList.add("lineUptop");
  }

  const envelopBodyImg = document.querySelector(".envelopBodyImg");
  if (envelopBodyImg) {
    envelopBodyImg.classList.add("shadow");
  }

  const hearts = document.querySelector(".hearts");
  if (hearts) {
    hearts.classList.remove("close");
  }

  const loadingScreen = document.querySelector(".loading-screen");
  const mainContent = document.querySelector(".main-content");
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.remove();
      hearts.remove();
      if (mainContent) {
        mainContent.style.display = "block";
        mainContent.offsetHeight;
        mainContent.classList.add("show");
      }
    }, 6000);

    // Schedule RSVP modal to appear after 20 seconds
    scheduleRSVPModal();
  }
}
