import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Building2 } from 'lucide-react';
import { buildHostelCampusEnvironment } from '../components/Campus3DEnvironment';

export default function IntroPage({ onComplete }) {
  const containerRef = useRef(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isTransitioningRef = useRef(false);
  const transitionStartRef = useRef(0);

  // Transition into Login on User Interaction (Click / Tap / Any Key)
  const handleEnter = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setIsTransitioning(true);
    transitionStartRef.current = performance.now();

    try {
      localStorage.setItem('nexus_intro_completed', 'true');
      sessionStorage.setItem('nexus_session_intro_seen', 'true');
    } catch (e) {
      // ignore
    }

    // Smooth forward camera acceleration into hostel entrance, then transition
    setTimeout(() => {
      onComplete();
    }, 950);
  }, [onComplete]);

  // Global Keydown, Click, and Touch listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;
      handleEnter();
    };

    const handleClickOrTouch = () => {
      handleEnter();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClickOrTouch);
    window.addEventListener('touchstart', handleClickOrTouch, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOrTouch);
      window.removeEventListener('touchstart', handleClickOrTouch);
    };
  }, [handleEnter]);

  // 3D Cinematic Campus Scene & Animation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

    // Initial Aerial Starting Position (Wide Aerial View of Campus)
    const camStart = new THREE.Vector3(15, 14, 26);
    const lookStart = new THREE.Vector3(0, 2.5, 0);

    // Midpoint along Courtyard Promenade
    const camMid = new THREE.Vector3(5.0, 5.8, 17.0);
    const lookMid = new THREE.Vector3(-0.2, 2.0, 1.0);

    // Hero Eye-Level View (Framing Block A entrance, courtyard, pathways, trees)
    const camHero = new THREE.Vector3(1.2, 2.4, 10.2);
    const lookHero = new THREE.Vector3(-0.3, 1.8, 0);

    // Entrance Dolly Target on User Interaction
    const camEntrance = new THREE.Vector3(-0.2, 1.6, 2.2);
    const lookEntrance = new THREE.Vector3(0.5, 1.6, -1.0);

    camera.position.copy(camStart);
    camera.lookAt(lookStart);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 4. Build University Hostel Campus Environment
    const env = buildHostelCampusEnvironment(scene);

    // 5. Mouse Parallax Tracking
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e) => {
      mouse.targetX = (e.clientX / width - 0.5) * 2;
      mouse.targetY = -(e.clientY / height - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 6. Smooth Animation & Cinematic Flight Loop
    let reqId;
    const animStartTime = performance.now();
    const flightDuration = 9000; // 9 seconds cinematic glide to hero view

    const currentLookAt = new THREE.Vector3().copy(lookStart);
    const targetLookAt = new THREE.Vector3();

    // Smoothstep interpolation helper
    function smoothStep(t) {
      return t * t * (3 - 2 * t);
    }

    const animate = () => {
      reqId = requestAnimationFrame(animate);

      const now = performance.now();
      const elapsed = now - animStartTime;
      const timeSec = now * 0.001;

      // Update trees swaying, window lights, and floating dust motes
      env.update(timeSec);

      // Smooth mouse damping
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      if (!isTransitioningRef.current) {
        // --- PHASE 1: Cinematic Campus Flight ---
        const flightT = Math.min(1.0, elapsed / flightDuration);

        if (flightT < 0.5) {
          // Aerial to Midpoint
          const subT = smoothStep(flightT * 2);
          camera.position.lerpVectors(camStart, camMid, subT);
          targetLookAt.lerpVectors(lookStart, lookMid, subT);
        } else {
          // Midpoint to Hero View
          const subT = smoothStep((flightT - 0.5) * 2);
          camera.position.lerpVectors(camMid, camHero, subT);
          targetLookAt.lerpVectors(lookMid, lookHero, subT);
        }

        // Apply gentle mouse parallax and subtle ambient breathing when at/near hero view
        if (flightT > 0.4) {
          const ambFactor = smoothStep((flightT - 0.4) / 0.6);
          const ambX = Math.sin(timeSec * 0.35) * 0.25 * ambFactor;
          const ambY = Math.cos(timeSec * 0.25) * 0.1 * ambFactor;
          camera.position.x += (mouse.x * 0.35 + ambX) * ambFactor;
          camera.position.y += (mouse.y * 0.2 + ambY) * ambFactor;
        }

        currentLookAt.lerp(targetLookAt, 0.08);
        camera.lookAt(currentLookAt);
      } else {
        // --- PHASE 2: Transition Acceleration toward Entrance ---
        const transElapsed = now - transitionStartRef.current;
        const transT = Math.min(1.0, transElapsed / 900);
        const transEase = transT * transT * transT; // Fast exponential acceleration

        camera.position.lerp(camEntrance, transEase * 0.12);
        currentLookAt.lerp(lookEntrance, 0.1);
        camera.lookAt(currentLookAt);
      }

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
      renderer.dispose();
      env.dispose();
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: '#1e3a8a',
        userSelect: 'none',
        cursor: 'pointer'
      }}
    >
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0
        }}
      />

      {/* Cinematic Soft Vignette & Sunset Warmth Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at center, transparent 50%, rgba(15, 23, 42, 0.4) 100%)'
        }}
      />

      {/* Cinematic Exposure Flare on Transition */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 20,
          pointerEvents: 'none',
          backgroundColor: '#fffbeb',
          opacity: isTransitioning ? 0.85 : 0,
          transition: 'opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />

      {/* Minimal Top Brand Header */}
      <header
        style={{
          position: 'absolute',
          top: 'clamp(24px, 4vw, 40px)',
          left: 'clamp(20px, 4vw, 48px)',
          zIndex: 10,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(-14px)' : 'translateY(0)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            flexShrink: 0
          }}
        >
          <Building2 size={24} color="#ffffff" />
        </div>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: 0,
              color: '#ffffff',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.4)'
            }}
          >
            HOSTEL <span style={{ color: '#38bdf8' }}>MANAGEMENT</span>
          </h1>
          <p
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#e2e8f0',
              margin: 0,
              textTransform: 'uppercase',
              textShadow: '0 1px 6px rgba(0, 0, 0, 0.35)'
            }}
          >
            HOSTEL & MESS
          </p>
        </div>
      </header>

      {/* Minimal Bottom Center Prompt: "PRESS ANY KEY TO ENTER" */}
      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(28px, 5vw, 44px)',
          left: '50%',
          transform: `translateX(-50%) ${isTransitioning ? 'scale(0.92)' : 'scale(1)'}`,
          zIndex: 10,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          opacity: isTransitioning ? 0 : 1,
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 22px',
            borderRadius: '999px',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#38bdf8',
              boxShadow: '0 0 10px #38bdf8',
              animation: 'pulse 2s infinite'
            }}
          />
          <span
            style={{
              fontSize: '0.86rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#ffffff',
              textTransform: 'uppercase'
            }}
          >
            PRESS ANY KEY TO ENTER
          </span>
        </div>

        <span
          style={{
            fontSize: '0.74rem',
            fontWeight: 500,
            color: '#cbd5e1',
            letterSpacing: '0.02em',
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)'
          }}
        >
          Tap anywhere to enter
        </span>
      </div>
    </div>
  );
}
