// Three.js variables
let scene, camera, renderer, controls;
let letterGroup, frontPage, backPage;
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

// Cache for THREE font parsed from MightyWings typeface JSON
let mightyThreeFont = null;

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
  // Create back texture first (no images)
  const backCanvas = createLetterTexture("back");
  const backTexture = new THREE.CanvasTexture(backCanvas);

  const frontCanvas = createLetterTexture("front");
  const frontTexture = new THREE.CanvasTexture(frontCanvas);

  const flower = new Image();
  flower.src = "assets/hoa1.png";
  flower.onload = function () {
    const ctx = frontCanvas.getContext("2d");

    const flowerWidth = 160;
    const flowerHeight = 160;
    const x = frontCanvas.width / 2;
    const y = 490;

    ctx.save();

    ctx.translate(x, y);

    ctx.rotate((300 * Math.PI) / 180);

    ctx.drawImage(
      flower,
      -flowerWidth / 2,
      -flowerHeight / 2,
      flowerWidth,
      flowerHeight
    );

    ctx.restore();

    frontTexture.needsUpdate = true;
  };

  const qaImage = new Image();
  qaImage.src = "assets/QA.png";
  qaImage.onload = function () {
    const ctx = backCanvas.getContext("2d");

    const qaWidth = 140;
    const qaHeight = 140;
    const x = backCanvas.width / 2;
    const y = -10;

    ctx.drawImage(qaImage, x - qaWidth / 2, y, qaWidth, qaHeight);

    backTexture.needsUpdate = true;
  };

  const itemWidth = 55;
  const itemHeight = 55;
  const itemY = 640;
  // Draw 3 item images at y=500
  const item1Image = new Image();
  item1Image.src = "assets/item1.png";
  item1Image.onload = function () {
    const ctx = backCanvas.getContext("2d");
    const x1 = backCanvas.width / 2 - 100; // Left position

    ctx.drawImage(item1Image, x1 - itemWidth / 2, itemY, itemWidth, itemHeight);
    backTexture.needsUpdate = true;
  };

  const item3Image = new Image();
  item3Image.src = "assets/item3.png";
  item3Image.onload = function () {
    const ctx = backCanvas.getContext("2d");
    const x3 = backCanvas.width / 2 + 100; // Right position

    ctx.drawImage(item3Image, x3 - itemWidth / 2, itemY, itemWidth, itemHeight);
    backTexture.needsUpdate = true;
  };

  // Materials for different faces
  const materials = [
    new THREE.MeshLambertMaterial({ color: 0xf8f9fa }), // right
    new THREE.MeshLambertMaterial({ color: 0xf8f9fa }), // left
    new THREE.MeshLambertMaterial({ color: 0xf8f9fa }), // top
    new THREE.MeshLambertMaterial({ color: 0xf8f9fa }), // bottom
    new THREE.MeshLambertMaterial({ map: frontTexture }), // front
    new THREE.MeshLambertMaterial({ map: backTexture }), // back
  ];

  // Create front page
  frontPage = new THREE.Mesh(letterGeometry, materials);
  frontPage.castShadow = true;
  frontPage.receiveShadow = true;

  letterGroup.add(frontPage);

  // Add 3D names as TextGeometry meshes on the front face
  addNames3D();
  // Add 3D venue text on the back face
  addBackVenue3D();
}

function createInvitationLetter() {
  letterGroup = new THREE.Group();

  const letterWidth = 4;
  const letterHeight = 6;
  const letterDepth = 0.05;

  const letterGeometry = new THREE.BoxGeometry(
    letterWidth,
    letterHeight,
    letterDepth
  );

  createTexturesWithImages(letterGeometry);

  scene.add(letterGroup);
}

