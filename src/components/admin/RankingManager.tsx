'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { updateRankings, removeContestant } from '@/actions/competitions';
import Image from 'next/image';

interface RankingEntry {
  id: string; // Entry ID
  rank: number;
  placement: string | null;
  representingCountry: string | null;
  specialAwards: string[];
  celebrity: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface RankingManagerProps {
  competitionId: string;
  initialEntries: RankingEntry[];
  onUpdate?: () => void;
}

export default function RankingManager({ competitionId, initialEntries, onUpdate }: RankingManagerProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with prop updates
  if (initialEntries !== entries && !isSaving) {
      // Note: This is a simplistic check. Real world would need deep compare or useEffect
      // skipping for now to rely on parent re-render or manual state updates
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(entries);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Optimistic UI update
    // Recalculate ranks based on new order
    const updatedItems = items.map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    setEntries(updatedItems);
  };

  const saveRankings = async () => {
    setIsSaving(true);
    const updates = entries.map((entry) => ({
      entryId: entry.id,
      rank: entry.rank,
      placement: entry.placement || undefined
    }));

    const result = await updateRankings(competitionId, updates);
    setIsSaving(false);

    if (result.success) {
      if (onUpdate) onUpdate();
    } else {
      alert('Failed to save rankings');
    }
  };

  const handleRemove = async (celebrityId: string) => {
    if (!confirm('Remove contestant?')) return;

    const result = await removeContestant(competitionId, celebrityId);
    if (result.success) {
        setEntries(prev => prev.filter(e => e.celebrity.id !== celebrityId));
        if (onUpdate) onUpdate();
    } else {
        alert('Failed to remove contestant');
    }
  };

  const handlePlacementChange = (id: string, value: string) => {
    setEntries(prev => prev.map(e =>
      e.id === id ? { ...e, placement: value } : e
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Rankings & Contestants</h3>
        <button
          onClick={saveRankings}
          disabled={isSaving}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50 min-h-[44px]"
        >
          {isSaving ? 'Saving...' : 'Save Rankings'}
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="rankings">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {entries.map((entry, index) => (
                <Draggable key={entry.id} draggableId={entry.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="flex items-center bg-gray-50 border rounded-md p-3 group hover:bg-gray-100"
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="mr-3 cursor-move text-gray-400 hover:text-gray-600"
                      >
                        ⋮⋮
                      </div>

                      {/* Rank Number */}
                      <div className="w-10 font-bold text-gray-500 text-center mr-4">
                        #{entry.rank}
                      </div>

                      {/* Celebrity Info */}
                      <div className="flex items-center flex-1">
                         <div className="flex-shrink-0 h-10 w-10 relative mr-3">
                            {entry.celebrity.image ? (
                                <Image
                                src={entry.celebrity.image}
                                alt={entry.celebrity.name}
                                fill
                                className="rounded-full object-cover"
                                unoptimized
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200" />
                            )}
                        </div>
                        <div>
                            <div className="font-medium text-gray-900">{entry.celebrity.name}</div>
                            {entry.representingCountry && (
                                <div className="text-xs text-gray-500">
                                    Rep: {entry.representingCountry}
                                </div>
                            )}
                        </div>
                      </div>

                      {/* Placement Input */}
                      <div className="w-48 mx-4">
                        <input
                            type="text"
                            placeholder="Placement (e.g. Winner)"
                            value={entry.placement || ''}
                            onChange={(e) => handlePlacementChange(entry.id, e.target.value)}
                            className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemove(entry.celebrity.id)}
                        className="text-red-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {entries.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-md">
            No contestants added yet. Use the search bar above to add celebrities.
        </div>
      )}
    </div>
  );
}
