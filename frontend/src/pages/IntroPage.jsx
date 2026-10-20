import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowRight, ShieldCheck, Sparkles, Building2, ChevronRight, Eye } from 'lucide-react';

export default function IntroPage({ onComplete }) {
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress timer: reaches 100% in 4.5 seconds
    const startTime = Date.now();
    const duration = 4500;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        handleFinish();
      }
    }, 45);

    return () => clearInterval(interval);
  }, []);

  function handleFinish() {
    try {
      localStorage.setItem('nexus_intro_completed', 'true');
    } catch (e) {
      // ignore storage errors
    }
    onComplete();
  }

  // Three.js 3D Campus Architectural Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070b16, 0.035);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    camera.position.set(0, 5, 22);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x60a5fa, 2.0);
    dirLight1.position.set(10, 20, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x06b6d4, 1.8);
    dirLight2.position.set(-15, -5, 10);
    scene.add(dirLight2);

    // Central Campus Group
    const campusGroup = new THREE.Group();
    scene.add(campusGroup);

    // 1. Procedural 3D Hostel Towers with Glowing Windows
    const buildingGeom = new THREE.BoxGeometry(1, 1, 1);
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x0f1d3a,
      metalness: 0.85,
      roughness: 0.25,
      wireframe: false
    });

    const edgeMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    const buildings = [];
    const buildingConfigs = [
      { x: -5, z: 0, w: 2.8, h: 7, d: 2.8, name: 'Cauvery Block (H1)' },
      { x: 0, z: -2, w: 3.5, h: 9.5, d: 3.5, name: 'Ganga Block (H2)' },
      { x: 5, z: 1, w: 2.6, h: 6.5, d: 2.6, name: 'Yamuna Block (H3)' },
      { x: -3, z: 4, w: 2.2, h: 5, d: 2.2, name: 'Krishna Block (H4)' },
      { x: 3.5, z: -5, w: 2.4, h: 6, d: 2.4, name: 'Central Dining (M1)' }
    ];

    buildingConfigs.forEach((cfg) => {
      const bMesh = new THREE.Mesh(buildingGeom, buildingMat);
      bMesh.scale.set(cfg.w, cfg.h, cfg.d);
      bMesh.position.set(cfg.x, cfg.h / 2 - 2, cfg.z);
      campusGroup.add(bMesh);

      // Wireframe Edges
      const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d));
      const line = new THREE.LineSegments(edges, edgeMat);
      line.position.copy(bMesh.position);
      campusGroup.add(line);

      // Windows grid on facade
      const winCount = 8;
      for (let i = 0; i < winCount; i++) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.25), windowMat);
        const yOff = (i / winCount) * (cfg.h - 1) - cfg.h / 2 + 1;
        win.position.set(cfg.x, bMesh.position.y + yOff, cfg.z + cfg.d / 2 + 0.02);
        campusGroup.add(win);
      }

      buildings.push(bMesh);
    });

    // 2. Glowing Ground Grid (Digital Campus Foundation)
    const gridHelper = new THREE.GridHelper(30, 30, 0x3b82f6, 0x1e293b);
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    // 3. Floating Digital Holographic Room Pods
    const podGeom = new THREE.IcosahedronGeometry(0.45, 0);
    const podMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
      wireframe: true
    });

    const pods = [];
    for (let i = 0; i < 9; i++) {
      const pod = new THREE.Mesh(podGeom, podMat);
      const angle = (i / 9) * Math.PI * 2;
      const radius = 7 + (i % 3) * 1.5;
      pod.position.set(Math.cos(angle) * radius, 1 + Math.sin(i * 1.5) * 2, Math.sin(angle) * radius);
      campusGroup.add(pod);
      pods.push({ mesh: pod, baseAngle: angle, radius, speed: 0.005 + (i % 3) * 0.002, yOffset: pod.position.y });
    }

    // 4. Subtle Data Particle Constellation
    const particleCount = 200;
    const particleGeom = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 35;
      particlePos[i + 1] = Math.random() * 16 - 2;
      particlePos[i + 2] = (Math.random() - 0.5) * 35;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // Mouse movement interaction (Parallax)
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e) => {
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      mouseX = (e.clientX - windowHalfX) * 0.0006;
      mouseY = (e.clientY - windowHalfY) * 0.0006;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let reqId;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = clock.getElapsedTime();

      // Smooth camera parallax
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;
      camera.position.x = Math.sin(targetX) * 22;
      camera.position.z = Math.cos(targetX) * 22;
      camera.position.y = 5 - targetY * 12;
      camera.lookAt(0, 2.5, 0);

      // Subtle slow rotation of campus scene
      campusGroup.rotation.y = delta * 0.06;

      // Orbit floating room pods
      pods.forEach((p) => {
        p.baseAngle += p.speed;
        p.mesh.position.x = Math.cos(p.baseAngle) * p.radius;
        p.mesh.position.z = Math.sin(p.baseAngle) * p.radius;
        p.mesh.position.y = p.yOffset + Math.sin(delta * 2 + p.radius) * 0.4;
        p.mesh.rotation.x += 0.01;
        p.mesh.rotation.y += 0.015;
      });

      // Gently float particles
      particles.rotation.y = delta * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // Resource Cleanup
    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      // Dispose Three.js objects
      buildingGeom.dispose();
      buildingMat.dispose();
      edgeMat.dispose();
      windowMat.dispose();
      podGeom.dispose();
      podMat.dispose();
      particleGeom.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#070b16',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
        userSelect: 'none'
      }}
    >
      {/* 3D Canvas Background */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />

      {/* Atmospheric Vignette Gradients */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at center, transparent 40%, rgba(7, 11, 22, 0.85) 100%)'
        }}
      />

      {/* Top Header Bar */}
      <header
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '28px 48px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(37, 99, 235, 0.6)'
            }}
          >
            <Building2 size={24} color="#ffffff" />
          </div>
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.35rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0,
                color: '#ffffff'
              }}
            >
              NEXUS <span style={{ color: '#38bdf8' }}>CAMPUS OS</span>
            </h2>
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#94a3b8',
                textTransform: 'uppercase'
              }}
            >
              Enterprise Hostel Management System
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.28)',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#38bdf8',
            backdropFilter: 'blur(10px)'
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#38bdf8',
              boxShadow: '0 0 10px #38bdf8'
            }}
          />
          SMART CAMPUS MANAGEMENT
        </div>
      </header>

      {/* Center Hero Message */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: 820,
          padding: '0 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 22
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            width: 'fit-content',
            padding: '5px 12px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '0.78rem',
            color: '#cbd5e1'
          }}
        >
          <Sparkles size={14} color="#f59e0b" />
          <span>Next-Gen Multi-Hostel Infrastructure</span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            margin: 0,
            color: '#ffffff'
          }}
        >
          Manage Your Campus.{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Simplify Hostel Life.
          </span>
        </h1>

        <p
          style={{
            fontSize: '1.12rem',
            lineHeight: 1.6,
            color: '#94a3b8',
            maxWidth: 620,
            margin: 0
          }}
        >
          One intelligent platform to manage residents, rooms, hostels, mess operations, inventory and payments with complete relational integrity.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
          <button
            onClick={handleFinish}
            className="btn btn-primary btn-lg"
            style={{
              padding: '14px 28px',
              fontSize: '0.98rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            <span>Get Started</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={handleFinish}
            className="btn btn-secondary btn-lg"
            style={{
              padding: '14px 24px',
              fontSize: '0.98rem'
            }}
          >
            Explore System
          </button>
        </div>
      </main>

      {/* Bottom Progress & Skip Bar */}
      <footer
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '28px 48px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, minWidth: 280 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#38bdf8'
              }}
            >
              ENTERING MANAGEMENT SYSTEM
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Initializing 18 Relational Database Tables... {progress}%
            </span>
          </div>

          <div
            style={{
              width: 140,
              height: 4,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 999,
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                borderRadius: 999,
                transition: 'width 0.1s linear'
              }}
            />
          </div>
        </div>

        <button
          onClick={handleFinish}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: 'none',
            color: '#cbd5e1',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: '6px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#38bdf8';
            e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#cbd5e1';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span>Skip Intro</span>
          <ChevronRight size={16} />
        </button>
      </footer>
    </div>
  );
}