function createLetterTexture(side) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");

  if (side === "front") {
    // Front side - invitation content
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    // Border
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = textColor;
    ctx.font = "bold 16px MightyWings";
    ctx.fillText("NHÀ GÁI", 130, 60);
    ctx.fillText("ÔNG NGUYỄN TRỌNG BẰNG", 130, 90);
    ctx.fillText("BÀ NGUYỄN THỊ HOA", 130, 120);
    ctx.fillText("HIỂN KHÁNH, NINH BÌNH", 130, 150);

    ctx.fillText("NHÀ TRAI", canvas.width - 130, 60);
    ctx.fillText("ÔNG HÀ VĂN LONG", canvas.width - 130, 90);
    ctx.fillText("BÀ DƯƠNG THỊ KHÁNH", canvas.width - 130, 120);
    ctx.fillText("KINH BẮC, BẮC NINH", canvas.width - 130, 150);

    // Decorative line
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 175);
    ctx.lineTo(canvas.width - 100, 175);
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = "bold 17px MightyWings";
    ctx.fillText("TRÂN TRỌNG BÁO TIN", canvas.width / 2, 215);
    ctx.fillText("LỄ THÀNH HÔN CỦA CON CHÚNG TÔI", canvas.width / 2, 245);

    ctx.fillStyle = themeColor;
    ctx.font = "bold 50px BohemeFloral, serif";
    ctx.fillText("and", canvas.width / 2, 370);
    ctx.font = "bold 40px MightyWings";

    ctx.fillStyle = textColor;
    ctx.font = "bold 17px MightyWings";
    ctx.fillText("HÔN LỄ ĐƯỢC CỬ HÀNH TẠI TƯ GIA", canvas.width / 2, 570);
    ctx.font = "bold 15px MightyWings";

    ctx.fillText(
      "Xóm Nhì, xã Hiển Khánh, tỉnh Ninh Bình",
      canvas.width / 2,
      600
    );

    ctx.font = "bold 17px MightyWings";
    ctx.fillText("VÀO LÚC 6:00 - THỨ BẢY", canvas.width / 2, 630);
    ctx.fillText("NGÀY 01 THÁNG 11 NĂM 2025", canvas.width / 2, 660);

    ctx.font = "bold 15px MightyWings";
    ctx.fillText("Tức ngày 12 tháng 09 năm Ất Tỵ", canvas.width / 2, 690);
  } else {
    // Back side - decorative pattern
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";

    // Border
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = textColor;
    ctx.font = "bold 16px MightyWings";
    ctx.fillText("THÁNG 11 - NĂM 2025", canvas.width / 2, 125);

    ctx.fillStyle = themeColor;
    ctx.fillRect(70, 140, canvas.width - 70 * 2, 30);

    const rectWidth = canvas.width - 70 * 2;
    const textSpacing = rectWidth / 7;
    const textY = 160;

    ctx.fillStyle = "#ffffff"; // White color
    ctx.font = "15px MightyWings";
    ctx.textAlign = "center";

    const days = ["T.2", "T.3", "T.4", "T.5", "T.6", "T.7", "CN"];
    days.forEach((day, index) => {
      const textX = 70 + (index + 0.5) * textSpacing;
      ctx.fillText(day, textX, textY);
    });

    // Create grid of numbers from 1 to 35 below the days
    ctx.fillStyle = textColor;
    ctx.font = "bold 15px MightyWings";
    ctx.textAlign = "center";

    let number = 1;
    const numberY = textY + 30; // 10px gap below days

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 7; col++) {
        if (number <= 35) {
          if (row === 0 && col < 5) continue;

          const numberX = 70 + (col + 0.5) * textSpacing;
          const currentY = numberY + row * 28; // 20px spacing between rows

          // Special styling for number 1
          if (number === 1) {
            // Draw heart background for number 1
            ctx.fillStyle = themeColor;
            ctx.beginPath();
            const heartSize = 27;
            const heartX = numberX + 5;
            const heartY = currentY - 5;

            const scale = heartSize / 95; // Scale factor to match heartSize
            const scaleX = scale * 1.1; // 20% smaller in X direction
            const x = heartX - heartSize / 2;
            const y = heartY - heartSize / 2;

            ctx.moveTo(x + 25 * scaleX, y + 25 * scale);
            ctx.bezierCurveTo(
              x + 25 * scaleX,
              y + 25 * scale,
              x + 20 * scaleX,
              y,
              x,
              y
            );
            ctx.bezierCurveTo(
              x - 30 * scaleX,
              y,
              x - 30 * scaleX,
              y + 35 * scale,
              x - 30 * scaleX,
              y + 35 * scale
            );
            ctx.bezierCurveTo(
              x - 30 * scaleX,
              y + 55 * scale,
              x - 10 * scaleX,
              y + 77 * scale,
              x + 25 * scaleX,
              y + 95 * scale
            );
            ctx.bezierCurveTo(
              x + 60 * scaleX,
              y + 77 * scale,
              x + 80 * scaleX,
              y + 55 * scale,
              x + 80 * scaleX,
              y + 35 * scale
            );
            ctx.bezierCurveTo(
              x + 80 * scaleX,
              y + 35 * scale,
              x + 80 * scaleX,
              y,
              x + 50 * scaleX,
              y
            );
            ctx.bezierCurveTo(
              x + 35 * scaleX,
              y,
              x + 25 * scaleX,
              y + 25 * scale,
              x + 25 * scaleX,
              y + 25 * scale
            );
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            ctx.fillText(number.toString(), numberX, currentY);
          } else {
            ctx.fillStyle = textColor;
            ctx.fillText(number.toString(), numberX, currentY);
          }

          number++;
        }
      }
    }

    ctx.fillStyle = textColor;
    ctx.font = "bold 17px MightyWings";
    ctx.fillText("TRÂN TRỌNG KÍNH MỜI", canvas.width / 2, 345);

    ctx.strokeStyle = textColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(70, 370);
    ctx.lineTo(canvas.width - 70, 370);
    ctx.stroke();

    ctx.font = "bold 15px MightyWings";

    ctx.fillText(
      "Đến dự buổi tiệc chung vui cùng gia đình chúng tôi tại",
      canvas.width / 2,
      400
    );

    ctx.fillStyle = textColor;
    ctx.font = "bold 17px MightyWings";
    ctx.fillText("SẢNH TẦNG 1", canvas.width / 2, 510);

    ctx.font = "bold 15px MightyWings";

    ctx.fillText(
      "119A Âu Cơ, phường Kinh Bắc, tỉnh Bắc Ninh",
      canvas.width / 2,
      535
    );

    ctx.font = "bold 18px MightyWings";
    ctx.fillText("VÀO LÚC 9 GIỜ 00 - NGÀY 31.10.2025", canvas.width / 2, 570);

    ctx.font = "bold 15px MightyWings";
    ctx.fillText("Tức ngày 11 tháng 09 năm Ất Tỵ", canvas.width / 2, 590);

    ctx.font = "italic 15px MightyWings";
    ctx.fillText(
      "Trân trọng cảm ơn sự hiện diện của Quý Khách!",
      canvas.width / 2,
      620
    );

    ctx.font = "bold 15px MightyWings";
    ctx.fillText("Đón khách 9:00", canvas.width / 2 - 100, 720);
    ctx.fillText("Khai tiệc 9:00", canvas.width / 2 + 100, 720);
  }

  return canvas;
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
  // Back canvas coords: x = center 256, y ≈ 480
  mesh.position.set(toWorldX(256), toWorldY(450), z);
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
function getOptimalPixelRatio() {
  const devicePixelRatio = window.devicePixelRatio;
  const isMobile = isMobileDevice();

  // For mobile devices, be more conservative with pixel ratio
  if (isMobile) {
    return Math.min(devicePixelRatio, 1.2);
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
    return Math.min(devicePixelRatio, 1.2);
  }

  return Math.min(devicePixelRatio, 2);
}

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const pixelRatio = getOptimalPixelRatio(); // e.g., Math.min(window.devicePixelRatio, 2)

  const width = Math.floor(canvas.clientWidth * pixelRatio);
  const height = Math.floor(canvas.clientHeight * pixelRatio);
  const needResize = canvas.width !== width || canvas.height !== height;

  if (needResize) {
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
  }
  return needResize;
}

