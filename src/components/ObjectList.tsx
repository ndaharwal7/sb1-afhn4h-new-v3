import React from 'react';
import { CanvasObject } from '../types';

interface ObjectListProps {
  objects: CanvasObject[];
  onJumpToObject: (object: CanvasObject) => void;
  currentDepth: number;
}

export const ObjectList: React.FC<ObjectListProps> = ({ objects, onJumpToObject, currentDepth }) => {
  return (
    <div className="object-list">
      <h3>Object List</h3>
      <ul>
        {objects.map((obj) => (
          <li key={obj.id}>
            <button onClick={() => onJumpToObject(obj)}>
              {obj.type} (Depth: {obj.depth})
              {obj.depth === currentDepth ? ' (Current)' : ''}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};