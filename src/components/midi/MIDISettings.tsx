'use client';

import { useEffect, useState } from 'react';
import { useMIDIStore, getMIDIActionLabel } from '@/store/midiStore';
import { useShowStore } from '@/store/showStore';
import MIDILearnButton from './MIDILearnButton';
import MIDIMappingList from './MIDIMappingList';
import MIDIEditModal from './MIDIEditModal';
import type { MIDIActionType, MIDIMapping } from '@/types';

interface MIDISettingsProps {
  onClose: () => void;
  onAddMapping: (midiNote: number, midiChannel: number, actionType: MIDIActionType, targetId: string | null) => void;
  onUpdateMapping: (id: string, actionType: MIDIActionType, targetId: string | null) => void;
  onDeleteMapping: (mappingId: string) => void;
}

export default function MIDISettings({ onClose, onAddMapping, onUpdateMapping, onDeleteMapping }: MIDISettingsProps) {
  const [editingMapping, setEditingMapping] = useState<MIDIMapping | null>(null);
  const { 
    isSupported, 
    isConnected, 
    availableInputs, 
    selectedInputId, 
    availableOutputs,
    selectedOutputId,
    loopbackEnabled,
    lastNote,
    error,
    initialize, 
    selectInput, 
    disconnect,
    selectOutput,
    setLoopbackEnabled
  } = useMIDIStore();
  
  const { currentShow } = useShowStore();
  
  useEffect(() => {
    if (isSupported && !isConnected) {
      initialize();
    }
  }, [isSupported, isConnected, initialize]);
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">MIDI Settings</h2>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Browser support check */}
          {!isSupported ? (
            <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg">
              <p className="text-red-400">
                Web MIDI API is not supported in your browser. Please use Chrome, Edge, or Opera.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          ) : (
            <>
              {/* Device Selection */}
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-3">MIDI Input Device</h3>
                <div className="flex gap-3">
                  <select
                    value={selectedInputId || ''}
                    onChange={(e) => e.target.value ? selectInput(e.target.value) : disconnect()}
                    className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  >
                    <option value="">No device selected</option>
                    {availableInputs.map((input) => (
                      <option key={input.id} value={input.id}>
                        {input.name} ({input.manufacturer})
                      </option>
                    ))}
                  </select>
                  {selectedInputId && (
                    <button
                      onClick={disconnect}
                      className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
                
                {availableInputs.length === 0 && (
                  <p className="text-sm text-zinc-500 mt-2">
                    No MIDI devices found. Connect a MIDI controller and refresh.
                  </p>
                )}
              </div>
              
              {/* Last received note */}
              {selectedInputId && (
                <div className="p-4 bg-zinc-800 rounded-lg">
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Last Received Note</h4>
                  {lastNote ? (
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-mono text-amber-500">
                        Note {lastNote.note}
                      </span>
                      <span className="text-zinc-500">
                        Channel {lastNote.channel + 1} • Velocity {lastNote.velocity}
                      </span>
                    </div>
                  ) : (
                    <p className="text-zinc-500">Press a key on your MIDI controller...</p>
                  )}
                </div>
              )}
              
              {/* MIDI Loopback / Passthrough */}
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium text-white">MIDI Loopback</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Forward incoming MIDI to a virtual output (e.g., loopMIDI)
                    </p>
                  </div>
                  <button
                    onClick={() => setLoopbackEnabled(!loopbackEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      loopbackEnabled ? 'bg-amber-600' : 'bg-zinc-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        loopbackEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                
                {loopbackEnabled && (
                  <div className="mt-3">
                    <label className="block text-xs text-zinc-400 mb-2">Output Device</label>
                    <select
                      value={selectedOutputId || ''}
                      onChange={(e) => selectOutput(e.target.value || null)}
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select output device...</option>
                      {availableOutputs.map((output) => (
                        <option key={output.id} value={output.id}>
                          {output.name} {output.manufacturer ? `(${output.manufacturer})` : ''}
                        </option>
                      ))}
                    </select>
                    
                    {availableOutputs.length === 0 && (
                      <p className="text-xs text-zinc-500 mt-2">
                        No MIDI outputs found. Install loopMIDI or a virtual MIDI driver.
                      </p>
                    )}
                    
                    {selectedOutputId && (
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-emerald-400">
                          Loopback active — MIDI signals will be forwarded
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* MIDI Mappings */}
              {currentShow && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-zinc-400">MIDI Mappings</h3>
                    <MIDILearnButton onLearn={onAddMapping} />
                  </div>
                  
                  <MIDIMappingList
                    mappings={currentShow.midi_mappings}
                    onEdit={setEditingMapping}
                    onDelete={onDeleteMapping}
                  />
                  
                  {editingMapping && (
                    <MIDIEditModal
                      mapping={editingMapping}
                      onSave={onUpdateMapping}
                      onClose={() => setEditingMapping(null)}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