function animate() {
  requestAnimationFrame(animate);

  // Only update camera if the canvas size actually changed
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

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
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Update zoom values based on new screen size
  const newBaseZoom = isMobileDevice() ? 8 : 7;
  if (Math.abs(targetZoom - newBaseZoom) > 1) {
    targetZoom = newBaseZoom;
  }
  
  // Update envelope image based on new screen size
  updateEnvelopeImage();
}

const bohemeFont = new FontFace(
  "BohemeFloral",
  "url(assets/bohemefloral.woff)"
);

const mightyFont = new FontFace("MightyWings", "url(assets/MightyWings.otf)");

Promise.all([
  bohemeFont.load().then(function (font) {
    document.fonts.add(font);
  }),
  mightyFont.load().then(function (font) {
    document.fonts.add(font);
  }),
])
  .then(() => {
    init();
    animate();
    // Initialize RSVP button visibility
    updateRSVPButtonVisibility();
    // Initialize envelope image based on screen size
    updateEnvelopeImage();
  })
  .catch((error) => {
    console.log("Font loading failed:", error);
    // Fallback if font loading fails
    init();
    animate();
    // Initialize RSVP button visibility
    updateRSVPButtonVisibility();
    // Initialize envelope image based on screen size
    updateEnvelopeImage();
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

// Function to update envelope image based on screen size
function updateEnvelopeImage() {
  const envelopeImage = document.querySelector('.letter .text img');
  if (envelopeImage) {
    if (isMobileDevice()) {
      envelopeImage.src = 'assets/ACN03107.webp';
    } else {
      envelopeImage.src = 'assets/ACN02733.webp';
    }
  }
}

function openLetter() {
  // Update envelope image based on screen size
  updateEnvelopeImage();
  
  // Start background music
  if (backgroundMusic) {
    backgroundMusic.volume = 0.5; // Set volume to 50%
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
