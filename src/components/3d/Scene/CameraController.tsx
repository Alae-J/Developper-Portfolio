import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useSceneStore } from '@/store/sceneStore'

interface CameraControllerProps {
  enabled?: boolean
  movementSpeed?: number
  lookSpeed?: number
}

export function CameraController({
  enabled = true,
  movementSpeed = 10,
  lookSpeed = 2
}: CameraControllerProps) {
  const { camera, gl } = useThree()
  const { updateUserPosition, updateCameraRotation, setIsNavigating, updateLastInteractionTime } = useSceneStore()
  
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false
  })
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isMouseDown, setIsMouseDown] = useState(false)
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  const lastPosition = useRef(new THREE.Vector3())

  // Handle keyboard input
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = true
          break
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = true
          break
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = true
          break
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = true
          break
        case 'Space':
          event.preventDefault()
          keys.current.up = true
          break
        case 'ShiftLeft':
        case 'ShiftRight':
          keys.current.down = true
          break
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = false
          break
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = false
          break
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = false
          break
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = false
          break
        case 'Space':
          keys.current.up = false
          break
        case 'ShiftLeft':
        case 'ShiftRight':
          keys.current.down = false
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [enabled])

  // Handle mouse input
  useEffect(() => {
    if (!enabled) return

    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDown) return
      
      const movementX = event.movementX || 0
      const movementY = event.movementY || 0
      
      setMousePos(prev => ({
        x: prev.x + movementX * lookSpeed * 0.002,
        y: prev.y + movementY * lookSpeed * 0.002
      }))
    }

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0) { // Left click
        setIsMouseDown(true)
        gl.domElement.requestPointerLock()
      }
    }

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 0) {
        setIsMouseDown(false)
        document.exitPointerLock()
      }
    }

    const canvas = gl.domElement
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mouseup', handleMouseUp)

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mouseup', handleMouseUp)
    }
  }, [enabled, isMouseDown, lookSpeed, gl])

  // Handle touch input for mobile
  useEffect(() => {
    if (!enabled) return

    let touchStart = { x: 0, y: 0 }
    let isTouching = false

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      touchStart = { x: touch.clientX, y: touch.clientY }
      isTouching = true
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!isTouching) return
      event.preventDefault()
      
      const touch = event.touches[0]
      const deltaX = touch.clientX - touchStart.x
      const deltaY = touch.clientY - touchStart.y
      
      setMousePos(prev => ({
        x: prev.x + deltaX * lookSpeed * 0.001,
        y: prev.y + deltaY * lookSpeed * 0.001
      }))
      
      touchStart = { x: touch.clientX, y: touch.clientY }
    }

    const handleTouchEnd = () => {
      isTouching = false
    }

    const canvas = gl.domElement
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, lookSpeed, gl])

  // Update camera position and rotation each frame
  useFrame((state, delta) => {
    if (!enabled) return

    // Apply mouse look
    camera.rotation.y = -mousePos.x
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, -mousePos.y))
    
    // Update rotation in scene store
    updateCameraRotation({ x: camera.rotation.x, y: camera.rotation.y })

    // Calculate movement direction
    direction.current.set(0, 0, 0)
    
    if (keys.current.forward) direction.current.z -= 1
    if (keys.current.backward) direction.current.z += 1
    if (keys.current.left) direction.current.x -= 1
    if (keys.current.right) direction.current.x += 1
    if (keys.current.up) direction.current.y += 1
    if (keys.current.down) direction.current.y -= 1

    // Check if user is actively moving
    const isMoving = direction.current.length() > 0
    const isRotating = isMouseDown
    const isNavigatingNow = isMoving || isRotating
    
    setIsNavigating(isNavigatingNow)
    
    if (isNavigatingNow) {
      updateLastInteractionTime()
    }

    // Normalize and apply to camera-relative direction
    if (isMoving) {
      direction.current.normalize()
      
      // Transform direction based on camera rotation
      const cameraDirection = new THREE.Vector3()
      camera.getWorldDirection(cameraDirection)
      
      const right = new THREE.Vector3()
      right.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0)).normalize()
      
      const forward = new THREE.Vector3()
      forward.crossVectors(new THREE.Vector3(0, 1, 0), right).normalize()
      
      velocity.current.set(0, 0, 0)
      velocity.current.addScaledVector(right, direction.current.x)
      velocity.current.addScaledVector(new THREE.Vector3(0, 1, 0), direction.current.y)
      velocity.current.addScaledVector(forward, -direction.current.z)
      
      velocity.current.multiplyScalar(movementSpeed * delta)
      camera.position.add(velocity.current)
    }

    // Basic collision boundaries
    camera.position.y = Math.max(0.5, camera.position.y)
    camera.position.y = Math.min(50, camera.position.y)
    
    const maxDistance = 100
    if (camera.position.length() > maxDistance) {
      camera.position.normalize().multiplyScalar(maxDistance)
    }
    
    // Update position in scene store if it changed significantly
    if (!lastPosition.current.equals(camera.position)) {
      const distance = lastPosition.current.distanceTo(camera.position)
      if (distance > 0.1) { // Only update if moved more than 0.1 units
        updateUserPosition(camera.position)
        lastPosition.current.copy(camera.position)
      }
    }
  })

  return null
}