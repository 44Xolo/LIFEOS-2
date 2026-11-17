import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Layers, RotateCcw, SlidersHorizontal } from 'lucide-react';

type CameraPreset = 'isometric' | 'emblem' | 'orbital';

interface LifeOS3DCoreProps {
  className?: string;
  compact?: boolean;
  darkSurface?: boolean;
  activityPulse?: number;
}

const CAMERA_PRESETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  isometric: { pos: [4.4, 2.5, 5.2], target: [0, 0, 0] },
  emblem: { pos: [0.2, 0.35, 6.1], target: [0, 0, 0] },
  orbital: { pos: [0.1, 6.2, 1.8], target: [0, 0, 0] },
};

function createSlantedBarGeometry(width: number, height: number, skew: number, depth: number): THREE.ExtrudeGeometry {
  const hw = width / 2;
  const hh = height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw - skew, -hh);
  shape.lineTo(hw - skew, -hh);
  shape.lineTo(hw + skew, hh);
  shape.lineTo(-hw + skew, hh);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth,
    bevelEnabled: true,
    bevelThickness: 0.055,
    bevelSize: 0.045,
    bevelSegments: 4,
  });
  geo.center();
  return geo;
}

export const LifeOS3DCore: React.FC<LifeOS3DCoreProps> = ({
  className = '',
  compact = false,
  darkSurface = true,
  activityPulse = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [preset, setPreset] = useState<CameraPreset>('isometric');
  const [exploded, setExploded] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(true);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  const presetRef = useRef<CameraPreset>('isometric');
  const explodedRef = useRef(false);
  const pulseRef = useRef(activityPulse);
  const cameraMoveRef = useRef<{ active: boolean; pos: THREE.Vector3; target: THREE.Vector3 }>({
    active: false,
    pos: new THREE.Vector3(...CAMERA_PRESETS.isometric.pos),
    target: new THREE.Vector3(...CAMERA_PRESETS.isometric.target),
  });

  useEffect(() => {
    presetRef.current = preset;
    const cfg = CAMERA_PRESETS[preset];
    cameraMoveRef.current = {
      active: true,
      pos: new THREE.Vector3(...cfg.pos),
      target: new THREE.Vector3(...cfg.target),
    };
  }, [preset]);

  useEffect(() => {
    explodedRef.current = exploded;
  }, [exploded]);

  useEffect(() => {
    pulseRef.current = activityPulse;
  }, [activityPulse]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    const gl = renderer.getContext();
    const rendererInfo = String(gl.getParameter(gl.RENDERER) || '');
    const isSoftwareGl = /swiftshader|llvmpipe|softpipe|software/i.test(rendererInfo);

    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const width = Math.max(240, container.clientWidth);
    const height = Math.max(220, container.clientHeight);
    renderer.setSize(width, height);

    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglUnavailable(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    const scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 80);
    camera.position.set(...CAMERA_PRESETS.isometric.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 3.2;
    controls.maxDistance = 10;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.65;

    const onControlStart = () => {
      cameraMoveRef.current.active = false;
    };
    controls.addEventListener('start', onControlStart);

    // Three-point signature logo lighting
    const hemiLight = new THREE.HemisphereLight(0xf472b6, 0x312e81, 0.85);
    scene.add(hemiLight);

    const pinkKeyLight = new THREE.DirectionalLight(0xf472b6, 2.4);
    pinkKeyLight.position.set(-4.5, 3.8, 4.2);
    scene.add(pinkKeyLight);

    const indigoRimLight = new THREE.DirectionalLight(0x6366f1, 2.2);
    indigoRimLight.position.set(4.5, -2.5, -3.5);
    scene.add(indigoRimLight);

    // Master emblem group (composite multi-part assembly)
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    const emblemGroup = new THREE.Group();
    masterGroup.add(emblemGroup);

    const disposables: Array<{ dispose: () => void }> = [];

    // Materials matching the attached LIFEOS ribbon logo palette
    const pinkMat = new THREE.MeshPhysicalMaterial({
      color: 0xec4899,
      metalness: 0.38,
      roughness: 0.22,
      clearcoat: 0.9,
      clearcoatRoughness: 0.12,
      emissive: 0x9d174d,
      emissiveIntensity: 0.22,
    });
    const orchidMat = new THREE.MeshPhysicalMaterial({
      color: 0xa855f7,
      metalness: 0.45,
      roughness: 0.2,
      clearcoat: 0.95,
      clearcoatRoughness: 0.1,
      emissive: 0x581c87,
      emissiveIntensity: 0.2,
    });
    const indigoMat = new THREE.MeshPhysicalMaterial({
      color: 0x6366f1,
      metalness: 0.52,
      roughness: 0.22,
      clearcoat: 0.9,
      clearcoatRoughness: 0.12,
      emissive: 0x312e81,
      emissiveIntensity: 0.24,
    });
    const obsidianChromeMat = new THREE.MeshStandardMaterial({
      color: darkSurface ? 0x181825 : 0x27273a,
      metalness: 0.88,
      roughness: 0.22,
    });
    const luminousNodeMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      metalness: 0.25,
      roughness: 0.15,
      emissive: 0xec4899,
      emissiveIntensity: 0.9,
    });
    disposables.push(pinkMat, orchidMat, indigoMat, obsidianChromeMat, luminousNodeMat);

    // 1. Left slanted ribbon beam (lower pink -> top violet feel)
    const leftBarGeo = createSlantedBarGeometry(0.56, 2.25, 0.46, 0.34);
    const leftBar = new THREE.Mesh(leftBarGeo, pinkMat);
    leftBar.position.set(-0.62, 0.22, -0.18);
    emblemGroup.add(leftBar);
    disposables.push(leftBarGeo);

    // 2. Right slanted pillar beam
    const rightBarGeo = createSlantedBarGeometry(0.58, 2.35, 0.48, 0.34);
    const rightBar = new THREE.Mesh(rightBarGeo, indigoMat);
    rightBar.position.set(0.32, -0.35, 0.08);
    emblemGroup.add(rightBar);
    disposables.push(rightBarGeo);

    // 3. Crossbar fold (horizontal slanted ribbon connecting both beams)
    const crossBarGeo = createSlantedBarGeometry(2.15, 0.56, 0.22, 0.42);
    const crossBar = new THREE.Mesh(crossBarGeo, orchidMat);
    crossBar.position.set(-0.08, 0.16, 0.32);
    emblemGroup.add(crossBar);
    disposables.push(crossBarGeo);

    // 4. Precision bevel accent core plaque on crossbar
    const plaqueGeo = new THREE.BoxGeometry(1.15, 0.14, 0.06);
    const plaque = new THREE.Mesh(plaqueGeo, obsidianChromeMat);
    plaque.position.set(-0.08, 0.16, 0.56);
    emblemGroup.add(plaque);
    disposables.push(plaqueGeo);

    // 5-7. Three concentric orbital workspace rings
    const ring1Geo = new THREE.TorusGeometry(1.95, 0.028, 16, 96);
    const ring1 = new THREE.Mesh(ring1Geo, obsidianChromeMat);
    ring1.rotation.set(Math.PI / 3.2, 0.25, 0);
    masterGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(2.35, 0.02, 16, 96);
    const ring2 = new THREE.Mesh(ring2Geo, pinkMat);
    ring2.rotation.set(-Math.PI / 2.7, 0.55, 0.2);
    masterGroup.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(2.68, 0.016, 16, 96);
    const ring3 = new THREE.Mesh(ring3Geo, indigoMat);
    ring3.rotation.set(Math.PI / 5, -0.7, 0.3);
    masterGroup.add(ring3);
    disposables.push(ring1Geo, ring2Geo, ring3Geo);

    // 8-12. Five orbital satellite polyhedra (Finance, Business, Tasks, Opportunities, Learning)
    const nodeGeo = new THREE.OctahedronGeometry(0.11, 0);
    disposables.push(nodeGeo);
    const satellites: Array<{ mesh: THREE.Mesh; radius: number; speed: number; phase: number; tilt: number }> = [];
    for (let i = 0; i < 5; i++) {
      const mat = i % 2 === 0 ? luminousNodeMat : indigoMat;
      const mesh = new THREE.Mesh(nodeGeo, mat);
      const radius = 1.95 + (i % 3) * 0.36;
      const speed = 0.42 + i * 0.11;
      const phase = (i * Math.PI * 2) / 5;
      const tilt = (i - 2) * 0.32;
      satellites.push({ mesh, radius, speed, phase, tilt });
      masterGroup.add(mesh);
    }

    // Subtle spatial particle lattice
    const particleCount = 110;
    const pPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r = 3.0 + Math.random() * 2.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPositions[i * 3 + 1] = r * Math.cos(phi);
      pPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      color: darkSurface ? 0xf472b6 : 0x6366f1,
      transparent: true,
      opacity: 0.55,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    disposables.push(particleGeo, particleMat);

    // ResizeObserver for container responsiveness
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(240, Math.floor(entry.contentRect.width));
        const h = Math.max(220, Math.floor(entry.contentRect.height));
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    ro.observe(container);

    // Animation loop (capped cadence on software GL fallback)
    const clock = new THREE.Clock();
    let rafId = 0;
    let explodeLerp = 0;
    let lastSoftDraw = 0;

    const animateScene = (now: number) => {
      rafId = window.requestAnimationFrame(animateScene);
      if (isSoftwareGl && now - lastSoftDraw < 90) {
        return;
      }
      lastSoftDraw = now;

      const dt = Math.min(0.05, clock.getDelta());
      const t = clock.getElapsedTime();
      const pulse = Math.max(0.6, Math.min(2, pulseRef.current));

      // Smooth explode/assemble spring interpolation
      const targetExplode = explodedRef.current ? 1 : 0;
      explodeLerp += (targetExplode - explodeLerp) * Math.min(1, dt * 6);

      leftBar.position.set(-0.62 - explodeLerp * 0.55, 0.22 + explodeLerp * 0.2, -0.18 - explodeLerp * 0.5);
      rightBar.position.set(0.32 + explodeLerp * 0.55, -0.35 - explodeLerp * 0.2, 0.08 - explodeLerp * 0.2);
      crossBar.position.set(-0.08, 0.16, 0.32 + explodeLerp * 0.65);
      plaque.position.set(-0.08, 0.16, 0.56 + explodeLerp * 0.85);

      const ringScale = 1 + explodeLerp * 0.22;
      ring1.scale.setScalar(ringScale);
      ring2.scale.setScalar(1 + explodeLerp * 0.32);
      ring3.scale.setScalar(1 + explodeLerp * 0.42);

      // Gentle levitation + harmonic rotation
      emblemGroup.position.y = Math.sin(t * 1.4) * 0.08;
      ring1.rotation.z += dt * 0.22 * pulse;
      ring2.rotation.y -= dt * 0.18 * pulse;
      ring3.rotation.x += dt * 0.14 * pulse;
      particles.rotation.y += dt * 0.04;

      for (const sat of satellites) {
        const a = t * sat.speed * 0.55 + sat.phase;
        const rad = sat.radius * (1 + explodeLerp * 0.3);
        sat.mesh.position.set(
          Math.cos(a) * rad,
          Math.sin(a * 1.3 + sat.tilt) * 0.75,
          Math.sin(a) * rad
        );
        sat.mesh.rotation.y += dt * 1.2;
        sat.mesh.rotation.x += dt * 0.8;
      }

      if (cameraMoveRef.current.active) {
        camera.position.lerp(cameraMoveRef.current.pos, Math.min(1, dt * 4.5));
        controls.target.lerp(cameraMoveRef.current.target, Math.min(1, dt * 4.5));
        if (camera.position.distanceTo(cameraMoveRef.current.pos) < 0.03) {
          cameraMoveRef.current.active = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    rafId = window.requestAnimationFrame(animateScene);

    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      controls.removeEventListener('start', onControlStart);
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      disposables.forEach((d) => d.dispose());
      envTarget.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [darkSurface]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/90 ${
        darkSurface ? 'bg-[#05050A]' : 'bg-zinc-950'
      } ${className}`}
    >
      {/* Ambient Radial Glow behind Canvas (CSS only, never blurred over WebGL) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-75"
        style={{
          background:
            'radial-gradient(circle at 30% 25%, rgba(236, 72, 153, 0.16), transparent 52%), radial-gradient(circle at 75% 75%, rgba(99, 102, 241, 0.18), transparent 52%)',
        }}
      />

      {!webglUnavailable ? (
        <div
          ref={containerRef}
          className={`w-full ${compact ? 'h-56 sm:h-64' : 'h-80 sm:h-[380px]'} relative z-10 cursor-grab active:cursor-grabbing`}
          aria-label="Interactive 3D LIFEOS Orbital Emblem"
        />
      ) : (
        <div className={`w-full ${compact ? 'h-56 sm:h-64' : 'h-80 sm:h-[380px]'} relative z-10 flex flex-col items-center justify-center p-6 text-center`}>
          <img
            src="/assets/aistudio/Screenshot_2026-11-15_192656_d7a74dff.png"
            alt="LIFEOS Emblem"
            className="w-36 h-36 object-contain rounded-2xl"
          />
          <p className="text-xs font-mono text-zinc-400 mt-3">
            LIFEOS Spatial Emblem
          </p>
        </div>
      )}

      {/* Top Subtle Monospace Title (zero blur backdrop over WebGL) */}
      <div className="pointer-events-none absolute top-3.5 left-4 right-4 z-20 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <span>LIFEOS · 3D Spatial Core</span>
        <span className="text-fuchsia-400">Drag to Orbit</span>
      </div>

      {/* Collapsible Compact Bottom Control Dock (<= 14% height) */}
      {!webglUnavailable && (
        <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto inline-flex items-center gap-1 rounded-lg bg-zinc-950/90 border border-zinc-800 px-1.5 py-1">
            {controlsOpen ? (
              <>
                {(['isometric', 'emblem', 'orbital'] as CameraPreset[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPreset(p)}
                    className={`px-2 py-1 rounded text-[11px] font-medium capitalize transition-colors cursor-pointer ${
                      preset === p
                        ? 'bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setExploded((prev) => !prev)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    exploded
                      ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>{exploded ? 'Assemble' : 'Explode'}</span>
                </button>
              </>
            ) : (
              <span className="px-2 py-0.5 text-[11px] font-mono text-zinc-400">Controls</span>
            )}
            <button
              type="button"
              onClick={() => setControlsOpen((o) => !o)}
              aria-label="Toggle 3D controls"
              className="p-1 rounded text-zinc-400 hover:text-white cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setPreset('isometric');
              setExploded(false);
              cameraMoveRef.current = {
                active: true,
                pos: new THREE.Vector3(...CAMERA_PRESETS.isometric.pos),
                target: new THREE.Vector3(...CAMERA_PRESETS.isometric.target),
              };
            }}
            title="Reset Camera"
            className="pointer-events-auto p-1.5 rounded-lg bg-zinc-950/90 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
