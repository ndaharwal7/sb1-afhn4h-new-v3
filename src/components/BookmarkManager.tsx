import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Bookmark } from '../types';

interface BookmarkManagerProps {
  bookmarks: Bookmark[];
  goToBookmark: (bookmark: Bookmark) => void;
  playAnimation: () => void;
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  reorderBookmarks: (startIndex: number, endIndex: number) => void;
  isAnimating: boolean;
}

export const BookmarkManager: React.FC<BookmarkManagerProps> = ({
  bookmarks,
  goToBookmark,
  playAnimation,
  animationSpeed,
  setAnimationSpeed,
  reorderBookmarks,
  isAnimating,
}) => {
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    reorderBookmarks(result.source.index, result.destination.index);
  };

  return (
    <div className="bookmark-manager">
      <h3>Bookmarks</h3>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="bookmarks">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef}>
              {bookmarks.map((bookmark, index) => (
                <Draggable key={`bookmark-${index}`} draggableId={`bookmark-${index}`} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <button onClick={() => goToBookmark(bookmark)} disabled={isAnimating}>
                        Bookmark {index + 1} (Depth: {bookmark.depth})
                      </button>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
      <button onClick={playAnimation} disabled={isAnimating}>
        {isAnimating ? 'Animating...' : 'Play Animation'}
      </button>
      <label>
        Animation Speed: {animationSpeed}ms
        <input
          type="range"
          min="500"
          max="5000"
          value={animationSpeed}
          onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
        />
      </label>
    </div>
  );
};