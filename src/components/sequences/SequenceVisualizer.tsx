'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useShowStore } from '@/store/showStore';
import { useMIDIStore, midiNoteToName } from '@/store/midiStore';
import type { SequenceWithSteps, TPLinkDevice, MIDIMapping } from '@/types';

interface SequenceVisualizerProps {
  sequence: SequenceWithSteps;
  availableDevices: TPLinkDevice[];
  onClose: () => void;
}

interface DeviceState {
  deviceId: string;
  deviceName: string;
  isOn: boolean;
}

interface MIDITrigger {
  note: number;
  noteName: string;
  action: string;
  timestamp: number;
}

export default function SequenceVisualizer({
  sequence,
  availableDevices,
  onClose,
}: SequenceVisualizerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [deviceStates, setDeviceStates] = useState<Map<string, DeviceState>>(new Map());
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [midiEnabled, setMidiEnabled] = useState(true);
  const [lastMidiTrigger, setLastMidiTrigger] = useState<MIDITrigger | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const pauseResolveRef = useRef<(() => void) | null>(null);
  
  const { currentShow, getDeviceGroupById, getSequenceById } = useShowStore();
  const { selectedInputId, lastNote } = useMIDIStore();
  
  // Get all devices used in this sequence
  const usedDevices = useCallback(() => {
    const deviceIds = new Set<string>();
    for (const step of sequence.steps) {
      for (const action of step.actions) {
        if (action.device_id) {
          deviceIds.add(action.device_id);
        }
      }
    }
    
    return Array.from(deviceIds).map(id => {
      const device = availableDevices.find(d => d.deviceId === id);
      const action = sequence.steps
        .flatMap(s => s.actions)
        .find(a => a.device_id === id);
      
      return {
        deviceId: id,
        deviceName: device?.alias || action?.device_name || 'Unknown Device',
      };
    });
  }, [sequence, availableDevices]);
  
  // Initialize device states - include ALL devices for MIDI visualization
  useEffect(() => {
    const sequenceDevices = usedDevices();
    const allDeviceIds = new Set(sequenceDevices.map(d => d.deviceId));
    
    // Also add all available devices for MIDI triggers
    for (const device of availableDevices) {
      if (!allDeviceIds.has(device.deviceId)) {
        allDeviceIds.add(device.deviceId);
      }
    }
    
    const initialStates = new Map<string, DeviceState>();
    
    for (const device of sequenceDevices) {
      initialStates.set(device.deviceId, {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        isOn: false,
      });
    }
    
    // Add available devices not in sequence
    for (const device of availableDevices) {
      if (!initialStates.has(device.deviceId)) {
        initialStates.set(device.deviceId, {
          deviceId: device.deviceId,
          deviceName: device.alias,
          isOn: false,
        });
      }
    }
    
    setDeviceStates(initialStates);
  }, [usedDevices, availableDevices]);
  
  // Track the eventId when component mounts - ignore any events from before opening
  const mountEventIdRef = useRef<number>(lastNote?.eventId ?? 0);
  
  // Update mount reference when component mounts
  useEffect(() => {
    mountEventIdRef.current = lastNote?.eventId ?? 0;
  }, []); // Only run on mount
  
  // Listen for MIDI triggers - only respond to events AFTER component mounted
  useEffect(() => {
    if (!midiEnabled || !currentShow || !lastNote) return;
    
    // Ignore events that happened before this component opened
    if (lastNote.eventId <= mountEventIdRef.current) return;
    
    // Find mapping for this note
    const mapping = currentShow.midi_mappings.find(
      m => m.midi_note === lastNote.note && m.midi_channel === lastNote.channel
    );
    
    if (!mapping) return;
    
    // Handle the MIDI action visually
    handleMIDIAction(mapping, lastNote.note);
  }, [lastNote?.eventId, midiEnabled, currentShow]);
  
  // Handle MIDI action in visualizer
  const handleMIDIAction = (mapping: MIDIMapping, note: number) => {
    setLastMidiTrigger({
      note,
      noteName: midiNoteToName(note),
      action: mapping.action_type,
      timestamp: Date.now(),
    });
    
    // Clear the trigger indicator after a short time
    setTimeout(() => {
      setLastMidiTrigger(prev => 
        prev && prev.timestamp === Date.now() - 1000 ? null : prev
      );
    }, 1000);
    
    switch (mapping.action_type) {
      case 'device_group_on':
        if (mapping.target_id) {
          const group = getDeviceGroupById(mapping.target_id);
          if (group) {
            setDeviceStates(prev => {
              const newStates = new Map(prev);
              for (const item of group.items) {
                const current = newStates.get(item.device_id);
                if (current) {
                  newStates.set(item.device_id, { ...current, isOn: true });
                } else {
                  newStates.set(item.device_id, {
                    deviceId: item.device_id,
                    deviceName: item.device_name,
                    isOn: true,
                  });
                }
              }
              return newStates;
            });
          }
        }
        break;
        
      case 'device_group_off':
        if (mapping.target_id) {
          const group = getDeviceGroupById(mapping.target_id);
          if (group) {
            setDeviceStates(prev => {
              const newStates = new Map(prev);
              for (const item of group.items) {
                const current = newStates.get(item.device_id);
                if (current) {
                  newStates.set(item.device_id, { ...current, isOn: false });
                }
              }
              return newStates;
            });
          }
        }
        break;
        
      case 'device_group_toggle':
        if (mapping.target_id) {
          const group = getDeviceGroupById(mapping.target_id);
          if (group) {
            setDeviceStates(prev => {
              const newStates = new Map(prev);
              for (const item of group.items) {
                const current = newStates.get(item.device_id);
                if (current) {
                  newStates.set(item.device_id, { ...current, isOn: !current.isOn });
                } else {
                  newStates.set(item.device_id, {
                    deviceId: item.device_id,
                    deviceName: item.device_name,
                    isOn: true,
                  });
                }
              }
              return newStates;
            });
          }
        }
        break;
        
      case 'blackout':
        setDeviceStates(prev => {
          const newStates = new Map(prev);
          for (const [id, state] of newStates) {
            newStates.set(id, { ...state, isOn: false });
          }
          return newStates;
        });
        break;
        
      case 'sequence_play':
        // Could trigger sequence playback in visualizer
        if (mapping.target_id) {
          const seq = getSequenceById(mapping.target_id);
          if (seq && seq.id === sequence.id && !isPlaying) {
            playSequence();
          }
        }
        break;
    }
  };
  
  // Calculate total duration
  const totalDuration = sequence.steps.reduce((acc, step) => acc + step.delay_ms, 0);
  
  // Play sequence
  const playSequence = async () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    setIsPaused(false);
    setCurrentStepIndex(-1);
    setProgress(0);
    setElapsedTime(0);
    
    // Reset all devices to off
    const devices = usedDevices();
    const resetStates = new Map<string, DeviceState>();
    for (const device of devices) {
      resetStates.set(device.deviceId, {
        ...device,
        isOn: false,
      });
    }
    setDeviceStates(resetStates);
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    const sortedSteps = [...sequence.steps].sort((a, b) => a.order_index - b.order_index);
    let elapsed = 0;
    
    for (let i = 0; i < sortedSteps.length; i++) {
      if (signal.aborted) break;
      
      const step = sortedSteps[i];
      
      // Wait for delay with progress updates
      if (step.delay_ms > 0) {
        const startTime = Date.now();
        const targetTime = startTime + step.delay_ms;
        
        while (Date.now() < targetTime && !signal.aborted) {
          // Check for pause
          if (isPaused) {
            await new Promise<void>(resolve => {
              pauseResolveRef.current = resolve;
            });
          }
          
          const now = Date.now();
          const stepProgress = (now - startTime) / step.delay_ms;
          const totalProgress = (elapsed + step.delay_ms * stepProgress) / totalDuration;
          
          setProgress(Math.min(totalProgress * 100, 100));
          setElapsedTime(elapsed + (now - startTime));
          
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        elapsed += step.delay_ms;
      }
      
      if (signal.aborted) break;
      
      // Execute step actions
      setCurrentStepIndex(i);
      
      setDeviceStates(prev => {
        const newStates = new Map(prev);
        for (const action of step.actions) {
          if (action.device_id) {
            const current = newStates.get(action.device_id);
            if (current) {
              newStates.set(action.device_id, {
                ...current,
                isOn: action.action === 'on',
              });
            }
          }
        }
        return newStates;
      });
    }
    
    setProgress(100);
    setElapsedTime(totalDuration);
    setIsPlaying(false);
    setCurrentStepIndex(-1);
    abortControllerRef.current = null;
  };
  
  // Stop sequence
  const stopSequence = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentStepIndex(-1);
    
    // Reset all devices
    const devices = usedDevices();
    const resetStates = new Map<string, DeviceState>();
    for (const device of devices) {
      resetStates.set(device.deviceId, {
        ...device,
        isOn: false,
      });
    }
    setDeviceStates(resetStates);
  };
  
  // Pause/Resume
  const togglePause = () => {
    if (isPaused && pauseResolveRef.current) {
      pauseResolveRef.current();
      pauseResolveRef.current = null;
    }
    setIsPaused(!isPaused);
  };
  
  // Reset
  const resetVisualizer = () => {
    stopSequence();
    setProgress(0);
    setElapsedTime(0);
  };
  
  const devices = usedDevices();
  const sortedSteps = [...sequence.steps].sort((a, b) => a.order_index - b.order_index);
  
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                Sequence Visualizer
              </h2>
              <p className="text-zinc-400 text-sm mt-1">{sequence.name}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* MIDI Status & Toggle */}
              <div className="flex items-center gap-3 px-4 py-2 bg-zinc-800 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${selectedInputId ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                <span className="text-sm text-zinc-400">MIDI</span>
                <button
                  onClick={() => setMidiEnabled(!midiEnabled)}
                  className={`w-10 h-5 rounded-full transition-colors ${
                    midiEnabled && selectedInputId ? 'bg-amber-600' : 'bg-zinc-600'
                  }`}
                  disabled={!selectedInputId}
                  title={selectedInputId ? (midiEnabled ? 'Disable MIDI triggers' : 'Enable MIDI triggers') : 'No MIDI device connected'}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      midiEnabled && selectedInputId ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* MIDI Trigger Indicator */}
          {lastMidiTrigger && Date.now() - lastMidiTrigger.timestamp < 1000 && (
            <div className="mt-4 flex items-center gap-3 px-4 py-2 bg-amber-900/30 border border-amber-800 rounded-lg animate-pulse">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span className="text-amber-400 font-mono">{lastMidiTrigger.noteName}</span>
              <span className="text-zinc-400">→</span>
              <span className="text-white">{formatActionType(lastMidiTrigger.action)}</span>
            </div>
          )}
        </div>
        
        {/* Visualizer Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {deviceStates.size === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400">No devices available</p>
              <p className="text-zinc-500 text-sm mt-1">Add devices to sequence steps or connect MIDI to visualize</p>
            </div>
          ) : (
            <>
              {/* Light Bulbs Grid */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">
                  Devices ({deviceStates.size})
                </h3>
                <div className="flex flex-wrap gap-6 justify-center">
                  {Array.from(deviceStates.values()).map((state) => (
                    <LightBulb
                      key={state.deviceId}
                      name={state.deviceName}
                      isOn={state.isOn}
                    />
                  ))}
                </div>
              </div>
              
              {/* Timeline */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Timeline</h3>
                <div className="relative">
                  {/* Progress bar */}
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  
                  {/* Time indicators */}
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>{formatTime(elapsedTime)}</span>
                    <span>{formatTime(totalDuration)}</span>
                  </div>
                </div>
              </div>
              
              {/* Steps Timeline */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Steps</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {sortedSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`flex-shrink-0 px-4 py-3 rounded-lg border transition-all ${
                        currentStepIndex === index
                          ? 'bg-amber-600/20 border-amber-500 ring-2 ring-amber-500/30'
                          : currentStepIndex > index
                            ? 'bg-emerald-900/20 border-emerald-800'
                            : 'bg-zinc-800/50 border-zinc-700'
                      }`}
                    >
                      <div className="text-xs text-zinc-500 mb-1">Step {index + 1}</div>
                      <div className="text-sm text-white font-medium">{step.delay_ms}ms</div>
                      <div className="flex gap-1 mt-2">
                        {step.actions.map((action, i) => (
                          <span
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              action.action === 'on' ? 'bg-amber-500' : 'bg-zinc-600'
                            }`}
                            title={`${action.device_name}: ${action.action.toUpperCase()}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Controls */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-center gap-4">
            {/* Reset */}
            <button
              onClick={resetVisualizer}
              disabled={!isPlaying && progress === 0}
              className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
              title="Reset"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            {/* Play/Pause */}
            {!isPlaying ? (
              <button
                onClick={playSequence}
                disabled={devices.length === 0 || sortedSteps.length === 0}
                className="p-4 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-full transition-colors shadow-lg shadow-amber-600/30"
                title="Play"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={togglePause}
                className={`p-4 ${isPaused ? 'bg-amber-600 hover:bg-amber-500' : 'bg-zinc-700 hover:bg-zinc-600'} text-white rounded-full transition-colors`}
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                )}
              </button>
            )}
            
            {/* Stop */}
            <button
              onClick={stopSequence}
              disabled={!isPlaying}
              className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
              title="Stop"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
            </button>
          </div>
          
          <p className="text-center text-xs text-zinc-500 mt-4">
            Preview mode — no signals sent to real devices
            {midiEnabled && selectedInputId && ' • MIDI triggers active'}
          </p>
        </div>
      </div>
    </div>
  );
}

// Light Bulb Component
interface LightBulbProps {
  name: string;
  isOn: boolean;
}

function LightBulb({ name, isOn }: LightBulbProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* Glow effect */}
        {isOn && (
          <div className="absolute inset-0 blur-xl bg-amber-400/50 rounded-full scale-150 animate-pulse" />
        )}
        
        {/* Bulb */}
        <div
          className={`relative w-20 h-20 rounded-full transition-all duration-300 ${
            isOn
              ? 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 shadow-lg shadow-amber-500/50'
              : 'bg-gradient-to-br from-zinc-600 via-zinc-700 to-zinc-800 shadow-inner'
          }`}
        >
          {/* Inner highlight */}
          <div
            className={`absolute top-2 left-2 w-6 h-6 rounded-full transition-all duration-300 ${
              isOn
                ? 'bg-gradient-to-br from-white/80 to-transparent'
                : 'bg-gradient-to-br from-zinc-500/30 to-transparent'
            }`}
          />
          
          {/* Filament lines */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10" viewBox="0 0 40 40">
              <path
                d="M15 25 Q20 15 25 25"
                fill="none"
                stroke={isOn ? 'rgba(255,255,255,0.6)' : 'rgba(100,100,100,0.4)'}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M17 28 Q20 20 23 28"
                fill="none"
                stroke={isOn ? 'rgba(255,255,255,0.4)' : 'rgba(100,100,100,0.3)'}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
        
        {/* Base */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-gradient-to-b from-zinc-500 to-zinc-700 rounded-b-lg" />
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-3 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded-b-md" />
      </div>
      
      {/* Label */}
      <div className="text-center mt-2">
        <p className="text-sm text-white font-medium truncate max-w-24">{name}</p>
        <p className={`text-xs ${isOn ? 'text-amber-400' : 'text-zinc-500'}`}>
          {isOn ? 'ON' : 'OFF'}
        </p>
      </div>
    </div>
  );
}

// Helper to format time
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const milliseconds = Math.floor((ms % 1000) / 10);
  return `${seconds}.${milliseconds.toString().padStart(2, '0')}s`;
}

// Helper to format action type
function formatActionType(actionType: string): string {
  switch (actionType) {
    case 'device_group_on': return 'Group ON';
    case 'device_group_off': return 'Group OFF';
    case 'device_group_toggle': return 'Group Toggle';
    case 'sequence_play': return 'Play Sequence';
    case 'scene_activate': return 'Activate Scene';
    case 'blackout': return 'BLACKOUT';
    default: return actionType;
  }
}

