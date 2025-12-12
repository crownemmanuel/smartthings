'use client';

import { useEffect } from 'react';
import { useMIDIStore, midiNoteToName, getMIDIActionLabel } from '@/store/midiStore';
import { useShowStore } from '@/store/showStore';
import MIDILearnButton from './MIDILearnButton';
import MIDIMappingList from './MIDIMappingList';
import type { MIDIActionType } from '@/types';

interface MIDISettingsProps {
  onClose: () => void;
  onAddMapping: (midiNote: number, midiChannel: number, actionType: MIDIActionType, targetId: string | null) => void;
  onDeleteMapping: (mappingId: string) => void;
}

export default function MIDISettings({ onClose, onAddMapping, onDeleteMapping }: MIDISettingsProps) {
  const { 
    isSupported, 
    isConnected, 
    availableInputs, 
    selectedInputId, 
    lastNote,
    error,
    initialize, 
    selectInput, 
    disconnect 
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
                        {midiNoteToName(lastNote.note)}
                      </span>
                      <span className="text-zinc-500">
                        Note {lastNote.note} • Channel {lastNote.channel + 1} • Velocity {lastNote.velocity}
                      </span>
                    </div>
                  ) : (
                    <p className="text-zinc-500">Press a key on your MIDI controller...</p>
                  )}
                </div>
              )}
              
              {/* MIDI Mappings */}
              {currentShow && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-zinc-400">MIDI Mappings</h3>
                    <MIDILearnButton onLearn={onAddMapping} />
                  </div>
                  
                  <MIDIMappingList
                    mappings={currentShow.midi_mappings}
                    onDelete={onDeleteMapping}
                  />
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

