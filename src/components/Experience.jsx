import { Environment, OrbitControls } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { Book } from "./Book";
import { useState, useEffect, useRef, useMemo } from "react";  // Add useMemo here
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
  
  // Add state to track orientation
  const [isLandscape, setIsLandscape] = useState(false);

  // Define windowWidth for use in the dependency array
  const windowWidth = viewport.width;

  // Add a check for Hebrew content
  const isHebrewBook = bookData && bookData.pages && bookData.pages.length > 0 && 
    ((bookData.pages[0].front && bookData.pages[0].front.language === 'hebrew') || 
     (bookData.pages[0].back && bookData.pages[0].back.language === 'hebrew'));
  
  // Adjust camera position and other settings based on RTL
  const cameraPosition = useMemo(() => {
    const defaultPosition = [-0.25, 0.0, 7.2]; // Your existing camera position
    
    // For RTL books, mirror the X position
    return isHebrewBook 
      ? [defaultPosition[0] * -1, defaultPosition[1], defaultPosition[2]]
      : defaultPosition;
  }, [windowWidth, isHebrewBook]);


  // Update orientation state based on viewport
  useEffect(() => {
    setIsLandscape(viewport.width > viewport.height);
  }, [viewport.width, viewport.height]);
  
  // Calculate responsive book scale based on viewport - ENHANCED FOR LANDSCAPE MODE
  const getBookScale = () => {
    // Base scale
    const baseScale = 1.65;
    
    // Landscape orientation on mobile - needs to be smaller
    if (isLandscape && viewport.height < 5) {
      return baseScale * 0.7; // Much smaller in mobile landscape
    }
    
    // Portrait orientation on mobile
    if (!isLandscape && viewport.width < 5) {
      return baseScale * 0.88; // Slightly reduced for portrait
    }
    
    // For larger screens
    if (viewport.width > 10) {
      return baseScale * 1.25;
    }
    
    return baseScale;
  };
  
  // Use a gentler idle animation for landscape mode
  useFrame((_, delta) => {
    if (!isAnimating || !floatRef.current) return;
    
    const time = Date.now() / 2000;
    const gentleMovement = Math.sin(time) * 0.03;
    
    if (floatRef.current.rotation) {
      // More upright position in landscape mode
      const xRotation = isLandscape 
        ? -Math.PI / 12 + gentleMovement * 0.1  // More upright in landscape
        : -Math.PI / 9 + gentleMovement * 0.1;  // Standard in portrait
      
      floatRef.current.rotation.x = xRotation;
      
      // Position adjustments for orientation
      const yPosition = isLandscape
        ? -0.3 + gentleMovement  // Lower in landscape
        : 0.1 + gentleMovement;  // Standard in portrait
      
      floatRef.current.position.y = yPosition;
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

  // Adjust positioning based on orientation
  const rotation = isLandscape 
    ? [-Math.PI / 12, 0, 0] // More upright in landscape
    : [-Math.PI / 11, 0, 0]; // Standard in portrait
  
  const position = isLandscape
    ? [0, -0.3, 0] // Lower in landscape
    : [0, -0.2, 0]; // Standard in portrait
  
  return (
    <>
      <group
        ref={floatRef}
        rotation={rotation}
        position={position}
        scale={scale}
        onClick={handleInteraction}
        className={isHebrewBook ? "hebrew-book-container" : ""}
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