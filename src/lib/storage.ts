import type { FullShow, Show } from '@/types';

const STORAGE_KEY = 'stage-control-shows';
const CURRENT_SHOW_KEY = 'stage-control-current-show';

// Get all shows from localStorage
export function getLocalShows(): Show[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const shows = JSON.parse(data) as FullShow[];
    return shows.map(s => ({
      id: s.id,
      name: s.name,
      created_at: s.created_at,
      updated_at: s.updated_at,
    }));
  } catch (error) {
    console.error('Failed to load shows from localStorage:', error);
    return [];
  }
}

// Get a full show from localStorage
export function getLocalShow(showId: string): FullShow | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    
    const shows = JSON.parse(data) as FullShow[];
    return shows.find(s => s.id === showId) || null;
  } catch (error) {
    console.error('Failed to load show from localStorage:', error);
    return null;
  }
}

// Save a show to localStorage
export function saveLocalShow(show: FullShow): void {
  if (typeof window === 'undefined') return;
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const shows: FullShow[] = data ? JSON.parse(data) : [];
    
    const existingIndex = shows.findIndex(s => s.id === show.id);
    const updatedShow = {
      ...show,
      updated_at: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      shows[existingIndex] = updatedShow;
    } else {
      shows.push(updatedShow);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shows));
  } catch (error) {
    console.error('Failed to save show to localStorage:', error);
  }
}

// Delete a show from localStorage
export function deleteLocalShow(showId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;
    
    const shows: FullShow[] = JSON.parse(data);
    const filtered = shows.filter(s => s.id !== showId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete show from localStorage:', error);
  }
}

// Get current show ID
export function getCurrentShowId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_SHOW_KEY);
}

// Set current show ID
export function setCurrentShowId(showId: string | null): void {
  if (typeof window === 'undefined') return;
  
  if (showId) {
    localStorage.setItem(CURRENT_SHOW_KEY, showId);
  } else {
    localStorage.removeItem(CURRENT_SHOW_KEY);
  }
}

// Generate a unique ID
export function generateId(): string {
  return crypto.randomUUID();
}

// Export show as JSON file
export function exportShowAsJSON(show: FullShow): void {
  const json = JSON.stringify(show, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${show.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import show from JSON file
export function importShowFromJSON(file: File): Promise<FullShow> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const show = JSON.parse(json) as FullShow;
        
        // Validate the show structure
        if (!show.id || !show.name || !Array.isArray(show.scenes)) {
          throw new Error('Invalid show file format');
        }
        
        // Generate new ID to avoid conflicts
        const importedShow: FullShow = {
          ...show,
          id: generateId(),
          name: `${show.name} (imported)`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        resolve(importedShow);
      } catch (error) {
        reject(new Error('Failed to parse show file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Create a new empty show
export function createEmptyShow(name: string): FullShow {
  return {
    id: generateId(),
    name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    scenes: [],
    sequences: [],
    midi_mappings: [],
  };
}

