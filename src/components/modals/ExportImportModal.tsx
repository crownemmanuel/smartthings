'use client';

import { useState, useRef, useEffect } from 'react';
import { useShowStore } from '@/store/showStore';
import { exportShowAsJSON, importShowFromJSON } from '@/lib/storage';
import { isCloudAvailable, listCloudShows, saveToCloud, loadFromCloud, deleteFromCloud, type CloudShow } from '@/lib/cloudSync';

interface ExportImportModalProps {
  onClose: () => void;
}

type Tab = 'local' | 'cloud';

export default function ExportImportModal({ onClose }: ExportImportModalProps) {
  const { currentShow, importShow } = useShowStore();
  const [activeTab, setActiveTab] = useState<Tab>('local');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Cloud state
  const [cloudShows, setCloudShows] = useState<CloudShow[]>([]);
  const [cloudName, setCloudName] = useState('');
  const [cloudAvailable, setCloudAvailable] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setCloudAvailable(isCloudAvailable());
    if (isCloudAvailable()) {
      loadCloudShows();
    }
    if (currentShow) {
      setCloudName(currentShow.name);
    }
  }, [currentShow]);
  
  const loadCloudShows = async () => {
    try {
      const shows = await listCloudShows();
      setCloudShows(shows);
    } catch (err) {
      console.error('Failed to load cloud shows:', err);
    }
  };
  
  // Export as JSON
  const handleExportJSON = () => {
    if (!currentShow) return;
    exportShowAsJSON(currentShow);
    setSuccess('Show exported successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };
  
  // Import from JSON
  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const show = await importShowFromJSON(file);
      importShow(show);
      setSuccess('Show imported successfully!');
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import show');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Save to cloud
  const handleSaveToCloud = async () => {
    if (!currentShow || !cloudName.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await saveToCloud(currentShow, cloudName.trim());
      setSuccess('Saved to cloud!');
      loadCloudShows();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save to cloud');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load from cloud
  const handleLoadFromCloud = async (cloudShowId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const show = await loadFromCloud(cloudShowId);
      importShow(show);
      setSuccess('Loaded from cloud!');
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load from cloud');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete from cloud
  const handleDeleteFromCloud = async (cloudShowId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await deleteFromCloud(cloudShowId);
      loadCloudShows();
      setSuccess('Deleted from cloud!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete from cloud');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Export / Import</h2>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('local')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'local'
                  ? 'bg-amber-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              JSON File
            </button>
            <button
              onClick={() => setActiveTab('cloud')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'cloud'
                  ? 'bg-amber-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              } ${!cloudAvailable ? 'opacity-50' : ''}`}
            >
              Cloud Sync
              {!cloudAvailable && <span className="ml-1 text-xs">(Not configured)</span>}
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-emerald-900/30 border border-emerald-800 rounded-lg">
              <p className="text-sm text-emerald-400">{success}</p>
            </div>
          )}
          
          {activeTab === 'local' ? (
            <div className="space-y-6">
              {/* Export Section */}
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-3">Export Current Show</h3>
                <button
                  onClick={handleExportJSON}
                  disabled={!currentShow || isLoading}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download as JSON
                </button>
                {!currentShow && (
                  <p className="text-xs text-zinc-500 mt-2">Select or create a show first</p>
                )}
              </div>
              
              {/* Import Section */}
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-3">Import Show</h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                  id="json-import"
                />
                <label
                  htmlFor="json-import"
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {isLoading ? 'Importing...' : 'Upload JSON File'}
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {!cloudAvailable ? (
                <div className="text-center py-8">
                  <p className="text-zinc-400 mb-2">Cloud sync is not configured</p>
                  <p className="text-xs text-zinc-500">
                    Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
                  </p>
                </div>
              ) : (
                <>
                  {/* Save to Cloud */}
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400 mb-3">Save to Cloud</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cloudName}
                        onChange={(e) => setCloudName(e.target.value)}
                        placeholder="Show name in cloud..."
                        className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                      />
                      <button
                        onClick={handleSaveToCloud}
                        disabled={!currentShow || !cloudName.trim() || isLoading}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors"
                      >
                        {isLoading ? '...' : 'Save'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Cloud Shows */}
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400 mb-3">Cloud Shows</h3>
                    {cloudShows.length === 0 ? (
                      <p className="text-sm text-zinc-500 text-center py-4">
                        No shows saved to cloud yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {cloudShows.map((show) => (
                          <div
                            key={show.id}
                            className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
                          >
                            <div>
                              <p className="text-white font-medium">{show.name}</p>
                              <p className="text-xs text-zinc-500">
                                {new Date(show.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleLoadFromCloud(show.id)}
                                disabled={isLoading}
                                className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded transition-colors"
                              >
                                Load
                              </button>
                              <button
                                onClick={() => handleDeleteFromCloud(show.id)}
                                disabled={isLoading}
                                className="px-3 py-1 bg-red-900/50 hover:bg-red-800 text-red-400 text-sm rounded transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}





