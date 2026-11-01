import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function Sports3DScene({
  activeSport = "football",
  interactive = true,
  className = "",
  height = "360px",
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
    const heightPx = container.clientHeight || 360;

    // Scene, Camera, Renderer
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
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    fillLight.position.set(-5, -2, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 1.2);
    rimLight.position.set(0, -4, 4);
    scene.add(rimLight);

    // Dynamic Ball Mesh Generation
    const ballGroup = new THREE.Group();
    scene.add(ballGroup);

    // Main Sphere
    const geometry = new THREE.SphereGeometry(1.25, 64, 64);

    // Textures / Shaders based on currentSport
    let mainColor = 0xffffff;
    let roughness = 0.35;
    let metalness = 0.1;

    if (currentSport === "basketball") {
      mainColor = 0xf97316; // Vibrant basketball orange
      roughness = 0.55;
    } else if (currentSport === "tennis") {
      mainColor = 0xa3e635; // Neon tennis green/yellow
      roughness = 0.75;
    } else if (currentSport === "cricket") {
      mainColor = 0xbe123c; // Deep leather red
      roughness = 0.25;
      metalness = 0.15;
    } else {
      // Football / generic sports
      mainColor = 0xf8fafc;
      roughness = 0.3;
    }

    const material = new THREE.MeshStandardMaterial({
      color: mainColor,
      roughness: roughness,
      metalness: metalness,
    });

    const ballMesh = new THREE.Mesh(geometry, material);
    ballGroup.add(ballMesh);

    // Decorative Ribbons / Seams
    const ringGeo1 = new THREE.TorusGeometry(1.252, 0.018, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: currentSport === "basketball" ? 0x18181b : 0x0284c7,
      roughness: 0.2,
      metalness: 0.4,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat);
    ballGroup.add(ring1);

    const ring2 = ring1.clone();
    ring2.rotation.x = Math.PI / 2;
    ballGroup.add(ring2);

    const ring3 = ring1.clone();
    ring3.rotation.y = Math.PI / 2;
    ballGroup.add(ring3);

    // Orbiting Atmospheric Particles
    const particlesCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      const radius = 1.6 + Math.random() * 0.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      posArray[i] = radius * Math.sin(phi) * Math.cos(theta);
      posArray[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      posArray[i + 2] = radius * Math.cos(phi);
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Interaction handling
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let velocity = { x: 0.006, y: 0.008 };

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

    // Touch support for mobile
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

    // Resize observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Inertia & ambient spin
      if (!isDragging) {
        velocity.x *= 0.95;
        velocity.y *= 0.95;

        ballGroup.rotation.y += velocity.y + 0.007;
        ballGroup.rotation.x += velocity.x + 0.004;
      }

      // Gentle floating bob
      ballGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.08;

      // Particle rotation
      particles.rotation.y = elapsedTime * 0.12;
      particles.rotation.x = elapsedTime * 0.06;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
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

      geometry.dispose();
      material.dispose();
      ringGeo1.dispose();
      ringMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
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
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 rounded-full bg-white/70 dark:bg-black/60 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-sm z-10">
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
    </div>
  );
}
