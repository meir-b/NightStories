import { useAtom } from "jotai";
import { pageAtom } from "./UI";
import { zoomPageAtom } from "./Book";  // Import the zoom atom
import { useState, useEffect, useRef } from "react";

export const MobileNavigation = ({ pages, page, getVisiblePages }) => {
  const [, setPage] = useAtom(pageAtom);
  const [zoomPage, setZoomPage] = useAtom(zoomPageAtom);  // Add zoom state
  const [expanded, setExpanded] = useState(false);
  const [showTopNav, setShowTopNav] = useState(false);
  const timeoutRef = useRef(null);
  
  // Auto-hide expanded navigation after a delay
  useEffect(() => {
    if (expanded) {
      timeoutRef.current = setTimeout(() => {
        setExpanded(false);
        setShowTopNav(false);
      }, 4000); // Hide after 4 seconds of inactivity
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [expanded]);
  
  // Reset the timer when user interacts with navigation
  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setExpanded(false);
      setShowTopNav(false);
    }, 4000);
  };
  
  // Toggle expanded state
  const toggleExpanded = () => {
    if (expanded) {
      setExpanded(false);
      setShowTopNav(false);
    } else {
      setExpanded(true);
      resetTimer();
    }
  };
  
  // Toggle top navigation
  const toggleTopNav = (e) => {
    e.stopPropagation();
    setShowTopNav(!showTopNav);
    resetTimer();
  };
  
  // Navigation functions - Simplified for mobile touch
  const handlePrevPage = () => {
    if (page > 0) {
      console.log("Navigate to previous page", page - 1);
      setPage(page - 1);
      resetTimer();
    }
  };
  
  const handleNextPage = () => {
    if (page < pages.length) {
      console.log("Navigate to next page", page + 1);
      setPage(page + 1);
      resetTimer();
    }
  };
  
  const handlePageSelect = (index) => {
    console.log("Navigate to page", index);
    setPage(index);
    resetTimer();
  };
  
  const handleBackCoverSelect = () => {
    console.log("Navigate to back cover", pages.length);
    setPage(pages.length);
    resetTimer();
  };

  // Function to check if current page has text content
  const hasTextContent = () => {
    if (!pages || page <= 0 || page > pages.length) return false;
    
    const currentPage = pages[page - 1];
    if (!currentPage) return false;
    
    return (currentPage.front?.type === "text" || currentPage.back?.type === "text");
  };
  
  // Function to handle zoom button click
  const handleZoom = (e) => {
    e.stopPropagation();
    
    if (!hasTextContent()) return;
    
    // Find the text content to zoom
    const currentPage = pages[page - 1];
    const textContent = currentPage.front?.type === "text" 
      ? currentPage.front 
      : currentPage.back?.type === "text" 
        ? currentPage.back 
        : null;
        
    if (textContent) {
      console.log("Zooming in on text from nav");
      setZoomPage({ isZoomed: true, pageData: textContent });
    }
    
    resetTimer();
  };

    return (
    <>
      {/* Main floating action button */}
      <button
        onClick={() => toggleExpanded()}
        className={`
          fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-black/70 backdrop-blur-md 
          border border-[#d4af37] shadow-xl flex items-center justify-center pointer-events-auto
          transform transition-all duration-300 ease-out active:scale-95 mobile-tap-effect
          ${expanded ? 'expanded' : 'main-nav-btn'}
        `}
        aria-label="Navigation Controls"
      >
        {expanded ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#e2c87d]" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#e2c87d]" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
          </svg>
        )}
      </button>

      {/* BOTTOM TOOLBAR - Always stays on screen */}
      <div 
        className={`
          fixed bottom-5 left-4 z-40 
          transition-all duration-300 ease-out
          flex items-center gap-3
          ${expanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      >
        {/* Current page indicator */}
        <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-[#d4af37]/40 shadow-lg text-[#e2c87d] text-sm font-bold">
          {page === 0 ? "Cover" : page === pages.length ? "Back" : `${page}/${pages.length}`}
        </div>
        
        {/* Previous page button */}
        <button
          onClick={handlePrevPage}
          disabled={page === 0}
          type="button"
          className={`
            w-12 h-12 rounded-full
            flex items-center justify-center
            bg-black/60 backdrop-blur-md
            ${page === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 cursor-pointer'} 
            border border-[#d4af37]/40
            shadow-lg mobile-tap-effect
          `}
          aria-label="Previous page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#e2c87d]" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Zoom button - only show on text pages */}
        {hasTextContent() && (
          <button
            onClick={handleZoom}
            type="button"
            className="w-12 h-12 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-md border border-[#d4af37]/60 shadow-lg mobile-tap-effect cursor-pointer"
            aria-label="Zoom text"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#e2c87d]" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 8a1 1 0 011-1h1V6a1 1 0 012 0v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0V9H6a1 1 0 01-1-1z" />
              <path fillRule="evenodd" d="M2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8zm6-4a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        
        {/* Next page button */}
        <button
          onClick={handleNextPage}
          disabled={page === pages.length}
          type="button"
          className={`
            w-12 h-12 rounded-full
            flex items-center justify-center
            bg-black/60 backdrop-blur-md
            ${page === pages.length ? 'opacity-30 cursor-not-allowed' : 'opacity-100 cursor-pointer'} 
            border border-[#d4af37]/40
            shadow-lg mobile-tap-effect
          `}
          aria-label="Next page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#e2c87d]" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Pages button */}
        <button
          onClick={toggleTopNav}
          type="button"
          className="w-12 h-12 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-md border border-[#d4af37]/40 shadow-lg mobile-tap-effect cursor-pointer"
          aria-label="Show all pages"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#e2c87d]" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        </button>
      </div>
      
      {/* Page selector that slides in from top - fixed to ensure it works on mobile */}
      <div 
        className={`
          fixed top-0 left-0 right-0 z-30
          bg-black/70 backdrop-blur-md 
          transform transition-transform duration-300 ease-out
          ${showTopNav ? 'translate-y-0 pointer-events-auto' : '-translate-y-full pointer-events-none'}
          py-4 border-b border-[#d4af37]/30
        `}
      >
        <div className="flex items-center justify-center gap-2 px-4 py-2 overflow-x-auto max-w-full">
          {getVisiblePages().map((index) => (
            <button
              key={index}
              type="button"
              className={`
                relative w-10 h-10 flex items-center justify-center
                rounded-full shadow-lg
                transition-all duration-200 ease-out 
                text-base mobile-tap-effect cursor-pointer
                ${
                  index === page
                    ? "bg-gradient-to-br from-[#e2c87d] to-[#be8c3c] text-black"
                    : "bg-black/50 text-[#e2c87d] border border-[#d4af37]/40"
                }
              `}
              onClick={() => handlePageSelect(index)}
            >
              {index === 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              ) : index}
            </button>
          ))}
          
          {/* Back cover button */}
          {pages.length > 0 && (
            <button
              type="button"
              className={`
                relative w-10 h-10 flex items-center justify-center
                rounded-full shadow-lg
                transition-all duration-200 ease-out cursor-pointer
                text-base mobile-tap-effect
                ${
                  page === pages.length
                    ? "bg-gradient-to-br from-[#e2c87d] to-[#be8c3c] text-black"
                    : "bg-black/40 text-[#e2c87d]"
                }
              `}
              onClick={handleBackCoverSelect}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Background overlay when menu is expanded - with better mobile touch handling */}
      {expanded && (
        <div 
          className="fixed inset-0 z-20 bg-black/10 pointer-events-auto touch-auto"
          onClick={toggleExpanded}
        />
      )}
    </>
  );
};