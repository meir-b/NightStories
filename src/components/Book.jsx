import { useCursor, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useAtom } from "jotai";
import { easing } from "maath";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bone,
  BoxGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  MathUtils,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  SRGBColorSpace,
  Uint16BufferAttribute,
  Vector3,
} from "three";
import { degToRad } from "three/src/math/MathUtils.js";
// Import only pageAtom, not pages
import { pageAtom } from "./UI";
import { atom } from "jotai";

export const zoomPageAtom = atom({ isZoomed: false, pageData: null });


const easingFactor = 0.5; // Controls the speed of the easing
const easingFactorFold = 0.3; // Controls the speed of the easing
const insideCurveStrength = 0.18; // Controls the strength of the curve
const outsideCurveStrength = 0.05; // Controls the strength of the curve
const turningCurveStrength = 0.09; // Controls the strength of the curve

const PAGE_WIDTH = 1.28;
const PAGE_HEIGHT = 1.71; // 4:3 aspect ratio
const PAGE_DEPTH = 0.003;
const PAGE_SEGMENTS = 30;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

const pageGeometry = new BoxGeometry(
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_DEPTH,
  PAGE_SEGMENTS,
  2
);

pageGeometry.translate(PAGE_WIDTH / 2, 0, 0);

const position = pageGeometry.attributes.position;
const vertex = new Vector3();
const skinIndexes = [];
const skinWeights = [];

for (let i = 0; i < position.count; i++) {
  // ALL VERTICES
  vertex.fromBufferAttribute(position, i); // get the vertex
  const x = vertex.x; // get the x position of the vertex

  const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH)); // calculate the skin index
  let skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH; // calculate the skin weight

  skinIndexes.push(skinIndex, skinIndex + 1, 0, 0); // set the skin indexes
  skinWeights.push(1 - skinWeight, skinWeight, 0, 0); // set the skin weights
}

pageGeometry.setAttribute(
  "skinIndex",
  new Uint16BufferAttribute(skinIndexes, 4)
);
pageGeometry.setAttribute(
  "skinWeight",
  new Float32BufferAttribute(skinWeights, 4)
);

const whiteColor = new Color("white");
const emissiveColor = new Color("orange");

const pageMaterials = [
  new MeshStandardMaterial({
    color: whiteColor,
  }),
  new MeshStandardMaterial({
    color: "#111",
  }),
  new MeshStandardMaterial({
    color: whiteColor,
  }),
  new MeshStandardMaterial({
    color: whiteColor,
  }),
];

// Modify the createTextTexture function for better mobile readability

