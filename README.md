# Night Stories

An interactive 3D children's book application built with React, Three.js and React Three Fiber. This application renders children's books in a beautiful 3D environment with realistic page-turning animations and supports both English and Hebrew text.

## Features

- 3D book rendering with realistic page turning physics
- Support for both text and image pages
- Multi-language support with special handling for Hebrew RTL text
- Responsive design for both desktop and mobile
- Dynamic book discovery and loading
- Beautiful UI with animated elements

## Technologies Used

- React
- Three.js and React Three Fiber
- Jotai for state management
- Tailwind CSS for styling
- Vite for development and building

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Start the development server with `npm run dev`
4. Build for production with `npm run build`
5. Deploy to GitHub Pages with `npm run deploy`

## Adding New Books

Books are stored in the `/public/Content/` directory, with each book in its own subdirectory:

```
/public/Content/
  /Story1/
    /textures/
      Front.jpg
      Back.jpg
      red-truck.jpeg
      Truck2.jpeg
      Truck3.jpeg
    manifest.json
```

Each book requires a `manifest.json` file describing the book and its pages.

In additoin, `knownStoryDirs` should be update with the name if the new story folder

## License

[Add your license information here]