'use client';

import { useState } from 'react';
import type { SceneWithGroups } from '@/types';

const SCENE_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#6366f1', // indigo
];

interface SceneModalProps {
  scene?: SceneWithGroups;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
}

export default function SceneModal({ scene, onClose, onSave }: SceneModalProps) {
  const [name, setName] = useState(scene?.name || '');
  const [color, setColor] = useState(scene?.color || SCENE_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);
  
  const isEditing = Boolean(scene);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave(name.trim(), color);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          {isEditing ? 'Edit Scene' : 'Create New Scene'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Scene Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Opening Act"
              autoFocus
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {SCENE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c 
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' 
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSaving}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Scene'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}





