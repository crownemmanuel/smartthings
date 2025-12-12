'use client';

import { useState } from 'react';
import type { SequenceWithSteps } from '@/types';

interface SequenceListProps {
  sequences: SequenceWithSteps[];
  isEditMode: boolean;
  onEdit: (sequence: SequenceWithSteps) => void;
  onDelete: (sequenceId: string) => void;
  onPlay: (sequence: SequenceWithSteps) => void;
  onVisualize?: (sequence: SequenceWithSteps) => void;
}

export default function SequenceList({
  sequences,
  isEditMode,
  onEdit,
  onDelete,
  onPlay,
  onVisualize,
}: SequenceListProps) {
  const [playingSequenceId, setPlayingSequenceId] = useState<string | null>(null);
  
  const handlePlay = async (sequence: SequenceWithSteps) => {
    setPlayingSequenceId(sequence.id);
    try {
      await onPlay(sequence);
    } finally {
      setPlayingSequenceId(null);
    }
  };
  
  if (sequences.length === 0) {
    return (
      <div className="text-center py-8 bg-zinc-900/50 rounded-lg border border-zinc-800 border-dashed">
        <svg className="w-12 h-12 mx-auto text-zinc-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-zinc-500 text-sm">No sequences created</p>
        {isEditMode && (
          <p className="text-zinc-600 text-xs mt-1">Create a sequence for timed light effects</p>
        )}
      </div>
    );
  }
  
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {sequences.map((sequence) => {
        const isPlaying = playingSequenceId === sequence.id;
        const totalDuration = sequence.steps.reduce((acc, step) => acc + step.delay_ms, 0);
        
        return (
          <div
            key={sequence.id}
            className={`bg-zinc-900 rounded-xl border overflow-hidden transition-all ${
              isPlaying 
                ? 'border-amber-500 shadow-lg shadow-amber-500/20' 
                : 'border-zinc-800'
            }`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-white">{sequence.name}</h4>
                
                {isEditMode && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(sequence)}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                      title="Edit Sequence"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(sequence.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                      title="Delete Sequence"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-xs text-zinc-500 mb-4">
                <span>{sequence.steps.length} step{sequence.steps.length !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>{(totalDuration / 1000).toFixed(1)}s duration</span>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-2">
                {/* Visualize button */}
                {onVisualize && (
                  <button
                    onClick={() => onVisualize(sequence)}
                    disabled={sequence.steps.length === 0}
                    className="flex-1 py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white"
                    title="Preview sequence visually"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    PREVIEW
                  </button>
                )}
                
                {/* Play button */}
                <button
                  onClick={() => handlePlay(sequence)}
                  disabled={isPlaying || sequence.steps.length === 0}
                  className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    isPlaying
                      ? 'bg-amber-600 text-white cursor-not-allowed'
                      : sequence.steps.length === 0
                        ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      LIVE
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      LIVE
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

