import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// ============================================================================
// PROCEDURAL TEXTURE GENERATORS (CACHED IN MEMORY FOR INSTANT LOAD)
// ============================================================================

let cachedSoccerTexture = null;
let cachedBasketballTexture = null;
let cachedCricketTexture = null;

/**
 * Generates an authentic Telstar truncated icosahedron soccer ball texture.
 * 12 regular black pentagons at icosahedron vertices, 20 white hexagons, stitched seams.
 */
function getSoccerTexture() {
  if (cachedSoccerTexture) return cachedSoccerTexture;

  const W = 1024;
  const H = 512;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Golden ratio vertices of icosahedron
  const phi = (1 + Math.sqrt(5)) / 2;
  const r = Math.sqrt(1 + phi * phi);
  const rawVerts = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
  ];
  const verts = rawVerts.map(([x, y, z]) => [x / r, y / r, z / r]);

  // Precompute 5 neighbor tangent directions for each vertex
  const tangentVectors = verts.map((v, i) => {
    const dirs = [];
    for (let j = 0; j < 12; j++) {
      if (i === j) continue;
      const dot = v[0] * verts[j][0] + v[1] * verts[j][1] + v[2] * verts[j][2];
      if (dot > 0.44 && dot < 0.46) {
        const tx = verts[j][0] - dot * v[0];
        const ty = verts[j][1] - dot * v[1];
        const tz = verts[j][2] - dot * v[2];
        const len = Math.sqrt(tx * tx + ty * ty + tz * tz);
        dirs.push([tx / len, ty / len, tz / len]);
      }
    }
    return dirs;
  });

  const imgData = ctx.createImageData(W, H);
  const data = imgData.data;

  for (let y = 0; y < H; y++) {
    const lat = (y / H) * Math.PI;
    const sinLat = Math.sin(lat);
    const cosLat = Math.cos(lat);

    for (let x = 0; x < W; x++) {
      const lon = (x / W) * Math.PI * 2;
      const px = sinLat * Math.cos(lon);
      const py = cosLat;
      const pz = sinLat * Math.sin(lon);

      // Find closest icosahedron vertex
      let maxDot = -2;
      let bestI = 0;
      let secDot = -2;

      for (let i = 0; i < 12; i++) {
        const dot = px * verts[i][0] + py * verts[i][1] + pz * verts[i][2];
        if (dot > maxDot) {
          secDot = maxDot;
          maxDot = dot;
          bestI = i;
        } else if (dot > secDot) {
          secDot = dot;
        }
      }

      const vi = verts[bestI];
      const dirs = tangentVectors[bestI];
      const dx = px - vi[0];
      const dy = py - vi[1];
      const dz = pz - vi[2];

      let maxProj = -999;
      for (let k = 0; k < dirs.length; k++) {
        const proj = dx * dirs[k][0] + dy * dirs[k][1] + dz * dirs[k][2];
        if (proj > maxProj) maxProj = proj;
      }

      const idx = (y * W + x) * 4;

      // Inside regular pentagon
      if (maxProj < 0.28 && maxDot > 0.88) {
        data[idx] = 22;     // R
        data[idx + 1] = 24; // G
        data[idx + 2] = 28; // B
        data[idx + 3] = 255;
      }
      // Pentagon border stitch seam
      else if (maxProj < 0.31 && maxDot > 0.86) {
        data[idx] = 90;
        data[idx + 1] = 94;
        data[idx + 2] = 105;
        data[idx + 3] = 255;
      }
      // Hexagon boundary stitch seam
      else if (Math.abs(maxDot - secDot) < 0.028 && secDot > 0.45) {
        data[idx] = 175;
        data[idx + 1] = 178;
        data[idx + 2] = 188;
        data[idx + 3] = 255;
      }
      // White leather hexagon
      else {
        // Subtle organic shading
        const shade = Math.floor(245 - (1 - maxDot) * 20);
        data[idx] = shade;
        data[idx + 1] = shade;
        data[idx + 2] = Math.min(255, shade + 3);
        data[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  cachedSoccerTexture = texture;
  return texture;
}

/**
 * Generates pebbled leather grain texture for basketball.
 */
function getBasketballTexture() {
  if (cachedBasketballTexture) return cachedBasketballTexture;

  const W = 512;
  const H = 256;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Rich terracotta orange background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#ea580c");
  grad.addColorStop(0.5, "#d94b06");
  grad.addColorStop(1, "#c2410c");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Stippled pebbled leather grain
  ctx.fillStyle = "rgba(120, 30, 0, 0.35)";
  for (let i = 0; i < 9000; i++) {
    const rx = Math.random() * W;
    const ry = Math.random() * H;
    const rSize = Math.random() > 0.8 ? 1.8 : 1.2;
    ctx.beginPath();
    ctx.arc(rx, ry, rSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Highlight specks
  ctx.fillStyle = "rgba(255, 200, 150, 0.25)";
  for (let i = 0; i < 4000; i++) {
    const rx = Math.random() * W;
    const ry = Math.random() * H;
    ctx.beginPath();
    ctx.arc(rx, ry, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  cachedBasketballTexture = texture;
  return texture;
}

/**
 * Generates a polished cricket ball texture with gold crest and stitched equator.
 */
function getCricketTexture() {
  if (cachedCricketTexture) return cachedCricketTexture;

  const W = 512;
  const H = 256;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Deep luxury cherry-red leather
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#881320");
  grad.addColorStop(0.5, "#6b0c16");
  grad.addColorStop(1, "#520810");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Equator seam band
  const seamY = H / 2;
  ctx.fillStyle = "#3e040a";
  ctx.fillRect(0, seamY - 4, W, 8);

  // White hand-stitched threads along equator (alternating stitches)
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 1.5;
  for (let x = 0; x < W; x += 6) {
    ctx.beginPath();
    ctx.moveTo(x, seamY - 5);
    ctx.lineTo(x + 3, seamY + 5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 3, seamY - 5);
    ctx.lineTo(x, seamY + 5);
    ctx.stroke();
  }

  // Gold foil stamped brand insignia on upper hemisphere
  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("★ SPORTSYNC ★", W / 2, seamY - 45);

  ctx.font = "9px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#fbbf24";
  ctx.fillText("GRADE 1 MATCH", W / 2, seamY - 30);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  cachedCricketTexture = texture;
  return texture;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function Sports3DScene({
  activeSport = "football",
  interactive = true,
  className = "",
  height = "320px",
  showControls = true,
}) {
  const containerRef = useRef(null);
  const [currentSport, setCurrentSport] = useState(activeSport);

  useEffect(() => {
    setCurrentSport(activeSport);
  }, [activeSport]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || 360;
    const heightPx = container.clientHeight || 320;

    // Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 1000);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Studio Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    fillLight.position.set(-5, -2, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 1.2);
    rimLight.position.set(0, -4, 4);
    scene.add(rimLight);

    // Ball Group
    const ballGroup = new THREE.Group();
    scene.add(ballGroup);

    // ========================================================================
    // BUILD SPORT-SPECIFIC BALL
    // ========================================================================
    const baseSphereGeo = new THREE.SphereGeometry(1.25, 64, 64);
    const disposables = [baseSphereGeo];

    if (currentSport === "basketball") {
      // 🏀 BASKETBALL: Pebbled leather + 4 Black Channel Ribs
      const bballTex = getBasketballTexture();
      const bballMat = new THREE.MeshStandardMaterial({
        map: bballTex,
        roughness: 0.65,
        metalness: 0.05,
      });
      disposables.push(bballMat);
      const bballMesh = new THREE.Mesh(baseSphereGeo, bballMat);
      ballGroup.add(bballMesh);

      // Black rubber channel lines (Matte Black)
      const ribMat = new THREE.MeshStandardMaterial({
        color: 0x111114,
        roughness: 0.85,
        metalness: 0.1,
      });
      disposables.push(ribMat);

      // Equator ring
      const ribGeo1 = new THREE.TorusGeometry(1.252, 0.018, 16, 120);
      disposables.push(ribGeo1);
      const rib1 = new THREE.Mesh(ribGeo1, ribMat);
      ballGroup.add(rib1);

      // Meridian ring
      const rib2 = rib1.clone();
      rib2.rotation.x = Math.PI / 2;
      ballGroup.add(rib2);

      // Two iconic bowed side channels
      const rib3 = rib1.clone();
      rib3.rotation.y = Math.PI / 4;
      rib3.rotation.x = Math.PI / 8;
      ballGroup.add(rib3);

      const rib4 = rib1.clone();
      rib4.rotation.y = -Math.PI / 4;
      rib4.rotation.x = -Math.PI / 8;
      ballGroup.add(rib4);

    } else if (currentSport === "tennis") {
      // 🎾 TENNIS BALL: Optic Fluorescent Yellow Fuzz + Exact 3D Curved Seam
      const tennisMat = new THREE.MeshStandardMaterial({
        color: 0xcaee05, // Optic neon chartreuse yellow
        roughness: 0.85, // Felt matte fuzz
        metalness: 0.02,
      });
      disposables.push(tennisMat);
      const tennisMesh = new THREE.Mesh(baseSphereGeo, tennisMat);
      ballGroup.add(tennisMesh);

      // Exact mathematical 3D tennis seam curve
      const pts = [];
      const a = 0.36;
      for (let i = 0; i <= 120; i++) {
        const t = (i / 120) * Math.PI * 2;
        const x = Math.cos(t) - a * Math.cos(3 * t);
        const y = Math.sin(t) + a * Math.sin(3 * t);
        const z = 2 * Math.sqrt(a * (1 - a)) * Math.sin(2 * t);
        const len = Math.sqrt(x * x + y * y + z * z);
        pts.push(new THREE.Vector3((x / len) * 1.252, (y / len) * 1.252, (z / len) * 1.252));
      }
      const curve = new THREE.CatmullRomCurve3(pts, true);
      const seamGeo = new THREE.TubeGeometry(curve, 120, 0.024, 8, true);
      const seamMat = new THREE.MeshStandardMaterial({
        color: 0xf3f4f6, // Off-white rubber seam
        roughness: 0.45,
        metalness: 0.05,
      });
      disposables.push(seamGeo, seamMat);
      const seamMesh = new THREE.Mesh(seamGeo, seamMat);
      ballGroup.add(seamMesh);

    } else if (currentSport === "cricket") {
      // 🏏 CRICKET BALL: High-Gloss Cherry-Red Leather + Raised White Stitched Seam + Gold Crest
      const cricketTex = getCricketTexture();
      const cricketMat = new THREE.MeshStandardMaterial({
        map: cricketTex,
        roughness: 0.22, // Polished match shine
        metalness: 0.15,
      });
      disposables.push(cricketMat);
      const cricketMesh = new THREE.Mesh(baseSphereGeo, cricketMat);
      ballGroup.add(cricketMesh);

      // Raised equatorial seam band
      const seamGeo = new THREE.TorusGeometry(1.252, 0.024, 16, 120);
      const seamMat = new THREE.MeshStandardMaterial({
        color: 0x5a0812,
        roughness: 0.4,
        metalness: 0.1,
      });
      disposables.push(seamGeo, seamMat);
      const seamMesh = new THREE.Mesh(seamGeo, seamMat);
      ballGroup.add(seamMesh);

    } else {
      // ⚽ FOOTBALL / SOCCER: Authentic Truncated Icosahedron (12 Pentagons + 20 Hexagons)
      const soccerTex = getSoccerTexture();
      const soccerMat = new THREE.MeshStandardMaterial({
        map: soccerTex,
        roughness: 0.32,
        metalness: 0.05,
      });
      disposables.push(soccerMat);
      const soccerMesh = new THREE.Mesh(baseSphereGeo, soccerMat);
      ballGroup.add(soccerMesh);
    }

    // Atmospheric orbiting stardust particles
    const particlesCount = 36;
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      const radius = 1.6 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      posArray[i] = radius * Math.sin(phi) * Math.cos(theta);
      posArray[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      posArray[i + 2] = radius * Math.cos(phi);
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    disposables.push(particleGeo, particleMat);

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Interaction handling (momentum drag)
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let velocity = { x: 0.005, y: 0.007 };

    const onMouseDown = (e) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      velocity.y = deltaX * 0.005;
      velocity.x = deltaY * 0.005;

      ballGroup.rotation.y += velocity.y;
      ballGroup.rotation.x += velocity.x;

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMousePos.x;
      const deltaY = e.touches[0].clientY - prevMousePos.y;

      velocity.y = deltaX * 0.006;
      velocity.x = deltaY * 0.006;

      ballGroup.rotation.y += velocity.y;
      ballGroup.rotation.x += velocity.x;

      prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    if (interactive) {
      container.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);

      container.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend", onTouchEnd);
    }

    // Auto resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 320;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Inertia & ambient spin
      if (!isDragging) {
        velocity.x *= 0.95;
        velocity.y *= 0.95;

        ballGroup.rotation.y += velocity.y + 0.006;
        ballGroup.rotation.x += velocity.x + 0.003;
      }

      // Gentle floating bob
      ballGroup.position.y = Math.sin(elapsedTime * 1.4) * 0.07;

      // Orbiting particles
      particles.rotation.y = elapsedTime * 0.1;
      particles.rotation.x = elapsedTime * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount or sport change
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);

      if (interactive) {
        container.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);

        container.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
      }

      disposables.forEach((item) => {
        if (item && typeof item.dispose === "function") {
          item.dispose();
        }
      });
      renderer.dispose();
    };
  }, [currentSport, interactive]);

  const sportsOptions = [
    { id: "football", label: "Football", icon: "⚽" },
    { id: "basketball", label: "Basketball", icon: "🏀" },
    { id: "tennis", label: "Tennis", icon: "🎾" },
    { id: "cricket", label: "Cricket", icon: "🏏" },
  ];

  return (
    <div className={`relative flex flex-col items-center justify-center overflow-hidden select-none ${className}`}>
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        style={{ width: "100%", height, touchAction: "none" }}
        className="cursor-grab active:cursor-grabbing"
      />

      {/* Floating 3D Control Badges */}
      {showControls && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 rounded-full bg-white/70 dark:bg-black/60 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-sm z-10">
          {sportsOptions.map((sport) => {
            const isActive = currentSport === sport.id;
            return (
              <button
                key={sport.id}
                type="button"
                onClick={() => setCurrentSport(sport.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white"
                }`}
              >
                <span>{sport.icon}</span>
                <span className="hidden sm:inline">{sport.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