const createTextTexture = (textData) => {
  const canvas = document.createElement('canvas');
  canvas.width = 2048; 
  canvas.height = 2732;
  const ctx = canvas.getContext('2d');
  
  // Background color - slightly lighter for better contrast on mobile
  ctx.fillStyle = textData.bgColor || '#1e2a45'; // Slightly lighter than original #192339
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add border - thicker for better visibility on mobile
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 12; // Increased from 8
  ctx.strokeRect(80, 80, canvas.width-160, canvas.height-160);
  
  // Decorative elements remain the same
  // (code for corners remains unchanged)
  
  // Check if content is in Hebrew
  const isHebrew = textData.language === 'hebrew';
  
  // Configure text direction and alignment
  ctx.textAlign = isHebrew ? 'right' : 'center';
  ctx.direction = isHebrew ? 'rtl' : 'ltr';
  
  // Font family based on language
  const fontFamily = isHebrew ? '"Heebo"' : '"Comic Sans MS", "Poppins"';
  const textStartX = isHebrew ? canvas.width - 160 : canvas.width/2;
  
  // Determine starting Y position based on whether there's a title
  let startY = 300; // Default if no title or subtitle
  
  // Title - with enhanced visibility for mobile
  if (textData.content.title) {
    // Create a stronger highlight behind the title
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; // Darker background for better contrast
    ctx.fillRect(canvas.width/2 - 700, 200, 1400, 160);
    
    // Draw the title text - larger and bolder
    ctx.font = `bold 150px ${fontFamily}, sans-serif`; // Increased from 128px
    ctx.fillStyle = '#ffdc8f';
    
    // Enhanced shadow for better readability on all devices
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 15; // Increased from 12
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    
    ctx.fillText(textData.content.title, textStartX, 320);
    
    // Reset shadow
    ctx.shadowColor = 'rgba(0,0,0,0)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Decorative line - thicker and more visible
    if (isHebrew) {
      ctx.font = `bold 150px ${fontFamily}, sans-serif`; // Increased from 140px
      ctx.beginPath();
      ctx.moveTo(textStartX - 600, 400);
      ctx.lineTo(textStartX, 400);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 6; // Increased from 4
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(textStartX - 500, 400);
      ctx.lineTo(textStartX + 500, 400);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 6; // Increased from 4
      ctx.stroke(); 
    }
    
    startY = 600; // Start text lower if there's a title
  }
  
  // Subtitle - larger for mobile
  if (textData.content.subtitle) {
    ctx.font = `italic 90px ${fontFamily}, sans-serif`; // Increased from 80px
    ctx.fillStyle = '#f0e6a6';
    ctx.fillText(textData.content.subtitle, textStartX, 520);
    startY = 700; // Start text even lower if there's also a subtitle
  }
  
  // Main text - SIGNIFICANTLY larger for mobile readability
  if (textData.content.text) {
    // Much larger text for better mobile readability
    ctx.font = `90px ${fontFamily}, sans-serif`; // Increased from 80px
    ctx.fillStyle = '#ffffff';
    
    if (isHebrew) {
      // Handle RTL text rendering with enhanced readability
      const lines = [];
      const words = textData.content.text.split(' ');
      let line = '';
      const maxWidth = canvas.width - 280; // Slightly wider text area
      
      // Break text into lines
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && i > 0) {
          lines.push(line.trim());
          line = words[i] + ' ';
        } else {
          line = testLine;
        }
      }
      
      lines.push(line.trim());
      
      // Draw text with stronger contrasting background
      let y = startY;
      const lineHeight = 120; // Increased from 112
      
      // Draw darker backgrounds behind each line for better contrast
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; // Increased opacity from 0.4
      for (const line of lines) {
        const lineWidth = ctx.measureText(line).width;
        ctx.fillRect(textStartX - lineWidth - 30, y - 90, lineWidth + 60, 122); // Larger background
        y += lineHeight;
      }
      
      // Reset y position and draw the text
      y = startY;
      ctx.fillStyle = '#ffffff';
      for (const line of lines) {
        // Enhanced shadow for better readability
        ctx.shadowColor = 'rgba(0,0,0,0.9)'; // Stronger shadow
        ctx.shadowBlur = 8; // Increased from 6
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        ctx.fillText(line, textStartX, y);
        y += lineHeight;
      }
      
    } else {
      // LTR text handling with larger text
      const words = textData.content.text.split(' ');
      let line = '';
      let y = startY;
      const maxWidth = canvas.width - 280; // Slightly wider text area
      const lineHeight = 120; // Increased from 112
      
      const lines = [];
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && i > 0) {
          lines.push(line.trim());
          line = words[i] + ' ';
        } else {
          line = testLine;
        }
      }
      
      lines.push(line.trim());
      
      // Draw darker backgrounds for better contrast
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; // Increased opacity from 0.4
      for (let i = 0; i < lines.length; i++) {
        ctx.fillRect(textStartX - 720, y - 90 + (i * lineHeight), 1440, 122); // Wider background
      }
      
      // Draw text with enhanced shadow
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; // Stronger shadow
      ctx.shadowBlur = 8; // Increased from 6
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      
      for (const line of lines) {
        ctx.fillText(line, textStartX, y);
        y += lineHeight;
      }
    }
    
    // Reset shadow
    ctx.shadowColor = 'rgba(0,0,0,0)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
  
  return canvas;
};
const GetPath = (bookId, src) => {
  if (!src) return null;
  
  // Use import.meta.env.BASE_URL for GitHub Pages
  const basePath = import.meta.env.BASE_URL || '/';
  
  if (src.includes(".")) {
    return `${basePath}Content/${bookId}/textures/${src}`;
  }
  return `${basePath}Content/${bookId}/textures/${src}.jpg`;
}


