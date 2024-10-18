import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { Controls } from './components/Controls';
import { BookmarkManager } from './components/BookmarkManager';
import { ObjectList } from './components/ObjectList';
import { CanvasObject, Point, Bookmark, ProjectData } from './types';
import './App.css';

const App: React.FC = () => {
  const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>([]);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [currentDepth, setCurrentDepth] = useState(0);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1000);
  const [selectedObject, setSelectedObject] = useState<CanvasObject | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = zoom * zoomFactor;
      setZoom(newZoom);

      const rect = canvasRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setPosition(prev => ({
        x: mouseX - (mouseX - prev.x) * zoomFactor,
        y: mouseY - (mouseY - prev.y) * zoomFactor,
      }));

      if (newZoom > 2 && zoom <= 2) {
        setCurrentDepth(prev => prev + 1);
      } else if (newZoom < 0.5 && zoom >= 0.5) {
        setCurrentDepth(prev => Math.max(0, prev - 1));
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('wheel', handleWheel);
      }
    };
  }, [zoom]);

  const handleAddObject = (object: CanvasObject) => {
    setCanvasObjects(prev => [...prev, { ...object, id: Date.now().toString() }]);
  };

  const handleUpdateObject = (updatedObject: CanvasObject) => {
    setCanvasObjects(prev =>
      prev.map(obj => (obj.id === updatedObject.id ? updatedObject : obj))
    );
    setSelectedObject(null);
  };

  const handleSelectObject = (object: CanvasObject | null) => {
    setSelectedObject(object);
  };

  const addBookmark = () => {
    const newBookmark: Bookmark = {
      zoom,
      position,
      objects: canvasObjects.filter(obj => obj.depth === currentDepth),
      depth: currentDepth,
    };
    setBookmarks(prev => [...prev, newBookmark]);
  };

  const goToBookmark = (bookmark: Bookmark, duration: number = 1000) => {
    const startZoom = zoom;
    const startPosition = { ...position };
    const startDepth = currentDepth;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeInOutCubic(progress);

      setZoom(lerp(startZoom, bookmark.zoom, easeProgress));
      setPosition({
        x: lerp(startPosition.x, bookmark.position.x, easeProgress),
        y: lerp(startPosition.y, bookmark.position.y, easeProgress),
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentDepth(bookmark.depth);
        setCanvasObjects(prev => [
          ...prev.filter(obj => obj.depth !== bookmark.depth),
          ...bookmark.objects,
        ]);
        setIsAnimating(false);
      }
    };

    setIsAnimating(true);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(animate);
  };

  const playAnimation = () => {
    let currentIndex = 0;
    const playNextBookmark = () => {
      if (currentIndex < bookmarks.length) {
        goToBookmark(bookmarks[currentIndex], animationSpeed);
        currentIndex++;
        setTimeout(playNextBookmark, animationSpeed + 100);
      }
    };
    playNextBookmark();
  };

  const reorderBookmarks = (startIndex: number, endIndex: number) => {
    const newBookmarks = Array.from(bookmarks);
    const [reorderedItem] = newBookmarks.splice(startIndex, 1);
    newBookmarks.splice(endIndex, 0, reorderedItem);
    setBookmarks(newBookmarks);
  };

  const exportProject = () => {
    const projectData: ProjectData = {
      canvasObjects,
      bookmarks,
      currentDepth,
      zoom,
      position,
    };
    const dataStr = JSON.stringify(projectData);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'infinite_canvas_project.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importProject = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const projectData: ProjectData = JSON.parse(event.target?.result as string);
        setCanvasObjects(projectData.canvasObjects);
        setBookmarks(projectData.bookmarks);
        setCurrentDepth(projectData.currentDepth);
        setZoom(projectData.zoom);
        setPosition(projectData.position);
      } catch (error) {
        console.error('Error importing project:', error);
        alert('Failed to import project. The file may be corrupted or in an incorrect format.');
      }
    };
    reader.readAsText(file);
  };

  const jumpToObject = (object: CanvasObject) => {
    setCurrentDepth(object.depth);
    setZoom(1);
    setPosition({ x: -object.x + window.innerWidth / 2, y: -object.y + window.innerHeight / 2 });
  };

  return (
    <div className="App">
      <Canvas
        ref={canvasRef}
        objects={canvasObjects}
        zoom={zoom}
        position={position}
        setPosition={setPosition}
        isEditing={isEditing}
        currentDepth={currentDepth}
        selectedObject={selectedObject}
        onSelectObject={handleSelectObject}
        onUpdateObject={handleUpdateObject}
      />
      <Controls
        onAddObject={handleAddObject}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        zoom={zoom}
        setZoom={setZoom}
        currentDepth={currentDepth}
        setCurrentDepth={setCurrentDepth}
        addBookmark={addBookmark}
        exportProject={exportProject}
        importProject={importProject}
      />
      <BookmarkManager
        bookmarks={bookmarks}
        goToBookmark={goToBookmark}
        playAnimation={playAnimation}
        animationSpeed={animationSpeed}
        setAnimationSpeed={setAnimationSpeed}
        reorderBookmarks={reorderBookmarks}
        isAnimating={isAnimating}
      />
      <ObjectList
        objects={canvasObjects}
        onJumpToObject={jumpToObject}
        currentDepth={currentDepth}
      />
      <div className="depth-indicator">Depth: {currentDepth}</div>
    </div>
  );
};

function lerp(start: number, end: number, t: number): number {
  return start * (1 - t) + end * t;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default App;