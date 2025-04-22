import { atom, useAtom } from "jotai";
import { useEffect, useState, useRef } from "react";

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
  const [showAllButtons, setShowAllButtons] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const audioRef = useRef(null);
  
  // Add safety checks for bookData
  const title = bookData?.title || "Night Stories";
  const pages = bookData?.pages || [];
  
  // Get viewport width for responsive design
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  // Determine if we're on mobile - THIS WAS MISSING
  const isMobile = windowWidth < 768;

  // Update window width when resized
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize audio once
  useEffect(() => {
    // Use import.meta.env.BASE_URL for proper GitHub Pages path handling
    const audioPath = `${import.meta.env.BASE_URL}audios/page-flip-01a.mp3`;
    audioRef.current = new Audio(audioPath);
    
    // Rest of the function remains the same
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
      // Reset audio to beginning if it's already playing
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      // Try to play and handle any errors silently
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Auto-play was prevented - this is fine
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
    if (!isMobile || showAllButtons) return [...Array(pages.length).keys()];
    
    const visiblePages = [];
    // Always show first and current
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

  return (
    <>
      <main className="pointer-events-none select-none z-10 fixed inset-0 flex justify-between flex-col">
        {/* Use title section with the book's title - with mobile padding for back button */}
        <div className={`mt-4 md:mt-8 ${isMobile ? 'ml-20' : 'ml-4 md:ml-10'}`}>
          <h1 className="text-[#e2c87d] text-3xl md:text-5xl font-light tracking-[0.2em] uppercase">
            {title}
          </h1>
          <div className="w-32 md:w-48 h-[1px] mt-1 md:mt-2 bg-gradient-to-r from-[#d4af37] via-[#f4e5b5] to-transparent"></div>
        </div>
        
          
       {/* Updated container for better centering - mobile-first considerations */}
       <div className="w-full pointer-events-auto flex flex-col justify-center items-center backdrop-blur-sm bg-black/10">
          {/* Mobile pagination controls */}
          {isMobile && (
            <div className="w-full flex justify-between items-center px-4 py-3 border-b border-[#d4af37]/20">
              <button 
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className={`text-[#e2c87d] ${page === 0 ? 'opacity-30' : 'opacity-100'} px-4 py-2 text-lg`}
              >
                ◄ Prev
              </button>
              
              <span className="text-[#e2c87d] text-base tracking-widest uppercase">
                {page === 0 ? "Cover" : page === pages.length ? "Back" : `Page ${page}`}
              </span>
              
              <button 
                onClick={() => setPage(Math.min(pages.length, page + 1))}
                disabled={page === pages.length}
                className={`text-[#e2c87d] ${page === pages.length ? 'opacity-30' : 'opacity-100'} px-4 py-2 text-lg`}
              >
                Next ►
              </button>
            </div>
          )}
                    
          {/* Centered button container */}
          <div className="flex justify-center items-center py-4 md:py-6">
            <div className="flex items-center gap-2 md:gap-4 px-4 md:px-10 overflow-x-auto max-w-full">
              {/* Toggle button for mobile */}
              {isMobile && !showAllButtons && getVisiblePages().length < pages.length && (
                <button
                  onClick={() => setShowAllButtons(true)}
                  className="min-w-[40px] h-[30px] flex items-center justify-center text-[#e2c87d] bg-black/20 text-xs flex-shrink-0"
                >
                  ...
                </button>
              )}
              
              {/* Page buttons - filtered for mobile */}
              {(isMobile ? getVisiblePages() : [...Array(pages.length).keys()]).map((index) => {
                // Safely check if this page has text content
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
                      ${isMobile ? 'px-3 py-1.5' : 'px-7 py-2.5'}
                      text-xs tracking-[0.15em] uppercase font-light
                      ${isMobile ? 'min-w-[36px]' : 'min-w-[60px]'}
                      flex-shrink-0
                      ${
                        index === page
                          ? "bg-gradient-to-br from-[#e2c87d] to-[#be8c3c] text-black border-[#f4e5b5]"
                          : hasTextContent 
                            ? "bg-black/30 text-[#e2c87d] hover:text-white backdrop-blur-md border border-[#d4af37]/40" 
                            : "bg-black/20 text-[#e2c87d] hover:text-white backdrop-blur-md"
                      }
                    `}
                    onClick={() => setPage(index)}
                  >
                    {/* Pass pages to getPageLabel */}
                    <span className="relative z-10">
                      {getPageLabel(index, pages)}
                    </span>

                    {/* Gold accent borders */}
                    <span className={`absolute inset-0 border border-[#d4af37] opacity-${index === page ? '90' : '30'} group-hover:opacity-70`}></span>
                    
                    {!isMobile && (
                      <>
                        {/* Corner accents - only on desktop */}
                        <span className="absolute w-1.5 h-1.5 border-t border-l border-[#d4af37] top-0 left-0"></span>
                        <span className="absolute w-1.5 h-1.5 border-t border-r border-[#d4af37] top-0 right-0"></span>
                        <span className="absolute w-1.5 h-1.5 border-b border-l border-[#d4af37] bottom-0 left-0"></span>
                        <span className="absolute w-1.5 h-1.5 border-b border-r border-[#d4af37] bottom-0 right-0"></span>
                      </>
                    )}
                    
                    {/* Button shine effect */}
                    <span className="absolute inset-0 w-full translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent"></span>
                  </button>
                );
              })}
              
              {/* Back cover button - only show if we have pages */}
              {pages.length > 0 && (
                <button
                  className={`
                    relative group overflow-hidden
                    shadow-[0_3px_10px_rgba(0,0,0,0.25)] 
                    transition-all duration-300 ease-out
                    ${isMobile ? 'px-3 py-1.5' : 'px-7 py-2.5'}
                    text-xs tracking-[0.15em] uppercase font-light
                    ${isMobile ? 'min-w-[36px]' : 'min-w-[60px]'}
                    flex-shrink-0
                    ${
                      page === pages.length
                        ? "bg-gradient-to-br from-[#e2c87d] to-[#be8c3c] text-black border-[#f4e5b5]"
                        : "bg-black/20 text-[#e2c87d] hover:text-white backdrop-blur-md"
                    }
                  `}
                  onClick={() => setPage(pages.length)}
                >
                  {/* Gold accent borders */}
                  <span className={`absolute inset-0 border border-[#d4af37] opacity-${page === pages.length ? '90' : '30'} group-hover:opacity-70`}></span>
                  
                  {!isMobile && (
                    <>
                      {/* Corner accents - only on desktop */}
                      <span className="absolute w-1.5 h-1.5 border-t border-l border-[#d4af37] top-0 left-0"></span>
                      <span className="absolute w-1.5 h-1.5 border-t border-r border-[#d4af37] top-0 right-0"></span>
                      <span className="absolute w-1.5 h-1.5 border-b border-l border-[#d4af37] bottom-0 left-0"></span>
                      <span className="absolute w-1.5 h-1.5 border-b border-r border-[#d4af37] bottom-0 right-0"></span>
                    </>
                  )}
                  
                  {/* Button text */}
                  <span className="relative z-10">Back</span>
                  
                  {/* Subtle hover shine effect */}
                  <span className="absolute inset-0 w-full translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent"></span>
                </button>
              )}
              
              {/* Toggle button for mobile - show less pages */}
              {isMobile && showAllButtons && (
                <button
                  onClick={() => setShowAllButtons(false)}
                  className="min-w-[40px] h-[30px] flex items-center justify-center text-[#e2c87d] bg-black/20 text-xs flex-shrink-0"
                >
                  Less
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Background with subtle gold dust */}
      <div className="fixed inset-0 select-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none"></div>
      </div>
    </>
  );
};