import { Environment, OrbitControls } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { Book } from "./Book";
import { useState, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { pageAtom } from "./UI";

export const Experience = ({ bookData }) => {
  const [isAnimating, setIsAnimating] = useState(true);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [page] = useAtom(pageAtom);
  const { viewport } = useThree();
  const bookRef = useRef();
  const initialRenderRef = useRef(true);
  const floatRef = useRef();
  
  // Calculate responsive book scale based on viewport - REDUCED SCALE TO KEEP IN VIEWPORT
  const getBookScale = () => {
    // Slightly reduced scale to prevent overflow
    const baseScale = 1.65; // Reduced from 1.9
    
    // For mobile screens (portrait orientation)
    if (viewport.width < viewport.height && viewport.width < 5) {
      return baseScale * 0.95; // Reduced from 1.1
    }
    
    // For larger screens
    if (viewport.width > 10) {
      return baseScale * 1.3; // Reduced from 1.4
    }
    
    return baseScale;
  };
  
  // Use a gentle idle animation with MORE UPRIGHT ANGLE
  useFrame((_, delta) => {
    if (!isAnimating || !floatRef.current) return;
    
    const time = Date.now() / 2000;
    const gentleMovement = Math.sin(time) * 0.03;
    
    if (floatRef.current.rotation) {
      // Even more upright position for better fit on screen
      floatRef.current.rotation.x = -Math.PI / 9 + gentleMovement * 0.1; // Changed from PI/7 to PI/9
      // Lower Y position to keep in viewport
      floatRef.current.position.y = 0.1 + gentleMovement; // Changed from 0.5 to 0.1
    }
  });
  
  // Re-enable animation on page change
  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }
    setIsAnimating(true);
    setLastInteractionTime(Date.now());
    
    // Set a timeout to reduce animation after initial page turn
    const timeoutId = setTimeout(() => {
      setIsAnimating(false);
    }, 1500);
    
    return () => clearTimeout(timeoutId);
  }, [page]);
  
  // Handle user interaction
  const handleInteraction = () => {
    setIsAnimating(true);
    setLastInteractionTime(Date.now());
  };

  // Initial layout calculations
  const scale = getBookScale();
  // MORE UPRIGHT ANGLE - for better fit on screen
  const rotation = [-Math.PI / 9, 0, 0]; // Changed from PI/7 to PI/9
  // Lower position to keep book in viewport
  const position = [0, 0.0, 0]; // Changed Y from 0.5 to 0.0
  
  return (
    <>
      <group
        ref={floatRef}
        rotation={rotation}
        position={position}
        scale={scale}
        onClick={handleInteraction}
      >
        <Book bookData={bookData} />
      </group>
      
      <OrbitControls 
        enabled={false}
        onChange={handleInteraction}
      />
      
      <Environment preset="studio"></Environment>
      
      <directionalLight
        position={[2, 5, 2]}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      
      <mesh position-y={-1.5} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>
    </>
  );
};