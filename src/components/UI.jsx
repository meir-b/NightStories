import { atom, useAtom } from "jotai";
import { useEffect, useState, useRef } from "react";
import { MobileNavigation } from "./MobileNavigation";
import { ZoomedTextView } from "./ZoomedTextView"; // Import the new component
import { zoomPageAtom } from "./Book"; // Import the zoom atom

// Update the atom to reset when changing books
export const pageAtom = atom(0);

// Function to get button icon/label based on page type
const getPageLabel = (index, pages) => {
  // First check if pages array is valid and has the index we need
  if (!pages || !Array.isArray(pages) || !pages[index]) {
    return `${index}`;
  }
  
  if (index === 0) return "Cover";
  
  const pageData = pages[index];
  
  // Check for Hebrew page
  const isHebrewPage = 
    (pageData.front && pageData.front.language === 'hebrew') || 
    (pageData.back && pageData.back.language === 'hebrew');
    
  // Check if either front or back is a text page
  const isTextPage = 
    (pageData.front && pageData.front.type === "text") || 
    (pageData.back && pageData.back.type === "text");
  
  // Check if this is a multi-page story
  const hasMultiplePages = 
    (pageData.front && 
     pageData.front.content && 
     pageData.front.content.continuedText &&
     pageData.front.content.continuedText.length > 0);
  
  // Rest of the function remains unchanged
  if (isHebrewPage) {
    return (
      <span className="flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5z" />
          <path d="M11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
        </svg>
        {index}
        {hasMultiplePages && (
          <span className="ml-1 text-amber-400">•••</span>
        )}
      </span>
    );
  } else if (isTextPage) {
    return (
      <span className="flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v1H7V5zm0 3h6v1H7V8zm0 3h4v1H7v-1z" clipRule="evenodd" />
        </svg>
        {index}
        {hasMultiplePages && (
          <span className="ml-1 text-amber-400">•••</span>
        )}
      </span>
    );
  }
  
  return `${index}`;
};

