import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';

interface DashboardSceneProps {
  className?: string;
}

export function DashboardScene({ className = '' }: DashboardSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const engine = new BABYLON.Engine(canvasRef.current, true, {
      antialias: true,
      preserveDrawingBuffer: true,
    });

    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.06, 0.09, 0.18, 1);

    const camera = new BABYLON.ArcRotateCamera(
      'dashboard-camera',
      Math.PI / 2.2,
      Math.PI / 2.6,
      10,
      BABYLON.Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.upperBetaLimit = Math.PI / 2.2;
    camera.lowerRadiusLimit = 6;
    camera.upperRadiusLimit = 12;
    camera.wheelPrecision = 60;

    const hemiLight = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.9;
    hemiLight.diffuse = new BABYLON.Color3(0.8, 0.9, 1);

    const spotLight = new BABYLON.SpotLight(
      'spot',
      new BABYLON.Vector3(0, 10, 0),
      new BABYLON.Vector3(0, -1, 0),
      Math.PI / 2,
      25,
      scene
    );
    spotLight.intensity = 0.6;

    const glow = new BABYLON.GlowLayer('glow', scene, { blurKernelSize: 32 });
    glow.intensity = 0.4;

    const floor = BABYLON.MeshBuilder.CreateGround(
      'ground',
      { width: 20, height: 20, subdivisions: 2 },
      scene
    );
    floor.position.y = -2.5;
    const floorMaterial = new BABYLON.StandardMaterial('floorMat', scene);
    floorMaterial.diffuseColor = new BABYLON.Color3(0.06, 0.08, 0.16);
    floorMaterial.specularColor = new BABYLON.Color3(0.1, 0.2, 0.5);
    floorMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.25);
    floorMaterial.alpha = 0.9;
    floor.material = floorMaterial;

    const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 2.2, segments: 32 }, scene);
    sphere.position = new BABYLON.Vector3(-3.5, 0.8, 0);
    const sphereMaterial = new BABYLON.StandardMaterial('sphereMat', scene);
    sphereMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.6, 1);
    sphereMaterial.emissiveColor = new BABYLON.Color3(0.08, 0.4, 0.9);
    sphere.material = sphereMaterial;

    const box = BABYLON.MeshBuilder.CreateBox('box', { size: 2 }, scene);
    box.position = new BABYLON.Vector3(3.5, 0.5, 0);
    const boxMaterial = new BABYLON.StandardMaterial('boxMat', scene);
    boxMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.4, 0.8);
    boxMaterial.emissiveColor = new BABYLON.Color3(0.6, 0.2, 0.7);
    box.material = boxMaterial;

    const ring = BABYLON.MeshBuilder.CreateTorus('ring', { diameter: 4.4, thickness: 0.35 }, scene);
    ring.position = new BABYLON.Vector3(0, 0.6, 0);
    const ringMaterial = new BABYLON.StandardMaterial('ringMat', scene);
    ringMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.85, 0.7);
    ringMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.6, 0.5);
    ring.material = ringMaterial;

    const particles = new BABYLON.ParticleSystem('particles', 1000, scene);
    particles.particleTexture = new BABYLON.Texture(
      'https://assets.babylonjs.com/textures/flare.png',
      scene
    );
    particles.emitter = new BABYLON.Vector3(0, 0, 0);
    particles.minEmitBox = new BABYLON.Vector3(-5, -1, -5);
    particles.maxEmitBox = new BABYLON.Vector3(5, 5, 5);
    particles.color1 = new BABYLON.Color4(0.25, 0.6, 1, 0.9);
    particles.color2 = new BABYLON.Color4(0.9, 0.4, 1, 0.9);
    particles.minSize = 0.05;
    particles.maxSize = 0.2;
    particles.addVelocityGradient(0, 0.05);
    particles.addVelocityGradient(1, 0.02);
    particles.emitRate = 250;
    particles.start();

    scene.onBeforeRenderObservable.add(() => {
      const delta = engine.getDeltaTime() * 0.0015;
      sphere.rotation.y += delta;
      sphere.position.y = Math.sin(scene.getEngine().getDeltaTime() * 0.0025) * 0.4 + 0.8;

      box.rotation.x += delta * 1.2;
      box.rotation.y += delta * 1.4;
      box.position.y = Math.cos(scene.getEngine().getDeltaTime() * 0.002) * 0.3 + 0.5;

      ring.rotation.z += delta * 0.6;
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
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary-900/10 via-transparent to-blue-500/20" />
    </div>
  );
}



