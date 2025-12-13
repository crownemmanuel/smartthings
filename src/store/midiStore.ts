import { create } from 'zustand';
import type { MIDIMapping, MIDIActionType } from '@/types';

const MIDI_DEVICE_KEY = 'stage-control-midi-device';
const MIDI_OUTPUT_KEY = 'stage-control-midi-output';
const MIDI_LOOPBACK_KEY = 'stage-control-midi-loopback';

interface MIDIInput {
  id: string;
  name: string;
  manufacturer: string;
}

interface MIDIOutput {
  id: string;
  name: string;
  manufacturer: string;
}

// Save selected MIDI device to localStorage
function saveSelectedDevice(deviceId: string | null): void {
  if (typeof window === 'undefined') return;
  if (deviceId) {
    localStorage.setItem(MIDI_DEVICE_KEY, deviceId);
  } else {
    localStorage.removeItem(MIDI_DEVICE_KEY);
  }
}

// Get saved MIDI device from localStorage
function getSavedDevice(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(MIDI_DEVICE_KEY);
}

// Save selected MIDI output to localStorage
function saveSelectedOutput(outputId: string | null): void {
  if (typeof window === 'undefined') return;
  if (outputId) {
    localStorage.setItem(MIDI_OUTPUT_KEY, outputId);
  } else {
    localStorage.removeItem(MIDI_OUTPUT_KEY);
  }
}

// Get saved MIDI output from localStorage
function getSavedOutput(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(MIDI_OUTPUT_KEY);
}

// Save loopback enabled state
function saveLoopbackEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MIDI_LOOPBACK_KEY, enabled ? 'true' : 'false');
}

// Get loopback enabled state
function getLoopbackEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(MIDI_LOOPBACK_KEY) === 'true';
}

interface MIDIStoreState {
  // Connection state
  isSupported: boolean;
  isConnected: boolean;
  midiAccess: MIDIAccess | null;
  
  // Available inputs
  availableInputs: MIDIInput[];
  selectedInputId: string | null;
  
  // Available outputs (for loopback)
  availableOutputs: MIDIOutput[];
  selectedOutputId: string | null;
  loopbackEnabled: boolean;
  
  // Learning mode
  isLearning: boolean;
  learningCallback: ((note: number, channel: number) => void) | null;
  
  // Last received note (for display) - includes eventId to detect repeated presses
  lastNote: { note: number; channel: number; velocity: number; eventId: number } | null;
  
  // Error
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  selectInput: (inputId: string) => void;
  disconnect: () => void;
  selectOutput: (outputId: string | null) => void;
  setLoopbackEnabled: (enabled: boolean) => void;
  
  // Learning mode
  startLearning: (callback: (note: number, channel: number) => void) => void;
  stopLearning: () => void;
  
  // MIDI message handler registration
  onNoteOn: ((note: number, channel: number, velocity: number) => void) | null;
  setNoteOnHandler: (handler: (note: number, channel: number, velocity: number) => void) => void;
}

let noteEventCounter = 0;

export const useMIDIStore = create<MIDIStoreState>((set, get) => ({
  isSupported: typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator,
  isConnected: false,
  midiAccess: null,
  availableInputs: [],
  selectedInputId: null,
  availableOutputs: [],
  selectedOutputId: null,
  loopbackEnabled: getLoopbackEnabled(),
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
      
      const outputs: MIDIOutput[] = [];
      midiAccess.outputs.forEach((output) => {
        outputs.push({
          id: output.id,
          name: output.name || 'Unknown Output',
          manufacturer: output.manufacturer || 'Unknown',
        });
      });
      
      set({ 
        midiAccess, 
        availableInputs: inputs,
        availableOutputs: outputs,
        isConnected: true,
        error: null 
      });
      
      // Try to reconnect to last used input device
      const savedDeviceId = getSavedDevice();
      if (savedDeviceId && inputs.some(i => i.id === savedDeviceId)) {
        get().selectInput(savedDeviceId);
      }
      
      // Try to reconnect to last used output device
      const savedOutputId = getSavedOutput();
      if (savedOutputId && outputs.some(o => o.id === savedOutputId)) {
        get().selectOutput(savedOutputId);
      }
      
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
        
        const newOutputs: MIDIOutput[] = [];
        midiAccess.outputs.forEach((output) => {
          newOutputs.push({
            id: output.id,
            name: output.name || 'Unknown Output',
            manufacturer: output.manufacturer || 'Unknown',
          });
        });
        
        set({ availableInputs: newInputs, availableOutputs: newOutputs });
        
        // Try to reconnect to saved input device if it becomes available
        const { selectedInputId, selectedOutputId } = get();
        const savedInput = getSavedDevice();
        if (!selectedInputId && savedInput && newInputs.some(i => i.id === savedInput)) {
          get().selectInput(savedInput);
        }
        
        // Try to reconnect to saved output device if it becomes available
        const savedOutput = getSavedOutput();
        if (!selectedOutputId && savedOutput && newOutputs.some(o => o.id === savedOutput)) {
          get().selectOutput(savedOutput);
        }
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
          
          // Increment event counter to ensure each press is unique
          noteEventCounter++;
          set({ lastNote: { note, channel, velocity, eventId: noteEventCounter } });
          
          // Forward to output if loopback is enabled
          const { loopbackEnabled, selectedOutputId, midiAccess: access } = get();
          if (loopbackEnabled && selectedOutputId && access) {
            const output = access.outputs.get(selectedOutputId);
            if (output) {
              // Forward the original MIDI message
              output.send(event.data);
            }
          }
          
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
        
        // Also forward Note Off messages if loopback is enabled
        if ((status >= 128 && status <= 143) || (status >= 144 && status <= 159 && velocity === 0)) {
          const { loopbackEnabled, selectedOutputId, midiAccess: access } = get();
          if (loopbackEnabled && selectedOutputId && access) {
            const output = access.outputs.get(selectedOutputId);
            if (output) {
              output.send(event.data);
            }
          }
        }
      };
      
      set({ selectedInputId: inputId });
      saveSelectedDevice(inputId);
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
    saveSelectedDevice(null);
  },
  
  selectOutput: (outputId) => {
    set({ selectedOutputId: outputId });
    saveSelectedOutput(outputId);
  },
  
  setLoopbackEnabled: (enabled) => {
    set({ loopbackEnabled: enabled });
    saveLoopbackEnabled(enabled);
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
