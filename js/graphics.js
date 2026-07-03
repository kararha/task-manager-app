import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';

let scene, camera, webGLRenderer, css3DRenderer, controls;
let starParticles, gridHelper;
let lights = {};

// 3D Progress Chart Meshes
let chartBars = { todo: null, in_progress: null, done: null };
let chartBarTargets = { todo: 1, in_progress: 1, done: 1 };
let chartBarCurrents = { todo: 1, in_progress: 1, done: 1 };

// WebGL Celebration Particles pool
let activeExplosions = [];

// Camera transition variables
let cameraTargetPos = new THREE.Vector3(0, 150, 800);
let cameraTargetLookAt = new THREE.Vector3(0, -50, 0);
let cameraCurrentLookAt = new THREE.Vector3(0, -50, 0);
const camLerpSpeed = 0.06;
let isAnimatingCamera = false;

// Theme presets (matching main.css)
const THEMES = {
  cyber: {
    bg: 0x0a0814,
    todo: 0xff007f,
    in_progress: 0xffaa00,
    done: 0x00f0ff,
    ambient: 0x221a44,
    directional: 0x9d00ff
  },
  aurora: {
    bg: 0x051410,
    todo: 0x00ffaa,
    in_progress: 0x00ff66,
    done: 0x00ffaa,
    ambient: 0x0e2820,
    directional: 0x00ffaa
  },
  obsidian: {
    bg: 0x0f0b07,
    todo: 0xffaa00,
    in_progress: 0xff5500,
    done: 0xffaa00,
    ambient: 0x2d1f11,
    directional: 0xffaa00
  }
};

let currentTheme = THEMES.cyber;

