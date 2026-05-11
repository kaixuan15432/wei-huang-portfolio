// --- TYPEWRITER ---
function typeWriter() {
  const text = "Assistant Professor in Physical Oceanography";
  const el = document.getElementById('typewriter');
  if (!el) return;
  let i = 0;
  function w() { if (i < text.length) el.innerHTML += text.charAt(i++), setTimeout(w, 100); }
  w();
}

// --- MOBILE MENU ---
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

// Close mobile menu on resize to desktop
window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.add('hidden');
  }
});

// --- OCEAN EFFECT TOGGLE ---
let isOceanMode = localStorage.getItem('oceanMode') !== 'false'; // Default to WebGL mode
let animationId = null;
let oceanMesh = null;
let geometry = null;

// === OCEAN MESH EFFECT ===
function initOceanEffect() {
  const canvas = document.getElementById('ocean-canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  scene.background = new THREE.Color(0xD5E8F0);
  scene.fog = new THREE.FogExp2(0xB8D4E0, 0.04);

  // High density ocean mesh
  geometry = new THREE.PlaneGeometry(80, 50, 240, 150);
  
  const material = new THREE.MeshStandardMaterial({
    color: 0x4A90A4,
    transparent: true,
    opacity: 0.6,
    wireframe: true,
    roughness: 0.3,
    metalness: 0.6,
    emissive: 0x5DADE2,
    emissiveIntensity: 0.15
  });

  oceanMesh = new THREE.Mesh(geometry, material);
  oceanMesh.rotation.x = -Math.PI / 2 - 0.15;
  oceanMesh.position.y = -5;
  scene.add(oceanMesh);

  // Lighting
  const sunLight = new THREE.DirectionalLight(0x87CEEB, 1.5);
  sunLight.position.set(10, 20, 10);
  scene.add(sunLight);
  
  const fillLight = new THREE.DirectionalLight(0xB8E2EC, 0.8);
  fillLight.position.set(-10, 10, -5);
  scene.add(fillLight);
  
  scene.add(new THREE.AmbientLight(0xE6F4F9, 0.5));

  // Sea spray particles
  const particleCount = 150;
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount);
  const phases = new Float32Array(particleCount);
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 1] = -5 + Math.random() * 15;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    velocities[i] = Math.random() * 0.06 + 0.02;
    phases[i] = Math.random() * Math.PI * 2;
  }
  
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const particleMat = new THREE.PointsMaterial({
    color: 0xFFFFFF,
    size: 0.18,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  camera.position.set(0, 6, 25);
  camera.lookAt(0, -5, 0);

  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0, active: false };
  
  document.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
    mouse.active = true;
  });
  
  document.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  const posArray = particleGeo.attributes.position.array;
  let time = 0;

  function animate() {
    if (!isOceanMode) return;
    animationId = requestAnimationFrame(animate);
    
    time += 0.006;
    
    mouse.x += (mouse.targetX - mouse.x) * 0.015;
    mouse.y += (mouse.targetY - mouse.y) * 0.015;
    
    const mouseWorldX = mouse.x * 25;
    const mouseWorldZ = mouse.y * 15;

    // Wave animation
    const positions = geometry.attributes.position.array;
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];
      
      const wave1 = Math.sin(x * 0.12 + time * 0.35) * 1.0;
      const wave2 = Math.cos(x * 0.2 + z * 0.08 + time * 0.45) * 0.8;
      const wave3 = Math.sin(x * 0.06 - z * 0.04 + time * 0.2) * 1.2;
      const wave4 = Math.cos(x * 0.3 + time * 0.6) * 0.5;
      const wave5 = Math.sin(z * 0.1 + time * 0.4) * 0.6;
      
      const dx = x - mouseWorldX;
      const dz = z - mouseWorldZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const mouseInfluence = Math.exp(-dist * 0.03);
      const mouseWave = Math.sin(dist * 0.4 - time * 2) * mouseInfluence * 1.0;
      
      positions[i + 2] = wave1 + wave2 + wave3 + wave4 + wave5 + mouseWave;
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    oceanMesh.rotation.z = Math.sin(time * 0.15) * 0.015;
    
    // Particle animation
    for (let i = 0; i < particleCount; i++) {
      const phase = phases[i];
      
      const waveDrift = Math.sin(posArray[i * 3] * 0.1 + time * 0.7 + phase) * 0.03;
      const waveBounce = Math.cos(time * 1.2 + posArray[i * 3] * 0.15) * 0.015;
      
      posArray[i * 3] += mouse.x * 0.005 + waveDrift * 0.5;
      posArray[i * 3 + 1] += velocities[i] * 0.5 + waveBounce * 0.3;
      posArray[i * 3 + 2] += Math.sin(time * 0.25 + phase) * 0.003;
      
      if (mouse.active) {
        const dx = posArray[i * 3] - mouseWorldX;
        const dz = posArray[i * 3 + 2] - mouseWorldZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < 12) {
          const force = Math.pow((12 - dist) / 12, 2);
          posArray[i * 3] += dx * force * 0.02;
          posArray[i * 3 + 1] += force * 0.015;
          posArray[i * 3 + 2] += dz * force * 0.02;
        }
      }
      
      if (posArray[i * 3 + 1] > 18 || Math.abs(posArray[i * 3]) > 45) {
        posArray[i * 3] = (Math.random() - 0.5) * 80;
        posArray[i * 3 + 1] = -8 + Math.random() * 3;
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 30;
        velocities[i] = Math.random() * 0.06 + 0.02;
        phases[i] = Math.random() * Math.PI * 2;
      }
    }
    particleGeo.attributes.position.needsUpdate = true;
    
    camera.position.x += (mouse.x * 5 - camera.position.x) * 0.015;
    camera.position.y += (6 + mouse.y * 2 - camera.position.y) * 0.015;
    camera.lookAt(0, -5, 0);
    
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, oceanMesh, geometry, particles };
}

let oceanEffect = null;

function toggleOceanEffect() {
  isOceanMode = !isOceanMode;
  localStorage.setItem('oceanMode', isOceanMode);
  const cssBg = document.querySelector('.ocean-bg');
  const threeCanvas = document.getElementById('ocean-canvas');

  if (isOceanMode) {
    if (cssBg) cssBg.style.display = 'none';
    if (threeCanvas) threeCanvas.classList.remove('hidden');
    document.querySelectorAll('.nav-switch').forEach(el => el.classList.add('active'));
    if (!oceanEffect) oceanEffect = initOceanEffect();
  } else {
    if (cssBg) cssBg.style.display = 'block';
    if (threeCanvas) threeCanvas.classList.add('hidden');
    document.querySelectorAll('.nav-switch').forEach(el => el.classList.remove('active'));
    if (animationId) cancelAnimationFrame(animationId);
  }
}

// Initialize WebGL on load
window.addEventListener('load', () => {
  typeWriter();
  const cssBg = document.querySelector('.ocean-bg');
  const threeCanvas = document.getElementById('ocean-canvas');
  
  if (isOceanMode) {
    if (cssBg) cssBg.style.display = 'none';
    if (threeCanvas) threeCanvas.classList.remove('hidden');
    document.querySelectorAll('.nav-switch').forEach(el => el.classList.add('active'));
    oceanEffect = initOceanEffect();
  } else {
    if (cssBg) cssBg.style.display = 'block';
    if (threeCanvas) threeCanvas.classList.add('hidden');
    document.querySelectorAll('.nav-switch').forEach(el => el.classList.remove('active'));
  }
});

window.toggleOceanEffect = toggleOceanEffect;