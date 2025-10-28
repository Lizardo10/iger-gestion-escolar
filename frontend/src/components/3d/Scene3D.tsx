import { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

interface Scene3DProps {
  modelUrl: string;
  onLoadProgress?: (progress: number) => void;
  className?: string;
}

export function Scene3D({ modelUrl, onLoadProgress, className = '' }: Scene3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      const engine = new BABYLON.Engine(canvasRef.current, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        antialias: true,
        powerPreference: 'high-performance',
      });

      const scene = new BABYLON.Scene(engine);

      // Configurar cámara
      const camera = new BABYLON.ArcRotateCamera(
        'camera',
        Math.PI / 2,
        Math.PI / 2.5,
        3,
        BABYLON.Vector3.Zero(),
        scene
      );
      camera.attachControl(canvasRef.current, true);

      // Configurar luces
      const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
      light.intensity = 1.0;

      // Cargar modelo con progreso
      BABYLON.SceneLoader.LoadAssetContainerAsync(
        '',
        modelUrl,
        scene,
        (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onLoadProgress?.(progress);
          }
        }
      )
        .then((container) => {
          container.addAllToScene();
          setLoading(false);

          // Optimizaciones post-carga
          scene.meshes.forEach((mesh) => {
            mesh.isPickable = false;
            if (mesh.material) {
              mesh.material.freeze();
            }
          });
        })
        .catch((err) => {
          console.error('Error loading 3D model:', err);
          setError('Error al cargar modelo 3D');
          setLoading(false);
        });

      // Render loop
      let frameCount = 0;
      engine.runRenderLoop(() => {
        frameCount++;
        // Reducir FPS en móvil si es necesario
        if (frameCount % 2 === 0 || !isMobile()) {
          scene.render();
        }
      });

      // Manejar resize
      const handleResize = () => engine.resize();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        scene.dispose();
        engine.dispose();
      };
    } catch (err) {
      setError('Error al inicializar escena 3D');
      setLoading(false);
    }
  }, [modelUrl, onLoadProgress]);

  function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={{ minHeight: '400px' }}>
        <div className="text-center text-gray-600">
          <p className="text-red-600 mb-2">⚠️ {error}</p>
          <p className="text-sm">Sin soporte 3D en este dispositivo</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ minHeight: '400px' }}>
      <canvas ref={canvasRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <div>Cargando modelo 3D...</div>
          </div>
        </div>
      )}
    </div>
  );
}