// Create circular canvas texture for glowing particles
function createCircleTexture(colorStr, size = 16) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  grad.addColorStop(0, colorStr);
  grad.addColorStop(0.3, colorStr);
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export const Graphics = {
  init: (webglContainer, css3dContainer) => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Create Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(currentTheme.bg);
    scene.fog = new THREE.FogExp2(currentTheme.bg, 0.0006);

    // 2. Create Camera
    camera = new THREE.PerspectiveCamera(45, width / height, 1, 4000);
    camera.position.copy(cameraTargetPos);

    // 3. WebGL Renderer (for 3D models and lighting)
    webGLRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    webGLRenderer.setSize(width, height);
    webGLRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    webGLRenderer.shadowMap.enabled = true;
    webglContainer.appendChild(webGLRenderer.domElement);

    // 4. CSS3D Renderer (for interactive HTML elements)
    css3DRenderer = new CSS3DRenderer();
    css3DRenderer.setSize(width, height);
    css3dContainer.appendChild(css3DRenderer.domElement);

    // 5. OrbitControls
    controls = new OrbitControls(camera, css3DRenderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05; // Don't go below floor
    controls.minDistance = 300;
    controls.maxDistance = 1500;
    controls.target.copy(cameraTargetLookAt);

    // Setup events
    controls.addEventListener('start', () => {
      isAnimatingCamera = false;
    });

    // 6. Lighting
    lights.ambient = new THREE.AmbientLight(currentTheme.ambient, 1.5);
    scene.add(lights.ambient);

    lights.directional = new THREE.DirectionalLight(currentTheme.directional, 2.5);
    lights.directional.position.set(0, 300, 200);
    lights.directional.castShadow = true;
    scene.add(lights.directional);

    // Subtle pointer light that follows mouse
    lights.pointer = new THREE.PointLight(0xff00ff, 4, 400);
    scene.add(lights.pointer);

    // 7. Grid & Base floor
    gridHelper = new THREE.GridHelper(2000, 40, 0x9d00ff, 0x1f1638);
    gridHelper.position.y = -220;
    gridHelper.material.opacity = 0.35;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // 8. Background Star Field
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 1200;
    const starPositions = new Float32Array(starsCount * 3);
    const starSpeeds = [];

    for (let i = 0; i < starsCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 3000;
      starPositions[i + 1] = Math.random() * 800 - 200;
      starPositions[i + 2] = (Math.random() - 0.5) * 3000;
      starSpeeds.push(0.02 + Math.random() * 0.08);
    }
    
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starTex = createCircleTexture('rgba(255, 255, 255, 0.8)', 8);
    const starMat = new THREE.PointsMaterial({
      size: 4,
      map: starTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    starParticles = new THREE.Points(starsGeo, starMat);
    starParticles.userData.speeds = starSpeeds;
    scene.add(starParticles);

    // 9. Build 3D Kanban Bar Charts in WebGL
    build3DChartBars();

    // 10. Start Animation Render Loop
    animate();

    // Resize Handler
    window.addEventListener('resize', onWindowResize);
    
    // Mouse movement light tracking
    window.addEventListener('mousemove', onMouseMove);
  },

  // Switch Theme Color Vector
  setTheme: (themeName) => {
    const theme = THEMES[themeName] || THEMES.cyber;
    currentTheme = theme;
    
    // Animate scene background and fog
    scene.background.setHex(theme.bg);
    scene.fog.color.setHex(theme.bg);
    
    lights.ambient.color.setHex(theme.ambient);
    lights.directional.color.setHex(theme.directional);

    // Update 3D chart colors
    updateChartBarColors();
  },

  // Update heights of 3D charts
  update3DCharts: (todo, progress, done) => {
    // Target heights correspond to task counts (offset by base height)
    chartBarTargets.todo = Math.max(0.1, todo * 25);
    chartBarTargets.in_progress = Math.max(0.1, progress * 25);
    chartBarTargets.done = Math.max(0.1, done * 25);
  },

  // Trigger celebration explosion at 3D location of task card
  triggerCelebration: (cardPos) => {
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    
    const startX = cardPos.x;
    const startY = cardPos.y;
    const startZ = cardPos.z + 5; // Spark slightly in front

    for (let i = 0; i < particleCount; i++) {
      // Start at card center
      positions[i * 3] = startX;
      positions[i * 3 + 1] = startY;
      positions[i * 3 + 2] = startZ;

      // Random spherical velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const speed = 1.5 + Math.random() * 4.5;
      
      velocities.push(new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed + 2, // Slight upward force
        Math.cos(phi) * speed
      ));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const colors = ['#00f0ff', '#ff007f', '#39ff14', '#ffff00', '#9d00ff'];
    const randColor = colors[Math.floor(Math.random() * colors.length)];
    const sparkTex = createCircleTexture(randColor, 16);
    
    const material = new THREE.PointsMaterial({
      size: 8,
      map: sparkTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 1.0
    });

    const particles = new THREE.Points(geometry, material);
    particles.userData = {
      velocities: velocities,
      life: 1.0, // Lifespan multiplier (fades out)
      decay: 0.015 + Math.random() * 0.01
    };

    scene.add(particles);
    activeExplosions.push(particles);
  },

  // Smooth camera alignment to columns or overview
  focusCamera: (presetKey) => {
    isAnimatingCamera = true;
    
    switch (presetKey) {
      case 'overview':
        cameraTargetPos.set(0, 150, 850);
        cameraTargetLookAt.set(0, -50, 0);
        controls.enableRotate = true;
        break;
      case 'todo':
        cameraTargetPos.set(-350, 50, 480);
        cameraTargetLookAt.set(-350, 0, 0);
        controls.enableRotate = true;
        break;
      case 'in_progress':
        cameraTargetPos.set(0, 50, 480);
        cameraTargetLookAt.set(0, 0, 0);
        controls.enableRotate = true;
        break;
      case 'done':
        cameraTargetPos.set(350, 50, 480);
        cameraTargetLookAt.set(350, 0, 0);
        controls.enableRotate = true;
        break;
      case 'flat':
        cameraTargetPos.set(0, 0, 800);
        cameraTargetLookAt.set(0, 0, 0);
        controls.enableRotate = false; // Lock camera for clean flat Kanban view
        break;
    }
  },

  // Accessors
  getScene: () => scene,
  getCamera: () => camera,
  getControls: () => controls
};

// Build 3D chart meshes behind columns
function build3DChartBars() {
  const barWidth = 60;
  const barDepth = 60;
  
  const columns = [
    { key: 'todo', x: -350, color: currentTheme.todo },
    { key: 'in_progress', x: 0, color: currentTheme.in_progress },
    { key: 'done', x: 350, color: currentTheme.done }
  ];

  columns.forEach(col => {
    // Cylinder geometry that scales vertically
    const geometry = new THREE.BoxGeometry(barWidth, 1, barDepth);
    
    // Make origin at bottom of geometry so scaling height scales upward
    geometry.translate(0, 0.5, 0);

    const material = new THREE.MeshStandardMaterial({
      color: col.color,
      emissive: col.color,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.65,
      roughness: 0.2,
      metalness: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(col.x, -219, -150); // Behind columns, sitting on grid
    mesh.scale.set(1, 0.1, 1);
    
    scene.add(mesh);
    chartBars[col.key] = mesh;
  });
}

// Update chart bar materials when theme switches
function updateChartBarColors() {
  if (chartBars.todo) {
    chartBars.todo.material.color.setHex(currentTheme.todo);
    chartBars.todo.material.emissive.setHex(currentTheme.todo);
  }
  if (chartBars.in_progress) {
    chartBars.in_progress.material.color.setHex(currentTheme.in_progress);
    chartBars.in_progress.material.emissive.setHex(currentTheme.in_progress);
  }
  if (chartBars.done) {
    chartBars.done.material.color.setHex(currentTheme.done);
    chartBars.done.material.emissive.setHex(currentTheme.done);
  }
}

// Track mouse position in 3D to guide point light
function onMouseMove(event) {
  const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

  // Project point in front of camera
  const vector = new THREE.Vector3(mouseX, mouseY, 0.5);
  vector.unproject(camera);
  const dir = vector.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  const pos = camera.position.clone().add(dir.multiplyScalar(distance));
  
  lights.pointer.position.set(pos.x, pos.y + 40, pos.z + 100);
}

// Render and Update Loop
function animate() {
  requestAnimationFrame(animate);

  // 1. Slow background star drift
  if (starParticles) {
    const posAttr = starParticles.geometry.attributes.position;
    const speeds = starParticles.userData.speeds;
    
    for (let i = 0; i < posAttr.count; i++) {
      let y = posAttr.getY(i);
      y -= speeds[i] * 1.5;
      
      // Wrap stars
      if (y < -400) {
        y = 600;
        posAttr.setX(i, (Math.random() - 0.5) * 3000);
        posAttr.setZ(i, (Math.random() - 0.5) * 3000);
      }
      posAttr.setY(i, y);
    }
    posAttr.needsUpdate = true;
  }

  // 2. Animate 3D Chart heights (lerping height)
  for (let key in chartBars) {
    const mesh = chartBars[key];
    if (mesh) {
      chartBarCurrents[key] += (chartBarTargets[key] - chartBarCurrents[key]) * 0.1;
      mesh.scale.y = chartBarCurrents[key];
      
      // Make glow pulsate slightly
      mesh.material.emissiveIntensity = 0.15 + Math.sin(Date.now() * 0.003) * 0.05;
    }
  }

  // 3. Update Active WebGL Particles explosions
  for (let i = activeExplosions.length - 1; i >= 0; i--) {
    const explosion = activeExplosions[i];
    const posAttr = explosion.geometry.attributes.position;
    const velocities = explosion.userData.velocities;
    explosion.userData.life -= explosion.userData.decay;

    if (explosion.userData.life <= 0) {
      scene.remove(explosion);
      explosion.geometry.dispose();
      explosion.material.dispose();
      activeExplosions.splice(i, 1);
      continue;
    }

    explosion.material.opacity = explosion.userData.life;

    for (let j = 0; j < posAttr.count; j++) {
      let x = posAttr.getX(j);
      let y = posAttr.getY(j);
      let z = posAttr.getZ(j);

      const vel = velocities[j];
      x += vel.x;
      y += vel.y;
      z += vel.z;

      // Apply air drag and gravity
      vel.x *= 0.98;
      vel.y -= 0.08; // Gravity pulls sparks down
      vel.y *= 0.98;
      vel.z *= 0.98;

      posAttr.setXYZ(j, x, y, z);
    }
    posAttr.needsUpdate = true;
  }

  // 4. Smooth Camera Focus Transitions
  if (isAnimatingCamera) {
    camera.position.lerp(cameraTargetPos, camLerpSpeed);
    cameraCurrentLookAt.lerp(cameraTargetLookAt, camLerpSpeed);
    controls.target.copy(cameraCurrentLookAt);
    
    // Check if close enough to snap and release control animation
    if (camera.position.distanceTo(cameraTargetPos) < 1.0) {
      camera.position.copy(cameraTargetPos);
      controls.target.copy(cameraTargetLookAt);
      isAnimatingCamera = false;
    }
  }

  // 5. Update Orbit Controls
  controls.update();

  // 6. Draw Renderers
  webGLRenderer.render(scene, camera);
  css3DRenderer.render(scene, camera);
}

// Window resize handler
function onWindowResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  webGLRenderer.setSize(w, h);
  css3DRenderer.setSize(w, h);
}
