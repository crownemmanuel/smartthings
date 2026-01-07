'use client';

import { useState } from 'react';
import { useShowStore } from '@/store/showStore';
import type { SceneWithGroups } from '@/types';

interface SidebarProps {
  onAddScene: () => void;
  onEditScene: (scene: SceneWithGroups) => void;
  onDeleteScene: (sceneId: string) => void;
}

export default function Sidebar({ onAddScene, onEditScene, onDeleteScene }: SidebarProps) {
  const { mode, currentShow, selectedSceneId, setSelectedSceneId } = useShowStore();
  const [hoveredSceneId, setHoveredSceneId] = useState<string | null>(null);
  
  const scenes = currentShow?.scenes || [];
  const isEditMode = mode === 'edit';
  const hasCurrentShow = Boolean(currentShow);
  
  return (
    <aside className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Scenes</h2>
          {isEditMode && (
            <button
              onClick={onAddScene}
              disabled={!hasCurrentShow}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-400"
              title={hasCurrentShow ? "Add Scene" : "Create or select a show first"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Scene List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {scenes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-500 text-sm">
              {hasCurrentShow ? 'No scenes yet' : 'Select or create a show first'}
            </p>
            {isEditMode && hasCurrentShow && (
              <button
                onClick={onAddScene}
                className="mt-3 text-sm text-amber-500 hover:text-amber-400"
              >
                Create your first scene
              </button>
            )}
          </div>
        ) : (
          scenes.map((scene, index) => (
            <div
              key={scene.id}
              onMouseEnter={() => setHoveredSceneId(scene.id)}
              onMouseLeave={() => setHoveredSceneId(null)}
              onClick={() => setSelectedSceneId(scene.id)}
              className={`relative group cursor-pointer rounded-lg transition-all ${
                selectedSceneId === scene.id
                  ? 'bg-zinc-800 ring-2 ring-amber-500/50'
                  : 'bg-zinc-850 hover:bg-zinc-800'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Color indicator */}
                  <div
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: scene.color }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white truncate">{scene.name}</h3>
                      {selectedSceneId === scene.id && (
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      {scene.device_groups.length} group{scene.device_groups.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                {/* Scene number badge */}
                <div className="absolute top-2 right-2 text-xs text-zinc-600 font-mono">
                  {index + 1}
                </div>
                
                {/* Edit/Delete buttons (edit mode only) */}
                {isEditMode && hoveredSceneId === scene.id && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditScene(scene); }}
                      className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                      title="Edit Scene"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteScene(scene.id); }}
                      className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded transition-colors"
                      title="Delete Scene"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Keyboard shortcuts hint (show mode) */}
      {!isEditMode && scenes.length > 0 && (
        <div className="p-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-600 text-center">
            Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-500">1</kbd>-<kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-500">9</kbd> to switch scenes
          </p>
        </div>
      )}
    </aside>
  );
}