export const UI = ({ bookData }) => {
  const [page, setPage] = useAtom(pageAtom);
  const [zoomPage] = useAtom(zoomPageAtom); // Add zoom state
  const [showAllButtons, setShowAllButtons] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isLandscape, setIsLandscape] = useState(false);
  const audioRef = useRef(null);
  
  // Add safety checks for bookData
  const title = bookData?.title || "Night Stories";
  const pages = bookData?.pages || [];
  
  // Get viewport dimensions for responsive design
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  
  const [windowHeight, setWindowHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 0
  );

  // Determine if we're on mobile and orientation
  const isMobile = windowWidth < 768;
  
  // Update detected orientation when dimensions change
  useEffect(() => {
    setIsLandscape(windowWidth > windowHeight);
  }, [windowWidth, windowHeight]);

  // Update window dimensions when resized
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle scroll to hide/show mobile navigation
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY + 10) {
        // Scrolling down - hide navigation
        setShowMobileNav(false);
      } else if (currentScrollY < lastScrollY - 10 || currentScrollY === 0) {
        // Scrolling up or at top - show navigation
        setShowMobileNav(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Show navigation when user taps screen (for mobile)
  const handleScreenTap = () => {
    if (!showMobileNav) {
      setShowMobileNav(true);
      // Hide again after 3 seconds of inactivity
      setTimeout(() => {
        setShowMobileNav(false);
      }, 3000);
    }
  };

  // Initialize audio once
  useEffect(() => {
    // Use import.meta.env.BASE_URL for proper GitHub Pages path handling
    const audioPath = `${import.meta.env.BASE_URL}audios/page-flip-01a.mp3`;
    audioRef.current = new Audio(audioPath);
    
    const handleFirstInteraction = () => {
      setUserInteracted(true);
      document.removeEventListener('click', handleFirstInteraction);
    };
    
    document.addEventListener('click', handleFirstInteraction);
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, []);
  
  // Play audio when page changes, but only after user has interacted
  useEffect(() => {
    if (userInteracted && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Audio playback prevented by browser policy");
        });
      }
    }
  }, [page, userInteracted]);

  // Reset page when book changes
  useEffect(() => {
    setPage(0);
  }, [bookData, setPage]);
  
  // Get visible pages for pagination - add safety check
  const getVisiblePages = () => {
    if (!pages || !pages.length) return [0];
    if (!isMobile || showAllButtons || isLandscape) return [...Array(pages.length).keys()];
    
    const visiblePages = [];
    // Always show first page
    visiblePages.push(0);
    
    // Show current page and 1 page before/after
    const start = Math.max(1, page - 1);
    const end = Math.min(pages.length - 1, page + 1);
    
    for (let i = start; i <= end; i++) {
      visiblePages.push(i);
    }
    
    // Always show last page button
    if (pages.length > 1 && !visiblePages.includes(pages.length - 1)) {
      visiblePages.push(pages.length - 1);
    }
    
    return visiblePages;
  };

  const shouldShowNav = !zoomPage.isZoomed && showMobileNav;

  const isHebrewBook = bookData && bookData.pages && bookData.pages.length > 0 && 
  ((bookData.pages[0].front && bookData.pages[0].front.language === 'hebrew') || 
   (bookData.pages[0].back && bookData.pages[0].back.language === 'hebrew'));

  return (
    <>
      {/* Zoomed text view */}
      <ZoomedTextView />

      <div 
        className="fixed inset-0 z-0"
        onClick={handleScreenTap}
      >
        {/* Invisible touchscreen layer to detect taps */}
      </div>
      
      <main className="pointer-events-none select-none z-10 fixed inset-0 flex justify-between flex-col">
        {/* Title section with improved spacing for both portrait and landscape */}
        <div className={`
          mt-4 md:mt-8 
          ${isMobile && !isLandscape ? 'ml-20' : 'ml-4 md:ml-10'} 
          ${isMobile && isLandscape ? 'text-center ml-0' : ''} 
          pointer-events-auto
        `}>
          <h1 className={`
            text-[#e2c87d] text-3xl md:text-5xl font-light tracking-[0.2em] uppercase
            ${isMobile && isLandscape ? 'text-2xl' : ''}
          `}>
            {title}
          </h1>
          <div className={`
            h-[1px] mt-1 md:mt-2 bg-gradient-to-r from-[#d4af37] via-[#f4e5b5] to-transparent
            ${isMobile && isLandscape ? 'w-24 mx-auto' : 'w-32 md:w-48'}
          `}></div>

          {/* Add zoom instruction tip for desktop users */}
          {!isMobile && !zoomPage.isZoomed && (
            <div className="fixed bottom-4 right-4 bg-black/60 backdrop-blur-md rounded-lg px-4 py-2 border border-[#d4af37]/40 text-[#e2c87d] text-sm max-w-xs">
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 8a1 1 0 011-1h1V6a1 1 0 012 0v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0V9H6a1 1 0 01-1-1z" />
                  <path fillRule="evenodd" d="M2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8zm6-4a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
                </svg>
                <span>Double-click any text page to zoom for easier reading</span>
              </div>
            </div>
          )}
        </div>
        
        

        {/* MOBILE NAVIGATION */}
        {isMobile && (
          <MobileNavigation 
            pages={pages} 
            page={page} 
            getVisiblePages={getVisiblePages}
          />
        )}
                    
        {/* DESKTOP NAVIGATION */}
{!isMobile && (
  <div className="pointer-events-auto flex justify-center items-center py-4 md:py-6 z-20">
    <div className="flex items-center gap-2 md:gap-4 px-4 md:px-10 overflow-x-auto max-w-full">
      {/* Page buttons - full desktop view */}
      {[...Array(pages.length).keys()].map((index) => {
        const pageData = pages[index];
        const hasTextContent = 
          (pageData && pageData.front && pageData.front.type === "text") || 
          (pageData && pageData.back && pageData.back.type === "text");
        
        return (
          <button
            key={index}
            className={`
              relative group overflow-hidden
              shadow-[0_3px_10px_rgba(0,0,0,0.25)] 
              transition-all duration-300 ease-out
              px-7 py-2.5
              text-xs tracking-[0.15em] uppercase font-light
              min-w-[60px]
              flex-shrink-0
              ${
                index === page
                  ? "bg-gradient-to-br from-[#e2c87d] to-[#be8c3c] text-black border-[#f4e5b5]"
                  : hasTextContent 
                    ? "bg-black/30 text-[#e2c87d] hover:text-white backdrop-blur-md border border-[#d4af37]/40" 
                    : "bg-black/20 text-[#e2c87d] hover:text-white backdrop-blur-md"
              }
            `}
            onClick={(e) => {
              e.stopPropagation();
              console.log("Button clicked for page:", index);
              setPage(index);
            }}
          >
            <span className="relative z-10">
              {getPageLabel(index, pages)}
            </span>

                    <span className={`absolute inset-0 border border-[#d4af37] opacity-${index === page ? '90' : '30'} group-hover:opacity-70`}></span>
                    
                    {/* Corner accents - only on desktop */}
                    <span className="absolute w-1.5 h-1.5 border-t border-l border-[#d4af37] top-0 left-0"></span>
                    <span className="absolute w-1.5 h-1.5 border-t border-r border-[#d4af37] top-0 right-0"></span>
                    <span className="absolute w-1.5 h-1.5 border-b border-l border-[#d4af37] bottom-0 left-0"></span>
                    <span className="absolute w-1.5 h-1.5 border-b border-r border-[#d4af37] bottom-0 right-0"></span>
                    
                    <span className="absolute inset-0 w-full translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent"></span>
                  </button>
                );
              })}
              
              {/* Back cover button - desktop */}
              {pages.length > 0 && (
                <button
                  className={`
                    relative group overflow-hidden
                    shadow-[0_3px_10px_rgba(0,0,0,0.25)] 
                    transition-all duration-300 ease-out
                    px-7 py-2.5
                    text-xs tracking-[0.15em] uppercase font-light
                    min-w-[60px]
                    flex-shrink-0
                    ${
                      page === pages.length
                        ? "bg-gradient-to-br from-[#e2c87d] to-[#be8c3c] text-black border-[#f4e5b5]"
                        : "bg-black/20 text-[#e2c87d] hover:text-white backdrop-blur-md"
                    }
                  `}
                  onClick={() => setPage(pages.length)}
                >
                  <span className={`absolute inset-0 border border-[#d4af37] opacity-${page === pages.length ? '90' : '30'} group-hover:opacity-70`}></span>
                  
                  {/* Corner accents - only on desktop */}
                  <span className="absolute w-1.5 h-1.5 border-t border-l border-[#d4af37] top-0 left-0"></span>
                  <span className="absolute w-1.5 h-1.5 border-t border-r border-[#d4af37] top-0 right-0"></span>
                  <span className="absolute w-1.5 h-1.5 border-b border-l border-[#d4af37] bottom-0 left-0"></span>
                  <span className="absolute w-1.5 h-1.5 border-b border-r border-[#d4af37] bottom-0 right-0"></span>
                  
                  <span className="relative z-10">Back</span>
                  
                  <span className="absolute inset-0 w-full translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent"></span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Background with subtle gold dust */}
      <div className="fixed inset-0 select-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none"></div>
      </div>
    </>
  );
};