// Update the Page component to use bookId
const Page = ({ bookId, number, front, back, page, opened, bookClosed, pagesLength, ...props }) => {
  // Create textures based on content type
  const frontTexture = useMemo(() => {
    if (front.type === "text") {
      const canvas = createTextTexture(front);
      const texture = new CanvasTexture(canvas);
      texture.colorSpace = SRGBColorSpace;
      return texture;
    }
    return null;
  }, [front]);
  
  const backTexture = useMemo(() => {
    if (back.type === "text") {
      const canvas = createTextTexture(back);
      const texture = new CanvasTexture(canvas);
      texture.colorSpace = SRGBColorSpace;
      return texture;
    }
    return null;
  }, [back]);

  // Load image textures if needed using the bookId
  const textures = useTexture(
    [
      front.type === "photo" ? GetPath(bookId, front.src) : null,
      back.type === "photo" ? GetPath(bookId, back.src) : null,
    ].filter(Boolean)
  );

  // Assign the appropriate textures
  const picture = front.type === "photo" ? textures[0] : frontTexture;
  const picture2 = back.type === "photo" 
    ? front.type === "photo" ? textures[1] : textures[0] 
    : backTexture;

  if (picture) picture.colorSpace = SRGBColorSpace;
  if (picture2) picture2.colorSpace = SRGBColorSpace;
    
  const group = useRef();
  const turnedAt = useRef(0);
  const lastOpened = useRef(opened);
  const skinnedMeshRef = useRef();

  const manualSkinnedMesh = useMemo(() => {
    const bones = [];
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      let bone = new Bone();
      bones.push(bone);
      if (i === 0) {
        bone.position.x = 0;
      } else {
        bone.position.x = SEGMENT_WIDTH;
      }
      if (i > 0) {
        bones[i - 1].add(bone); // attach the new bone to the previous bone
      }
    }
    const skeleton = new Skeleton(bones);

    const materials = [
      ...pageMaterials,
      new MeshStandardMaterial({
        color: whiteColor,
        map: picture,
        // Replaced roughness map with fixed roughness value
        roughness: number === 0 ? 0.3 : 0.1,
        emissive: emissiveColor,
        emissiveIntensity: 0,
      }),
      new MeshStandardMaterial({
        color: whiteColor,
        map: picture2,
        // Fixed - Use pagesLength instead of pages.length
        roughness: number === pagesLength - 1 ? 0.3 : 0.1,
        emissive: emissiveColor,
        emissiveIntensity: 0,
      }),
    ];
    const mesh = new SkinnedMesh(pageGeometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.add(skeleton.bones[0]);
    mesh.bind(skeleton);
    return mesh;
  }, []);

  useFrame((_, delta) => {
    if (!skinnedMeshRef.current) {
      return;
    }
  
    // Always ensure animation continues
    requestAnimationFrame(() => {});
  
    const emissiveIntensity = highlighted ? 0.22 : 0;
    skinnedMeshRef.current.material[4].emissiveIntensity =
      skinnedMeshRef.current.material[5].emissiveIntensity = MathUtils.lerp(
        skinnedMeshRef.current.material[4].emissiveIntensity,
        emissiveIntensity,
        0.1
      );
  
    if (lastOpened.current !== opened) {
      turnedAt.current = +new Date();
      lastOpened.current = opened;
    }
    let turningTime = Math.min(400, new Date() - turnedAt.current) / 400;
    turningTime = Math.sin(turningTime * Math.PI);

    let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
    if (!bookClosed) {
      targetRotation += degToRad(number * 0.8);
    }

    const bones = skinnedMeshRef.current.skeleton.bones;
    for (let i = 0; i < bones.length; i++) {
      const target = i === 0 ? group.current : bones[i];

      const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0;
      const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0;
      const turningIntensity =
        Math.sin(i * Math.PI * (1 / bones.length)) * turningTime;
      let rotationAngle =
        insideCurveStrength * insideCurveIntensity * targetRotation -
        outsideCurveStrength * outsideCurveIntensity * targetRotation +
        turningCurveStrength * turningIntensity * targetRotation;
      let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2);
      if (bookClosed) {
        if (i === 0) {
          rotationAngle = targetRotation;
          foldRotationAngle = 0;
        } else {
          rotationAngle = 0;
          foldRotationAngle = 0;
        }
      }
      easing.dampAngle(
        target.rotation,
        "y",
        rotationAngle,
        easingFactor,
        delta
      );

      const foldIntensity =
        i > 8
          ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime
          : 0;
      easing.dampAngle(
        target.rotation,
        "x",
        foldRotationAngle * foldIntensity,
        easingFactorFold,
        delta
      );
    }
  });

 // Improve zoom detection with proper state
 const [_, setPage] = useAtom(pageAtom);
 const [, setZoomPage] = useAtom(zoomPageAtom);
 const [highlighted, setHighlighted] = useState(false);
 const [clickCount, setClickCount] = useState(0);
 useCursor(highlighted);

 // Refs for timing
 const lastTapTimeRef = useRef(0);
 const clickTimeoutRef = useRef(null);

 // Calculate which side of the page is currently visible based on opened state
  // For pages in the middle of the book, this determines whether front or back is shown
  const visibleSide = useMemo(() => {
    if (opened) {
      // When page is turned/opened
      return 'back'; // The back side is visible
    } else {
      // When page is not turned/opened
      return 'front'; // The front side is visible
    }
  }, [opened]);

  // Check if current visible side has text content that can be zoomed
  const hasZoomableContent = useMemo(() => {
    if (visibleSide === 'front' && front.type === "text") return true;
    if (visibleSide === 'back' && back.type === "text") return true;
    return false;
  }, [visibleSide, front.type, back.type]);

  // Get the currently visible text content for zooming
  const zoomContent = useMemo(() => {
    if (visibleSide === 'front' && front.type === "text") return front;
    if (visibleSide === 'back' && back.type === "text") return back;
    return null;
  }, [visibleSide, front, back]);

 // Improved handle click with better detection for both mobile and desktop
 const handleClick = (e) => {
   e.stopPropagation();
   
   const now = Date.now();
   const DOUBLE_TAP_DELAY = 500; // Increased from 300ms for more reliable detection
   
   // For mobile: detect double tap
   if (now - lastTapTimeRef.current < DOUBLE_TAP_DELAY) {
     // This is a double-tap/click
     handleZoom();
     // Reset
     lastTapTimeRef.current = 0;
     clearTimeout(clickTimeoutRef.current);
     return;
   }
   
   // For desktop: track clicks and use setTimeout
   lastTapTimeRef.current = now;
   
   // Use timeout to differentiate between single and double click
   clearTimeout(clickTimeoutRef.current);
   clickTimeoutRef.current = setTimeout(() => {
     // This was a single click - handle page turn
     handlePageTurn();
   }, 300);
 };

 // Dedicated zoom handler
 const handleZoom = () => {
  if (hasZoomableContent && zoomContent) {
    console.log(`Zooming in on ${visibleSide} text content for page ${number}`);
    setZoomPage({ isZoomed: true, pageData: zoomContent });
    setHighlighted(false);
  }
};
 
 // Dedicated page turn handler
 const handlePageTurn = () => {
   // Single tap - handle page turning with proper RTL support
   let pageToSet;
   
   pageToSet = opened ? number : number + 1;
   
   // Ensure we don't go past the first or last page
   pageToSet = Math.min(Math.max(0, pageToSet), pagesLength);
   
   setPage(pageToSet);
   setHighlighted(false);
 };

 // Add explicit double click handler for desktop
 const handleDoubleClick = (e) => {
   e.stopPropagation();
   e.preventDefault();
   clearTimeout(clickTimeoutRef.current);
   handleZoom();
 };

 // Clean up timeouts when component unmounts
 useEffect(() => {
   return () => {
     clearTimeout(clickTimeoutRef.current);
   };
 }, []);
 
 return (
  <group
    {...props}
    ref={group}
    onPointerEnter={(e) => {
      e.stopPropagation();
      setHighlighted(true);
    }}
    onPointerLeave={(e) => {
      e.stopPropagation();
      setHighlighted(false);
    }}
    onClick={handleClick}
    onDoubleClick={handleDoubleClick}
  >
    <primitive
      object={manualSkinnedMesh}
      ref={skinnedMeshRef}
      position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
    />

    {/* Enhanced zoom indicator for text pages - more visible and only shows for visible text content */}
    {hasZoomableContent && highlighted && (
      <group position={[PAGE_WIDTH - 0.2, PAGE_HEIGHT - 0.2, 0.01]} onClick={(e) => {
        e.stopPropagation();
        handleZoom(); // Direct zoom when clicking the indicator
      }}>
        {/* Add a backing circle for better visibility */}
        <mesh>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#000000" opacity={0.5} transparent />
        </mesh>
        
        {/* Main indicator with pulsing effect */}
        <mesh>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial 
            color="#e2c87d" 
            emissive="#d4af37" 
            emissiveIntensity={0.5 + Math.sin(Date.now() * 0.005) * 0.3} 
          />
        </mesh>
        
        {/* Add a zoom icon inside */}
        <mesh rotation={[0, 0, Math.PI/4]} position={[0, 0, 0.02]}>
          <boxGeometry args={[0.03, 0.01, 0.001]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[0.01, 0.03, 0.001]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    )}
  </group>
);
};

