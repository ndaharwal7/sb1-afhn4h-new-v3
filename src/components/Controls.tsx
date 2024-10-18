import React, { useState, useRef } from 'react';
import { CanvasObject } from '../types';

interface ControlsProps {
  onAddObject: (object: CanvasObject) => void;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  currentDepth: number;
  setCurrentDepth: (depth: number) => void;
  addBookmark: () => void;
  exportProject: () => void;
  importProject: (file: File) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  onAddObject,
  isEditing,
  setIsEditing,
  zoom,
  setZoom,
  currentDepth,
  setCurrentDepth,
  addBookmark,
  exportProject,
  importProject,
}) => {
  const [objectType, setObjectType] = useState<'circle' | 'rect' | 'svg'>('circle');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [objectSize, setObjectSize] = useState(100);
  const [objectDepth, setObjectDepth] = useState(currentDepth);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgInputRef = useRef<HTMLInputElement>(null);

  const handleAddObject = () => {
    const newObject: CanvasObject = {
      id: Date.now().toString(),
      type: objectType,
      x: Math.random() * window.innerWidth / zoom,
      y: Math.random() * window.innerHeight / zoom,
      color,
      depth: objectDepth,
      strokeWidth,
    };

    if (objectType === 'circle') {
      newObject.radius = objectSize / (2 * zoom);
    } else if (objectType === 'rect') {
      newObject.width = objectSize / zoom;
      newObject.height = objectSize / zoom;
    }

    onAddObject(newObject);
  };

  const handleSVGUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const svgContent = event.target?.result as string;
        const newObject: CanvasObject = {
          id: Date.now().toString(),
          type: 'svg',
          x: Math.random() * window.innerWidth / zoom,
          y: Math.random() * window.innerHeight / zoom,
          color,
          depth: objectDepth,
          strokeWidth,
          width: objectSize / zoom,
          height: objectSize / zoom,
          svgContent,
        };
        onAddObject(newObject);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importProject(file);
    }
  };

  return (
    <div className="controls">
      <h3>Controls</h3>
      <select value={objectType} onChange={(e) => setObjectType(e.target.value as 'circle' | 'rect' | 'svg')}>
        <option value="circle">Circle</option>
        <option value="rect">Rectangle</option>
        <option value="svg">SVG</option>
      </select>
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
      <label>
        Stroke Width: {strokeWidth}
        <input
          type="range"
          min="1"
          max="20"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
        />
      </label>
      <label>
        Object Size: {objectSize}
        <input
          type="range"
          min="10"
          max="500"
          value={objectSize}
          onChange={(e) => setObjectSize(parseInt(e.target.value))}
        />
      </label>
      <label>
        Object Depth: {objectDepth}
        <input
          type="number"
          value={objectDepth}
          onChange={(e) => setObjectDepth(parseInt(e.target.value))}
        />
      </label>
      {objectType === 'svg' ? (
        <>
          <input
            type="file"
            accept=".svg"
            ref={svgInputRef}
            style={{ display: 'none' }}
            onChange={handleSVGUpload}
          />
          <button onClick={() => svgInputRef.current?.click()}>Upload SVG</button>
        </>
      ) : (
        <button onClick={handleAddObject}>Add {objectType}</button>
      )}
      <button onClick={() => setIsEditing(!isEditing)}>
        {isEditing ? 'View Mode' : 'Edit Mode'}
      </button>
      <button onClick={() => setZoom(zoom * 1.1)}>Zoom In</button>
      <button onClick={() => setZoom(zoom * 0.9)}>Zoom Out</button>
      <button onClick={() => setCurrentDepth(currentDepth + 1)}>Increase Depth</button>
      <button onClick={() => setCurrentDepth(currentDepth - 1)}>Decrease Depth</button>
      <button onClick={addBookmark}>Add Bookmark</button>
      <button onClick={exportProject}>Export Project</button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleImportProject}
      />
      <button onClick={() => fileInputRef.current?.click()}>Import Project</button>
    </div>
  );
};