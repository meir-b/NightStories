import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { zoomPageAtom } from "./Book";

export const ZoomedTextView = () => {
  const [zoomPage, setZoomPage] = useAtom(zoomPageAtom);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Handle escape key to exit zoom
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && zoomPage.isZoomed) {
        closeZoom();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomPage.isZoomed]);
  
  // Apply no-scroll class to body when zoomed
  useEffect(() => {
    if (zoomPage.isZoomed) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    
    return () => {
      document.body.style.overflow = "";
    };
  }, [zoomPage.isZoomed]);
  
  // Close zoom mode
  const closeZoom = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setZoomPage({ isZoomed: false, pageData: null });
      setIsAnimating(false);
    }, 300);
  };
  
  // Don't render if not zoomed
  if (!zoomPage.isZoomed || !zoomPage.pageData) return null;
  
  const { content, language, bgColor } = zoomPage.pageData;
  const isHebrew = language === "hebrew";
  
  return (
    <div 
        className={`fixed inset-0 z-50 flex flex-col transition-opacity duration-300
            ${isAnimating ? "opacity-0" : "opacity-100"}
            ${isHebrew ? "rtl" : "ltr"}`}
        style={{ backgroundColor: bgColor || "#1a2a48" }}
        onClick={closeZoom}
        dir={isHebrew ? "rtl" : "ltr"}
        >
      {/* Header with close button - adjusted for RTL */}
      <div 
        className="flex justify-between items-center p-4 border-b border-[#d4af37]/30"
        onClick={(e) => e.stopPropagation()}
        >
        <h2 className={`text-[#e2c87d] text-xl ${isHebrew ? "hebrew-text" : ""}`}>
            {content.title || "Reading Mode"}
        </h2>
        <button 
            onClick={closeZoom}
            className="w-10 h-10 rounded-full bg-black/40 border border-[#d4af37]/40
            flex items-center justify-center text-[#e2c87d] hover:bg-black/60"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </button>
      </div>
      
      {/* Scrollable content - enhanced for better readability */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Title & Subtitle */}
        {content.title && (
          <div className="mb-6">
            <h1 className={`text-[#ffdc8f] text-3xl sm:text-4xl font-bold ${isHebrew ? "hebrew-text" : ""}`}>
              {content.title}
            </h1>
            {content.subtitle && (
              <p className={`text-[#f0e6a6] text-xl mt-2 ${isHebrew ? "hebrew-text" : ""}`}>
                {content.subtitle}
              </p>
            )}
            <div className={`w-full h-[2px] mt-3 bg-gradient-to-r ${isHebrew ? "from-transparent to-[#d4af37]/80" : "from-[#d4af37]/80 to-transparent"}`}></div>
          </div>
        )}
        
        {/* Main text content with improved styling */}
        {content.text && (
          <div 
            className={`
              text-white text-lg sm:text-xl leading-relaxed
              ${isHebrew ? "hebrew-text" : "child-text"}
            `}
          >
            {content.text.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4 px-4 py-2 bg-black/20 rounded">{paragraph}</p>
            ))}
          </div>
        )}
      </div>
      
      {/* Bottom info */}
      <div className="p-4 border-t border-[#d4af37]/30 text-center text-[#e2c87d]/70">
        <p className="text-sm">{isHebrew ? "לחץ בכל מקום או הקש ESC לחזור לספר" : "Tap anywhere or press ESC to return to book"}</p>
      </div>
    
    {/* Add a more visible tap instruction - adjusted for RTL */}
    <div className="fixed bottom-16 left-0 right-0 flex justify-center pointer-events-none animate-pulse">
      <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-[#d4af37]/40">
        <p className="text-[#e2c87d] text-sm flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isHebrew ? "ml-2" : "mr-2"}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
          </svg>
          {isHebrew ? "לחץ בכל מקום ליציאה" : "Tap anywhere to exit zoom"}
        </p>
      </div>
    </div>
  </div>
  );
};