export const Book = ({ bookData, ...props }) => {
  // Initialize page state with the appropriate starting position
  const initializeBookPosition = () => {
    // Check if book has a specific starting position in manifest
    if (bookData.startFromBack) {
      // Return the last page (pages.length for back cover)
      return bookData.pages?.length || 0;
    }
    
    // Default starting position is the front (0)
    return 0;
  };

  // Use the initializer function when setting up atom state
  const [page, setPage] = useAtom(pageAtom, {
    init: () => initializeBookPosition()
  });

  const [delayedPage, setDelayedPage] = useState(page);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);
  const { pages, id: bookId } = bookData;

    // Reset page state when book changes, using the proper starting position
  useEffect(() => {
    setPage(initializeBookPosition());
  }, [bookData.id]); // Only reset when the book ID changes

  // Handle animation of multiple page turns
  useEffect(() => {
    // Cancel any existing animation
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
    
    // Only animate if there's a large jump between pages (e.g., to cover or back)
    const pageDistance = Math.abs(delayedPage - page);
    if (pageDistance > 1) {
      setIsAnimating(true);
      let currentPage = delayedPage;
      const direction = delayedPage < page ? 1 : -1;
      
      // Set animation interval - flip pages one by one
      animationRef.current = setInterval(() => {
        currentPage += direction;
        
        // Update the delayedPage to show animation
        setDelayedPage(currentPage);
        
        // Stop when we reach target page
        if ((direction > 0 && currentPage >= page) || 
            (direction < 0 && currentPage <= page)) {
          clearInterval(animationRef.current);
          animationRef.current = null;
          setDelayedPage(page);
          setIsAnimating(false);
        }
      }, 150); // Adjust speed as needed
      
      return () => {
        if (animationRef.current) {
          clearInterval(animationRef.current);
          animationRef.current = null;
        }
      };
    } else {
      // For single page turns, just update normally
      setDelayedPage(page);
    }
  }, [page]);

  // Handle case where pages is not yet available
  if (!pages) return null;

  return (
    // Apply a y-rotation based on language direction
    // For RTL books, we need to rotate in the opposite direction
    <group {...props} rotation-y={-Math.PI / 2}>
      { pages.map((pageData, index) => (
            <Page
              key={index}
              bookId={bookId}
              page={delayedPage}
              number={index}
              opened={delayedPage > index}
              bookClosed={delayedPage === 0 || delayedPage === pages.length}
              pagesLength={pages.length}
              {...pageData}
              isRTL={false}
            />
          ))
      }
    </group>
  );
};