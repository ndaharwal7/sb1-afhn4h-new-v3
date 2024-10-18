export interface Point {
  x: number;
  y: number;
}

export interface CanvasObject {
  type: 'circle' | 'rect' | 'svg';
  x: number;
  y: number;
  color: string;
  depth: number;
  strokeWidth: number;
  radius?: number;
  width?: number;
  height?: number;
  svgContent?: string;
}

export interface Bookmark {
  zoom: number;
  position: Point;
  objects: CanvasObject[];
  depth: number;
}

export interface ProjectData {
  canvasObjects: CanvasObject[];
  bookmarks: Bookmark[];
  currentDepth: number;
  zoom: number;
  position: Point;
}