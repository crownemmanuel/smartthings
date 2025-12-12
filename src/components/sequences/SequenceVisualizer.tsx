'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { SequenceWithSteps, TPLinkDevice } from '@/types';

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
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const pauseResolveRef = useRef<(() => void) | null>(null);
  
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
  
  // Initialize device states
  useEffect(() => {
    const devices = usedDevices();
    const initialStates = new Map<string, DeviceState>();
    
    for (const device of devices) {
      initialStates.set(device.deviceId, {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        isOn: false,
      });
    }
    
    setDeviceStates(initialStates);
  }, [usedDevices]);
  
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
        
        {/* Visualizer Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {devices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400">No devices in this sequence</p>
              <p className="text-zinc-500 text-sm mt-1">Add devices to sequence steps to visualize</p>
            </div>
          ) : (
            <>
              {/* Light Bulbs Grid */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Devices</h3>
                <div className="flex flex-wrap gap-6 justify-center">
                  {devices.map((device) => {
                    const state = deviceStates.get(device.deviceId);
                    const isOn = state?.isOn ?? false;
                    
                    return (
                      <LightBulb
                        key={device.deviceId}
                        name={device.deviceName}
                        isOn={isOn}
                      />
                    );
                  })}
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

