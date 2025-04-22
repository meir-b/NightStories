import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect, useMemo } from "react";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";
import { BookSelection } from "./components/BookSelection";
import { BookProvider, useBook } from "./contexts/BookContext";

// The Book Reader component that wraps the 3D canvas
const BookReader = () => {
  const { selectedBook } = useBook();
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  
  // Update the camera position calculation for better framing
  const cameraPosition = useMemo(() => {
    if (windowWidth < 480) {
      return [-0.25, 0.0, 7.2]; // Better framing for small phones
    } else if (windowWidth < 768) {
      return [-0.25, 0.0, 6.2]; // Better framing for larger phones
    } else if (windowWidth < 1024) {
      return [-0.25, 0.2, 5.5]; // Tablets
    } else if (windowWidth < 1440) {
      return [-0.25, 0.2, 4.8]; // Small desktops
    } else {
      return [-0.25, 0.2, 4.2]; // Large desktops
    }
  }, [windowWidth]);

  // Update window width when resized - debounced
  useEffect(() => {
    let timeoutId = null;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 200); // Debounce resize events
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // If no book is selected, this component shouldn't render anything
  if (!selectedBook) return null;

  return (
    <>
      <UI bookData={selectedBook} />
      <Loader />
      <Canvas 
        className="fixed inset-0 w-full h-full" // Add fixed positioning to the Canvas
        shadows 
        camera={{
          position: cameraPosition,
          fov: 45,
        }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <group position-y={0}>
          <Suspense fallback={null}>
            <Experience bookData={selectedBook} />
          </Suspense>
        </group>
      </Canvas>
    </>
  );
};
// The main App component
function App() {
  return (
    <BookProvider>
      <AppContent />
    </BookProvider>
  );
}

// The content portion that depends on book selection state
function AppContent() {
  const { selectedBook, resetSelection } = useBook();
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  
  // Check if we're on mobile
  const isMobile = windowWidth < 768;
  
  // Toggle book reading mode class when switching between selection and reading
  useEffect(() => {
    const rootElement = document.getElementById('root');
    
    if (selectedBook) {
      rootElement.classList.add('book-reading-mode');
    } else {
      rootElement.classList.remove('book-reading-mode');
    }
  }, [selectedBook]);
  
  // Update window width when resized
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  return (
    <>
      {!selectedBook && <BookSelection />}
      {selectedBook && (
        <div className="fixed inset-0 w-full h-full">
          <BookReader />
          <button 
            className={`
              fixed z-50 flex items-center
              transition-all duration-300 ease-out
              border border-[#d4af37]/40 
              ${isMobile 
                ? 'top-4 left-4 rounded-full w-12 h-12 p-0 justify-center bg-black/70' // Mobile: Circle button at top-left with just the icon
                : 'top-4 right-4 px-4 py-2 bg-black/40 hover:bg-black/60 rounded text-[#e2c87d]' // Desktop: Text button at top-right
              }
            `}
            onClick={resetSelection}
            aria-label="Back to Library"
          >
            {isMobile ? (
              // Mobile: Just show the icon 
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#e2c87d]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              // Desktop: Show icon and text
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Library
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}
export default App;