import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import { CameraController } from './CameraController'
import { use3DNavigation } from '@/hooks/use3DNavigation'
import { useSceneStore } from '@/store/sceneStore'

interface PortfolioSceneProps {
  initialCameraPosition?: [number, number, number]
  performanceMode?: 'auto' | 'high' | 'medium' | 'low'
  onSceneReady?: () => void
}

function SceneContent({ onSceneReady }: { onSceneReady?: () => void }) {
  useEffect(() => {
    if (onSceneReady) {
      const timer = setTimeout(() => {
        onSceneReady()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [onSceneReady])

  return (
    <>
      {/* Camera Controls */}
      <CameraController 
        enabled={true}
        movementSpeed={10}
        lookSpeed={2}
      />
      
      {/* Ambient lighting for dark space environment */}
      <ambientLight intensity={0.1} color="#1a1a2e" />
      <pointLight position={[10, 10, 10]} intensity={0.3} color="#4a4a8a" />
      
      {/* Dark space environment */}
      <mesh>
        <sphereGeometry args={[1000, 60, 40]} />
        <meshBasicMaterial color="#000011" side={2} />
      </mesh>
    </>
  )
}

function LoadingFallback() {
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: '#ffffff',
      fontFamily: 'monospace'
    }}>
      Loading 3D Environment...
    </div>
  )
}

export function PortfolioScene({
  initialCameraPosition = [0, 0, 5],
  performanceMode = 'auto',
  onSceneReady
}: PortfolioSceneProps) {
  const [isLoading, setIsLoading] = useState(true)
  const { navigationState, setPerformanceMode, getPerformanceSettings } = use3DNavigation()
  
  // Scene store
  const sceneState = useSceneStore()
  const { 
    setLoaded, 
    initializeDefaults, 
    updateFPS, 
    updateAverageFPS, 
    setError
  } = useSceneStore()

  // Initialize scene store defaults
  useEffect(() => {
    initializeDefaults()
  }, [initializeDefaults])

  // Set initial performance mode
  useEffect(() => {
    setPerformanceMode(performanceMode)
    sceneState.setPerformanceMode(performanceMode)
  }, [performanceMode, setPerformanceMode, sceneState])

  // Sync performance data with scene store
  useEffect(() => {
    updateFPS(navigationState.fps)
    updateAverageFPS(navigationState.fps) // Using current as average for now
  }, [navigationState.fps, updateFPS, updateAverageFPS])

  // Check WebGL support
  useEffect(() => {
    if (!navigationState.isWebGLSupported) {
      const errorMsg = 'WebGL is not supported on this device/browser'
      console.error(errorMsg)
      setError(errorMsg)
    } else {
      setError(null)
    }
  }, [navigationState.isWebGLSupported, setError])

  const handleSceneReady = useCallback(() => {
    setIsLoading(false)
    setLoaded(true)
    if (onSceneReady) {
      onSceneReady()
    }
  }, [onSceneReady, setLoaded])

  const currentSettings = getPerformanceSettings()

  // Debug display
  const showDebug = import.meta.env.VITE_DEBUG_ENABLED === 'true'

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      {isLoading && <LoadingFallback />}
      
      {/* Performance Debug Info */}
      {showDebug && !isLoading && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: '12px',
          background: 'rgba(0,0,0,0.7)',
          padding: '10px',
          borderRadius: '4px',
          zIndex: 1000
        }}>
          <div>FPS: {Math.round(navigationState.fps)}</div>
          <div>Mode: {sceneState.performanceMode}</div>
          <div>Frame Time: {navigationState.frameTime.toFixed(2)}ms</div>
          {navigationState.memoryUsage && (
            <div>Memory: {navigationState.memoryUsage.toFixed(1)}MB</div>
          )}
          <div>WebGL2: {navigationState.webglInfo.webgl2 ? 'Yes' : 'No'}</div>
          <div>Zone: {sceneState.currentZone}</div>
          <div>Loaded: {sceneState.loaded ? 'Yes' : 'No'}</div>
          <div>Position: {sceneState.userPosition.x.toFixed(1)}, {sceneState.userPosition.y.toFixed(1)}, {sceneState.userPosition.z.toFixed(1)}</div>
        </div>
      )}
      
      <Canvas
        camera={{ 
          position: initialCameraPosition,
          fov: 75,
          near: 0.1,
          far: 2000
        }}
        gl={{
          antialias: currentSettings.antialias,
          alpha: true,
          toneMapping: ACESFilmicToneMapping,
          outputColorSpace: SRGBColorSpace
        }}
        dpr={currentSettings.renderScale}
        style={{ 
          display: 'block',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.5s ease-in-out'
        }}
      >
        <Suspense fallback={null}>
          <SceneContent onSceneReady={handleSceneReady} />
        </Suspense>
      </Canvas>
    </div>
  )
}