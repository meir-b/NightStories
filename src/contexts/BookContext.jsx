import { createContext, useState, useContext, useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { pageAtom } from '../components/UI';

export const BookContext = createContext();

export function useBook() {
  return useContext(BookContext);
}

export function BookProvider({ children }) {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const setPage = useSetAtom(pageAtom);

  // Auto-discover and load books from Content folder
  useEffect(() => {
    const discoverBooks = async () => {
      try {
        setIsLoading(true);
        
        console.log("BASE_URL:", import.meta.env.BASE_URL);
        
        // Define the known story directories - this could be fetched from an API in production
        const knownStoryDirs = ['Story1', '1', 'Story2', 'Story4', 'Story3', '2', 'Story1 - Copy']; //, 'Story2'];
        const discoveredBooks = [];
        
        // For each directory, try to load its manifest
        for (const storyDir of knownStoryDirs) {
          try {
            const manifestResponse = await fetch(`${import.meta.env.BASE_URL}Content/${storyDir}/manifest.json`);
    
            
            if (manifestResponse.ok) {
              const manifestData = await manifestResponse.json();

              // Create a book entry from the manifest data
              const coverImagePath = manifestData.coverImage || 'front.jpg';
              // Determine if the coverImage already has an extension
              const coverImageWithPath = coverImagePath.includes('.') 
              ? `${import.meta.env.BASE_URL}Content/${storyDir}/textures/${coverImagePath}`
              : `${import.meta.env.BASE_URL}Content/${storyDir}/textures/${coverImagePath}.jpg`;

              discoveredBooks.push({
                id: storyDir,
                title: manifestData.title || storyDir,
                description: manifestData.description || '',
                coverImage: coverImageWithPath
              });
              
              console.log(`Discovered book: ${storyDir}`);
            } else {
              console.warn(`Could not load manifest for ${storyDir}`);
            }
          } catch (err) {
            console.warn(`Error loading ${storyDir}: ${err.message}`);
            // Continue to next directory even if this one fails
          }
        }
        
        if (discoveredBooks.length === 0) {
          // Fallback to hardcoded mock data if no books were found
          console.warn("No books found in Content directory, using fallback data");
          const mockBooks = [
            {
              id: "Story1",
              title: "המשאית האדומה",
              description: "שיתוף ותורנות",
               coverImage: `${import.meta.env.BASE_URL}Content/Story1/textures/front.jpg`
            }
          ];
          setBooks(mockBooks);
        } else {
          setBooks(discoveredBooks);
        }
      } catch (err) {
        console.error("Error discovering books:", err);
        setError("Failed to load books. Please try again later.");
        
        // Fallback to hardcoded data in case of error
        const fallbackBooks = [
          {
            id: "Story1",
            title: "המשאית האדומה",
            description: "שיתוף ותורנות",
            coverImage: `${import.meta.env.BASE_URL}Content/Story1/textures/front.jpg`
          }
        ];
        setBooks(fallbackBooks);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Add a delay for better UX
    const timer = setTimeout(() => {
      discoverBooks();
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  // Load a specific book's content
  const loadBook = async (bookId) => {
    try {
      setIsLoading(true);
      //setPage(0); // Reset to first page when loading a new book
      
      const response = await fetch(`${import.meta.env.BASE_URL}Content/${bookId}/manifest.json`);
      
      if (!response.ok) {
        throw new Error(`Failed to load book ${bookId}`);
      }
      
      const bookData = await response.json();
      setSelectedBook({
        id: bookId,
        startFromBack: bookData.startFromBack || false, // Default to false if not specified
        ...bookData
      });
    } catch (err) {
      console.error(`Error loading book ${bookId}:`, err);
      setError(`Failed to load "${bookId}". Please try again later.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset book selection
  const resetSelection = () => {
    setSelectedBook(null);
  };

  const value = {
    books,
    selectedBook,
    isLoading,
    error,
    loadBook,
    resetSelection
  };

  return (
    <BookContext.Provider value={value}>
      {children}
    </BookContext.Provider>
  );
}