import { useBook } from '../contexts/BookContext';
import { useState, useEffect } from 'react';

export const BookSelection = () => {
  const { books, loadBook, isLoading, error } = useBook();
  const [hovered, setHovered] = useState(null);
  const [failedImages, setFailedImages] = useState({});
  const [isLandscape, setIsLandscape] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  // Track device orientation and window size
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    // Initialize on mount
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to detect if text is Hebrew
  const isHebrewText = (text) => {
    // Hebrew Unicode range: \u0590-\u05FF
    const hebrewPattern = /[\u0590-\u05FF]/;
    return hebrewPattern.test(text);
  };

  // Function to handle image load errors
  const handleImageError = (bookId) => {
    setFailedImages(prev => ({ ...prev, [bookId]: true }));
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-black/80 to-[#0a1829]">
        <div className="text-[#e2c87d] text-2xl animate-pulse">
          Loading your books...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/80 to-[#0a1829]">
        <div className="text-red-400 text-2xl mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-[#d4af37]/30 text-[#e2c87d] hover:bg-[#d4af37]/50 rounded text-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-y-auto">
      {/* Background gradient with improved performance using bg-fixed */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-black/80 to-[#0a1829] -z-10 bg-fixed"
        style={{ minHeight: '100%', height: 'auto' }}
      />
      
      <div className="min-h-screen flex flex-col items-center pb-16">
        {/* Header section - more compact on mobile */}
        <div className={`${isLandscape ? 'mt-8 mb-8' : 'mt-16 mb-12'} w-full px-4`}>
          <h1 className="text-center text-[#e2c87d] text-4xl sm:text-5xl md:text-7xl font-light tracking-[0.2em] uppercase">
            Night Stories
          </h1>
          <div className="w-36 sm:w-48 md:w-80 h-[1px] mt-3 md:mt-4 mx-auto bg-gradient-to-r from-[#d4af37] via-[#f4e5b5] to-transparent"></div>
          <h2 className="text-center text-white/80 text-lg mt-3">Select a story to begin</h2>
        </div>

        {/* Book grid - optimized for various screen sizes */}
        <div className={`
          w-full px-3 sm:px-4 max-w-7xl pb-20
          grid gap-4 sm:gap-6 md:gap-8
          ${windowWidth < 640 ? 'grid-cols-1' : ''}
          ${windowWidth >= 640 && windowWidth < 768 ? 'grid-cols-2' : ''}
          ${windowWidth >= 768 && windowWidth < 1024 ? 'grid-cols-2' : ''}
          ${windowWidth >= 1024 ? 'grid-cols-3' : ''}
        `}>
          {books.map((book) => {
            const isTitleHebrew = isHebrewText(book.title);
            const isDescriptionHebrew = isHebrewText(book.description);
            
            return (
              <div
                key={book.id}
                className={`
                  relative overflow-hidden group
                  bg-black/30 backdrop-blur-sm
                  border border-[#d4af37]/40
                  rounded-lg shadow-xl transform transition-all duration-300
                  ${hovered === book.id ? 'scale-102 shadow-[0_0_25px_rgba(212,175,55,0.4)]' : ''}
                  ${isLandscape && windowWidth < 768 ? 'h-44 flex' : ''}
                `}
                onMouseEnter={() => setHovered(book.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => loadBook(book.id)}
              >
                {/* Book cover image - adjusted layout for landscape on mobile */}
                <div className={`
                  overflow-hidden
                  ${isLandscape && windowWidth < 768 ? 'w-1/3 h-full' : 'h-72 sm:h-80'}
                `}>
                  {failedImages[book.id] ? (
                    // Fallback content when image fails to load
                    <div className="w-full h-full flex items-center justify-center bg-[#192339]">
                      <div className="text-[#e2c87d] text-center p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 opacity-50" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <h3 className="text-base">{book.title}</h3>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={book.coverImage} 
                      alt={book.title}
                      className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                      onError={() => handleImageError(book.id)}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                </div>
                
                {/* Book info - adjusted for landscape view on mobile */}
                <div className={`
                  absolute bottom-0 right-0 left-0 p-4 sm:p-6
                  ${isLandscape && windowWidth < 768 ? 'left-1/3' : ''}
                `}>
                  {/* Hebrew RTL support for title */}
                  <h3 className={`
                    text-[#e2c87d] font-medium mb-1 sm:mb-2
                    ${isTitleHebrew ? 'hebrew-text' : ''}
                    ${isLandscape && windowWidth < 768 ? 'text-xl' : 'text-2xl'}
                  `}>
                    {book.title}
                  </h3>
                  
                  {/* Description - show conditionally based on space */}
                  {(!isLandscape || windowWidth >= 768) && (
                    <p className={`
                      text-white/90 mb-4 sm:mb-6
                      ${isDescriptionHebrew ? 'hebrew-text' : ''}
                      ${windowWidth < 768 ? 'text-xs' : 'text-sm'}
                    `}>
                      {book.description}
                    </p>
                  )}
                  
                  {/* Button adjusted for different layouts */}
                  <button 
                    className={`
                      relative overflow-hidden
                      bg-[#d4af37]/30 text-[#e2c87d] border border-[#d4af37]/80
                      hover:bg-[#d4af37]/50 rounded-md uppercase tracking-wider
                      transition-all duration-300
                      ${isLandscape && windowWidth < 768 ? 'text-xs px-4 py-2' : 'text-sm px-6 py-3 sm:px-8'}
                    `}
                  >
                    Read Story
                    <span className="absolute inset-0 w-full translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent"></span>
                  </button>
                </div>
                
                {/* Corner decorations - simplified on small screens */}
                {windowWidth >= 640 && (
                  <>
                    <div className="absolute w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-l-2 border-[#d4af37]/80 top-4 left-4"></div>
                    <div className="absolute w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-r-2 border-[#d4af37]/80 top-4 right-4"></div>
                    <div className="absolute w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-l-2 border-[#d4af37]/80 bottom-4 left-4"></div>
                    <div className="absolute w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-r-2 border-[#d4af37]/80 bottom-4 right-4"></div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Decorative element with better performance */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-[-1]">
          <div className="absolute inset-0 bg-[#d4af37]/5 mix-blend-overlay"></div>
        </div>
      </div>
    </div>
  );
};