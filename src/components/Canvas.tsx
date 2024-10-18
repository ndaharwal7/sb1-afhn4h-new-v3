import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { CanvasObject, Point } from '../types';

interface CanvasProps {
  objects: CanvasObject[];
  zoom: number;
  position: Point;
  setPosition: (position: Point) => void;
  isEditing: boolean;
  currentDepth: number;
  selectedObject: CanvasObject | null;
  onSelectObject: (object: CanvasObject | null) => void;
  onUpdateObject: (object: CanvasObject) => void;
}

export const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(
  ({ objects, zoom, position, setPosition, isEditing, currentDepth, selectedObject, onSelectObject, onUpdateObject }, ref) => {
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
    const svgCache = useRef<Map<string, HTMLImageElement>>(new Map());

    useEffect(() => {
      const canvas = (ref as React.RefObject<HTMLCanvasElement>).current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const context = canvas.getContext('2d');
        if (context) {
          contextRef.current = context;
        }
      }
    }, []);

    useEffect(() => {
      const context = contextRef.current;
      if (context) {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        context.save();
        context.translate(position.x, position.y);
        context.scale(zoom, zoom);

        objects.forEach(obj => {
          const depthDifference = Math.abs(obj.depth - currentDepth);
          const opacity = isEditing ? Math.max(0, 1 - depthDifference * 0.5) : depthDifference === 0 ? 1 : 0;

          if (opacity > 0) {
            context.globalAlpha = opacity;
            context.beginPath();
            if (obj.type === 'circle') {
              context.arc(obj.x, obj.y, obj.radius!, 0, 2 * Math.PI);
              context.fillStyle = obj.color;
              context.fill();
            } else if (obj.type === 'rect') {
              context.rect(obj.x, obj.y, obj.width!, obj.height!);
              context.fillStyle = obj.color;
              context.fill();
            } else if (obj.type === 'svg') {
              renderSVG(context, obj);
            }
            context.lineWidth = obj.strokeWidth / zoom;
            context.strokeStyle = obj.id === selectedObject?.id ? 'red' : 'black';
            context.stroke();
          }
        });

        context.restore();
      }
    }, [objects, zoom, position, isEditing, currentDepth, selectedObject]);

    const renderSVG = (context: CanvasRenderingContext2D, obj: CanvasObject) => {
      if (!svgCache.current.has(obj.svgContent!)) {
        const img = new Image();
        img.src = obj.svgContent!;
        img.onload = () => {
          svgCache.current.set(obj.svgContent!, img);
          context.drawImage(img, obj.x, obj.y, obj.width!, obj.height!);
        };
      } else {
        const img = svgCache.current.get(obj.svgContent!);
        context.drawImage(img!, obj.x, obj.y, obj.width!, obj.height!);
      }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - position.x) / zoom;
      const y = (e.clientY - rect.top - position.y) / zoom;

      const clickedObject = objects.find(obj => {
        if (obj.type === 'circle') {
          const distance = Math.sqrt(Math.pow(x - obj.x, 2) + Math.pow(y - obj.y, 2));
          return distance <= obj.radius!;
        } else if (obj.type === 'rect' || obj.type === 'svg') {
          return x >= obj.x && x <= obj.x + obj.width! && y >= obj.y && y <= obj.y + obj.height!;
        }
        return false;
      });

      if (clickedObject && isEditing) {
        onSelectObject(clickedObject);
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
      } else {
        onSelectObject(null);
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isDragging) {
        if (selectedObject && isEditing) {
          const dx = (e.clientX - dragStart.x) / zoom;
          const dy = (e.clientY - dragStart.y) / zoom;
          const updatedObject = {
            ...selectedObject,
            x: selectedObject.x + dx,
            y: selectedObject.y + dy,
          };
          onUpdateObject(updatedObject);
          setDragStart({ x: e.clientX, y: e.clientY });
        } else {
          const newPosition = {
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
          };
          setPosition(newPosition);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    return (
      <canvas
        ref={ref}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    );
  }
);