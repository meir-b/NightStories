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

  const [_, setPage] = useAtom(pageAtom);
  const [, setZoomPage] = useAtom(zoomPageAtom);
  const [highlighted, setHighlighted] = useState(false);
  useCursor(highlighted);

  // Check if this page has text content that can be zoomed
  const hasZoomableContent = useMemo(() => {
    return (front.type === "text" || back.type === "text");
  }, [front.type, back.type]);

  
  // Track tap timing for mobile double-tap detection
  const lastTapTimeRef = useRef(0);

  // Update the Page component to handle story pagination clicks properly
  // Remove the following from createTextTexture function
// 1. Remove all code related to pagination controls
// 2. Remove code for handling continuedText arrays
// 3. Keep only the basic text rendering functionality

// Update the handleClick function to only handle page turning
const handleClick = (e) => {
  e.stopPropagation();
  
  const now = Date.now();
  const DOUBLE_TAP_DELAY = 300; // ms
  
  if (now - lastTapTimeRef.current < DOUBLE_TAP_DELAY) {
    // Handle double-tap for zooming
    if (hasZoomableContent) {
      const zoomContent = front.type === "text" ? front : back.type === "text" ? back : null;
      if (zoomContent) {
        console.log("Double-tap detected - zooming in on text content");
        setZoomPage({ isZoomed: true, pageData: zoomContent });
        lastTapTimeRef.current = 0; // Reset to prevent further actions
        return;
      }
    }
  } else {
    // Single tap - handle page turning
    const pageToSet = (props.isRTL === true) 
      ? (opened ? number : number - 1)  // RTL direction
      : (opened ? number : number + 1); // LTR direction
    
    console.log("Turning page to:", pageToSet);
    setPage(pageToSet);
  }
  
  lastTapTimeRef.current = now;
  setHighlighted(false);
};

// Add a double click handler for zooming
const handleDoubleClick = (e) => {
  e.stopPropagation();
  
  if (!hasZoomableContent) return;
  
  // Determine which side (front/back) has text content to zoom
  const zoomContent = front.type === "text" ? front : back.type === "text" ? back : null;
  
  if (zoomContent) {
    console.log("Zooming in on text content");
    setZoomPage({ isZoomed: true, pageData: zoomContent });
  }
};


// Around line 453, in the Page component return statement
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
    onDoubleClick={handleDoubleClick} // Add this line to connect the double click handler
  >
    <primitive
      object={manualSkinnedMesh}
      ref={skinnedMeshRef}
      position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
    />

    {/* Zoom indicator for text pages */}
    {hasZoomableContent && highlighted && (
      <mesh position={[PAGE_WIDTH - 0.2, PAGE_HEIGHT - 0.2, 0.01]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#e2c87d" emissive="#d4af37" emissiveIntensity={0.5} />
      </mesh>
    )}
  </group>
);
};

export const Book = ({ bookData, ...props }) => {
  const [page] = useAtom(pageAtom);
  const [delayedPage, setDelayedPage] = useState(page);
  const { pages, id: bookId } = bookData;

  // Check if it's a Hebrew book (assuming first page indicates language)
  const isHebrewBook = pages && pages.length > 0 && 
    ((pages[0].front && pages[0].front.language === 'hebrew') || 
     (pages[0].back && pages[0].back.language === 'hebrew'));

  useEffect(() => {
    // Preload textures for this book
    if (pages) {
      pages.forEach((page) => {
        if (page.front.type === "photo") {
          useTexture.preload(GetPath(bookId, page.front.src));
        }
        if (page.back.type === "photo") {
          useTexture.preload(GetPath(bookId, page.back.src));
        }
      });
    }
    
    // Page turning logic remains the same
    let timeout;
    const goToPage = () => {
      setDelayedPage((delayedPage) => {
        if (page === delayedPage) {
          return delayedPage;
        } else {
          timeout = setTimeout(
            () => {
              goToPage();
            },
            Math.abs(page - delayedPage) > 2 ? 50 : 150
          );
          if (page > delayedPage) {
            return delayedPage + 1;
          }
          if (page < delayedPage) {
            return delayedPage - 1;
          }
        }
      });
    };
    goToPage();
    return () => {
      clearTimeout(timeout);
    };
  }, [page, bookId, pages]);

  // Handle case where pages is not yet available
  if (!pages) return null;

  return (
    <group {...props} rotation-y={isHebrewBook ? Math.PI / 2 : -Math.PI / 2}>
      {/* Flip the order of pages for Hebrew books */}
      {isHebrewBook 
        ? [...pages].reverse().map((pageData, index) => (
            <Page
              key={index}
              bookId={bookId}
              page={delayedPage}
              number={pages.length - 1 - index} // Adjust the page number
              opened={delayedPage > pages.length - 1 - index}
              bookClosed={delayedPage === 0 || delayedPage === pages.length}
              pagesLength={pages.length}
              {...pageData}
              isRTL={true} // Pass RTL flag
            />
          ))
        : pages.map((pageData, index) => (
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