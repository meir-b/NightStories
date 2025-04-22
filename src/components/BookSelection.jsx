import { useBook } from '../contexts/BookContext';
import { useState } from 'react';

export const BookSelection = () => {
  const { books, loadBook, isLoading, error } = useBook();
  const [hovered, setHovered] = useState(null);
  const [failedImages, setFailedImages] = useState({});

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
    // Updated container with min-h-screen and bg-fixed for consistent background when scrolling
    <div className="fixed inset-0 overflow-y-auto">
      {/* This div ensures the background extends to full content height */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-black/80 to-[#0a1829] -z-10 bg-fixed"
        style={{ minHeight: '100%', height: 'auto' }}
      />
      
      <div className="min-h-screen flex flex-col items-center pb-20">
        <div className="mt-20 mb-16">
          <h1 className="text-center text-[#e2c87d] text-5xl md:text-7xl font-light tracking-[0.2em] uppercase">
            Night Stories
          </h1>
          <div className="w-48 md:w-80 h-[1px] mt-4 mx-auto bg-gradient-to-r from-[#d4af37] via-[#f4e5b5] to-transparent"></div>
          <h2 className="text-center text-white/80 text-xl mt-4">Select a story to begin</h2>
        </div>

        {/* Book grid with bottom padding to ensure space for scrolling */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 max-w-7xl pb-24">
          {books.map((book) => {
            // Rest of book rendering code remains unchanged
            const isTitleHebrew = isHebrewText(book.title);
            const isDescriptionHebrew = isHebrewText(book.description);
            
            return (
              <div
                key={book.id}
                className={`
                  relative overflow-hidden group
                  bg-black/30 backdrop-blur-sm
                  border border-[#d4af37]/40
                  rounded-lg shadow-xl transform transition-all duration-500
                  ${hovered === book.id ? 'scale-105 shadow-[0_0_25px_rgba(212,175,55,0.4)]' : ''}
                `}
                onMouseEnter={() => setHovered(book.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => loadBook(book.id)}
              >
                {/* Book cover image */}
                <div className="h-80 overflow-hidden">
                  {failedImages[book.id] ? (
                    // Fallback content when image fails to load
                    <div className="w-full h-full flex items-center justify-center bg-[#192339]">
                      <div className="text-[#e2c87d] text-center p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-2 opacity-50" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <h3 className="text-lg">{book.title}</h3>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={book.coverImage} 
                      alt={book.title}
                      className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                      onError={() => handleImageError(book.id)}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                </div>
                
                {/* Book info */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  {/* Hebrew RTL support for title */}
                  <h3 className={`text-[#e2c87d] text-2xl font-medium mb-2 ${isTitleHebrew ? 'hebrew-text' : ''}`}>
                    {book.title}
                  </h3>
                  
                  {/* Hebrew RTL support for description */}
                  <p className={`text-white/90 text-sm mb-6 ${isDescriptionHebrew ? 'hebrew-text' : ''}`}>
                    {book.description}
                  </p>
                  
                  <button 
                    className="
                      relative overflow-hidden
                      px-8 py-3 bg-[#d4af37]/30 text-[#e2c87d] border border-[#d4af37]/80
                      hover:bg-[#d4af37]/50 rounded-md text-sm uppercase tracking-wider
                      transition-all duration-300
                    "
                  >
                    Read Story
                    <span className="absolute inset-0 w-full translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent"></span>
                  </button>
                </div>
                
                {/* Corner decorations */}
                <div className="absolute w-8 h-8 border-t-2 border-l-2 border-[#d4af37]/80 top-4 left-4"></div>
                <div className="absolute w-8 h-8 border-t-2 border-r-2 border-[#d4af37]/80 top-4 right-4"></div>
                <div className="absolute w-8 h-8 border-b-2 border-l-2 border-[#d4af37]/80 bottom-4 left-4"></div>
                <div className="absolute w-8 h-8 border-b-2 border-r-2 border-[#d4af37]/80 bottom-4 right-4"></div>
              </div>
            );
          })}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-[-1]">
          <div className="absolute inset-0 bg-[#d4af37]/5 mix-blend-overlay"></div>
        </div>
      </div>
    </div>
  );
};