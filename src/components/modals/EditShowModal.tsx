'use client';

import { useState, useEffect } from 'react';

interface EditShowModalProps {
  showName: string;
  onClose: () => void;
  onSave: (name: string) => void;
}

export default function EditShowModal({ showName, onClose, onSave }: EditShowModalProps) {
  const [name, setName] = useState(showName);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    setName(showName);
  }, [showName]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === showName) {
      onClose();
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(name.trim());
      onClose();
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Edit Show Name</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Show Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Concert 2024"
              autoFocus
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
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
              disabled={!name.trim() || name.trim() === showName || isSaving}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
