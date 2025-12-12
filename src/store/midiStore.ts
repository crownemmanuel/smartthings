import { create } from 'zustand';
import type { MIDIMapping, MIDIActionType } from '@/types';

interface MIDIInput {
  id: string;
  name: string;
  manufacturer: string;
}

interface MIDIStoreState {
  // Connection state
  isSupported: boolean;
  isConnected: boolean;
  midiAccess: MIDIAccess | null;
  
  // Available inputs
  availableInputs: MIDIInput[];
  selectedInputId: string | null;
  
  // Learning mode
  isLearning: boolean;
  learningCallback: ((note: number, channel: number) => void) | null;
  
  // Last received note (for display)
  lastNote: { note: number; channel: number; velocity: number } | null;
  
  // Error
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  selectInput: (inputId: string) => void;
  disconnect: () => void;
  
  // Learning mode
  startLearning: (callback: (note: number, channel: number) => void) => void;
  stopLearning: () => void;
  
  // MIDI message handler registration
  onNoteOn: ((note: number, channel: number, velocity: number) => void) | null;
  setNoteOnHandler: (handler: (note: number, channel: number, velocity: number) => void) => void;
}

export const useMIDIStore = create<MIDIStoreState>((set, get) => ({
  isSupported: typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator,
  isConnected: false,
  midiAccess: null,
  availableInputs: [],
  selectedInputId: null,
  isLearning: false,
  learningCallback: null,
  lastNote: null,
  error: null,
  onNoteOn: null,
  
  initialize: async () => {
    if (typeof navigator === 'undefined' || !('requestMIDIAccess' in navigator)) {
      set({ error: 'Web MIDI API not supported in this browser' });
      return;
    }
    
    try {
      const midiAccess = await navigator.requestMIDIAccess();
      
      const inputs: MIDIInput[] = [];
      midiAccess.inputs.forEach((input) => {
        inputs.push({
          id: input.id,
          name: input.name || 'Unknown Device',
          manufacturer: input.manufacturer || 'Unknown',
        });
      });
      
      set({ 
        midiAccess, 
        availableInputs: inputs,
        isConnected: true,
        error: null 
      });
      
      // Listen for device changes
      midiAccess.onstatechange = () => {
        const newInputs: MIDIInput[] = [];
        midiAccess.inputs.forEach((input) => {
          newInputs.push({
            id: input.id,
            name: input.name || 'Unknown Device',
            manufacturer: input.manufacturer || 'Unknown',
          });
        });
        set({ availableInputs: newInputs });
      };
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to access MIDI devices' 
      });
    }
  },
  
  selectInput: (inputId) => {
    const { midiAccess, selectedInputId } = get();
    
    if (!midiAccess) return;
    
    // Disconnect from previous input
    if (selectedInputId) {
      const prevInput = midiAccess.inputs.get(selectedInputId);
      if (prevInput) {
        prevInput.onmidimessage = null;
      }
    }
    
    // Connect to new input
    const input = midiAccess.inputs.get(inputId);
    if (input) {
      input.onmidimessage = (event) => {
        const data = event.data;
        if (!data) return;
        
        const status = data[0];
        const note = data[1];
        const velocity = data[2];
        
        // Note On message (status 144-159 for channels 1-16)
        // Note: velocity 0 is often used as Note Off
        if (status >= 144 && status <= 159 && velocity > 0) {
          const channel = status - 144;
          
          set({ lastNote: { note, channel, velocity } });
          
          // If in learning mode, call the callback
          const { isLearning, learningCallback } = get();
          if (isLearning && learningCallback) {
            learningCallback(note, channel);
            set({ isLearning: false, learningCallback: null });
          }
          
          // Call the note on handler
          const { onNoteOn } = get();
          if (onNoteOn) {
            onNoteOn(note, channel, velocity);
          }
        }
      };
      
      set({ selectedInputId: inputId });
    }
  },
  
  disconnect: () => {
    const { midiAccess, selectedInputId } = get();
    
    if (midiAccess && selectedInputId) {
      const input = midiAccess.inputs.get(selectedInputId);
      if (input) {
        input.onmidimessage = null;
      }
    }
    
    set({ selectedInputId: null });
  },
  
  startLearning: (callback) => {
    set({ isLearning: true, learningCallback: callback });
  },
  
  stopLearning: () => {
    set({ isLearning: false, learningCallback: null });
  },
  
  setNoteOnHandler: (handler) => {
    set({ onNoteOn: handler });
  },
}));

// Helper to convert MIDI note number to note name
export function midiNoteToName(note: number): string {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(note / 12) - 1;
  const noteName = notes[note % 12];
  return `${noteName}${octave}`;
}

// Helper to describe MIDI action types
export function getMIDIActionLabel(actionType: MIDIActionType): string {
  switch (actionType) {
    case 'device_group_on': return 'Turn Group ON';
    case 'device_group_off': return 'Turn Group OFF';
    case 'device_group_toggle': return 'Toggle Group';
    case 'sequence_play': return 'Play Sequence';
    case 'scene_activate': return 'Activate Scene';
    case 'blackout': return 'Blackout';
    default: return 'Unknown';
  }
}
