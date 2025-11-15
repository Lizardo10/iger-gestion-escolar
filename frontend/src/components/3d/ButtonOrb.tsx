import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';

interface ButtonOrbProps {
  size?: number;
  primaryColor?: string;
  accentColor?: string;
  className?: string;
}

export function ButtonOrb({
  size = 40,
  primaryColor = '#2563eb',
  accentColor = '#22d3ee',
  className = '',
}: ButtonOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const engine = new BABYLON.Engine(canvas, true, {
      deterministicLockstep: false,
      preserveDrawingBuffer: true,
      adaptToDeviceRatio: true,
      antialias: true,
    });

    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

    const camera = new BABYLON.ArcRotateCamera(
      'button-camera',
      Math.PI / 2.5,
      Math.PI / 2.4,
      2.6,
      BABYLON.Vector3.Zero(),
      scene
    );
    camera.attachControl(canvas, false);
    camera.useAutoRotationBehavior = true;
    const autoRotation = camera.autoRotationBehavior;
    if (autoRotation) {
      autoRotation.idleRotationSpeed = 0.15;
      autoRotation.idleRotationWaitTime = 0;
      autoRotation.idleRotationSpinupTime = 0;
    }
    camera.panningSensibility = 0;
    camera.inputs.removeByType('ArcRotateCameraMouseWheelInput');
    camera.inputs.removeByType('ArcRotateCameraPointersInput');

    const hemiLight = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.8;

    const pointLight = new BABYLON.PointLight('point', new BABYLON.Vector3(0, 1.5, -1.5), scene);
    pointLight.intensity = 0.9;

    const glow = new BABYLON.GlowLayer('glow', scene, { blurKernelSize: 16 });
    glow.intensity = 0.6;

    const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 1.6, segments: 24 }, scene);
    const sphereMaterial = new BABYLON.StandardMaterial('sphereMaterial', scene);
    sphereMaterial.diffuseColor = BABYLON.Color3.FromHexString(primaryColor);
    sphereMaterial.emissiveColor = BABYLON.Color3.FromHexString(primaryColor).scale(0.5);
    sphereMaterial.specularColor = BABYLON.Color3.FromHexString(accentColor);
    sphere.material = sphereMaterial;

    const ring = BABYLON.MeshBuilder.CreateTorus(
      'ring',
      { diameter: 2.2, thickness: 0.08, tessellation: 64 },
      scene
    );
    const ringMaterial = new BABYLON.StandardMaterial('ringMaterial', scene);
    ringMaterial.diffuseColor = BABYLON.Color3.FromHexString(accentColor).scale(0.6);
    ringMaterial.emissiveColor = BABYLON.Color3.FromHexString(accentColor);
    ring.material = ringMaterial;
    ring.rotation.x = Math.PI / 4;

    const innerRing = BABYLON.MeshBuilder.CreateTorus(
      'innerRing',
      { diameter: 1.35, thickness: 0.05, tessellation: 64 },
      scene
    );
    const innerMaterial = new BABYLON.StandardMaterial('innerMaterial', scene);
    innerMaterial.diffuseColor = BABYLON.Color3.FromHexString(primaryColor).scale(0.5);
    innerMaterial.emissiveColor = BABYLON.Color3.FromHexString(primaryColor).scale(0.7);
    innerRing.material = innerMaterial;
    innerRing.rotation.y = Math.PI / 3;

    const particles = new BABYLON.ParticleSystem('particles', 300, scene);
    particles.particleTexture = new BABYLON.Texture(
      'https://assets.babylonjs.com/textures/flare.png',
      scene
    );
    particles.emitter = BABYLON.Vector3.Zero();
    particles.minEmitBox = new BABYLON.Vector3(-0.6, -0.6, -0.6);
    particles.maxEmitBox = new BABYLON.Vector3(0.6, 0.6, 0.6);
    particles.color1 = new BABYLON.Color4(0.6, 0.8, 1, 0.9);
    particles.color2 = new BABYLON.Color4(1, 0.6, 0.9, 0.9);
    particles.minSize = 0.03;
    particles.maxSize = 0.08;
    particles.minLifeTime = 0.4;
    particles.maxLifeTime = 1.1;
    particles.emitRate = 120;
    particles.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    particles.direction1 = new BABYLON.Vector3(-0.5, 0.5, -0.5);
    particles.direction2 = new BABYLON.Vector3(0.5, 0.8, 0.5);
    particles.gravity = new BABYLON.Vector3(0, -0.3, 0);
    particles.start();

    scene.onBeforeRenderObservable.add(() => {
      const delta = engine.getDeltaTime() * 0.0018;
      ring.rotation.y += delta;
      innerRing.rotation.z -= delta * 1.4;
      sphere.rotation.y += delta * 2;
    });

    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    engine.runRenderLoop(() => {
      scene.render();
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      particles.stop();
      scene.dispose();
      engine.dispose();
    };
  }, [primaryColor, accentColor]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: size,
        height: size,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}


