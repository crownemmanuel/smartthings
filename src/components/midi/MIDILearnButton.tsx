'use client';

import { useState } from 'react';
import { useMIDIStore, midiNoteToName, getMIDIActionLabel } from '@/store/midiStore';
import { useShowStore } from '@/store/showStore';
import type { MIDIActionType } from '@/types';

interface MIDILearnButtonProps {
  onLearn: (midiNote: number, midiChannel: number, actionType: MIDIActionType, targetId: string | null) => void;
}

export default function MIDILearnButton({ onLearn }: MIDILearnButtonProps) {
  const { isLearning, startLearning, stopLearning, selectedInputId } = useMIDIStore();
  const { currentShow } = useShowStore();
  
  const [showModal, setShowModal] = useState(false);
  const [learnedNote, setLearnedNote] = useState<{ note: number; channel: number } | null>(null);
  const [selectedAction, setSelectedAction] = useState<MIDIActionType>('device_group_toggle');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  
  // Get all device groups from all scenes
  const allDeviceGroups = currentShow?.scenes.flatMap(scene => scene.device_groups) || [];
  const allSequences = currentShow?.sequences || [];
  const allScenes = currentShow?.scenes || [];
  
  const handleStartLearn = () => {
    setShowModal(true);
    setLearnedNote(null);
    startLearning((note, channel) => {
      setLearnedNote({ note, channel });
    });
  };
  
  const handleCancel = () => {
    stopLearning();
    setShowModal(false);
    setLearnedNote(null);
    setSelectedAction('device_group_toggle');
    setSelectedTargetId('');
  };
  
  const handleSave = () => {
    if (learnedNote) {
      const targetId = needsTarget(selectedAction) ? selectedTargetId || null : null;
      onLearn(learnedNote.note, learnedNote.channel, selectedAction, targetId);
      handleCancel();
    }
  };
  
  const needsTarget = (actionType: MIDIActionType): boolean => {
    return ['device_group_on', 'device_group_off', 'device_group_toggle', 'sequence_play', 'scene_activate'].includes(actionType);
  };
  
  const getTargetOptions = (actionType: MIDIActionType) => {
    switch (actionType) {
      case 'device_group_on':
      case 'device_group_off':
      case 'device_group_toggle':
        return allDeviceGroups.map(g => ({ id: g.id, name: g.name }));
      case 'sequence_play':
        return allSequences.map(s => ({ id: s.id, name: s.name }));
      case 'scene_activate':
        return allScenes.map(s => ({ id: s.id, name: s.name }));
      default:
        return [];
    }
  };
  
  if (!selectedInputId) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-zinc-700 text-zinc-500 rounded-lg text-sm cursor-not-allowed"
      >
        Connect MIDI to Learn
      </button>
    );
  }
  
  return (
    <>
      <button
        onClick={handleStartLearn}
        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
      >
        + Learn New Mapping
      </button>
      
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-zinc-800 rounded-xl border border-zinc-700 w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Learn MIDI Mapping</h3>
            
            {!learnedNote ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-600/20 border-2 border-amber-600 flex items-center justify-center animate-pulse">
                  <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <p className="text-zinc-300 mb-2">Listening for MIDI input...</p>
                <p className="text-sm text-zinc-500">Press any key on your MIDI controller</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Learned note display */}
                <div className="p-4 bg-emerald-900/30 border border-emerald-800 rounded-lg text-center">
                  <p className="text-sm text-emerald-400 mb-1">MIDI Note Captured</p>
                  <p className="text-2xl font-mono text-white">
                    {midiNoteToName(learnedNote.note)} (Note {learnedNote.note})
                  </p>
                  <p className="text-sm text-zinc-400 mt-1">Channel {learnedNote.channel + 1}</p>
                </div>
                
                {/* Action selection */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Action</label>
                  <select
                    value={selectedAction}
                    onChange={(e) => {
                      setSelectedAction(e.target.value as MIDIActionType);
                      setSelectedTargetId('');
                    }}
                    className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  >
                    <option value="device_group_toggle">Toggle Device Group</option>
                    <option value="device_group_on">Turn Device Group ON</option>
                    <option value="device_group_off">Turn Device Group OFF</option>
                    <option value="sequence_play">Play Sequence</option>
                    <option value="scene_activate">Activate Scene</option>
                    <option value="blackout">Blackout (All Off)</option>
                  </select>
                </div>
                
                {/* Target selection */}
                {needsTarget(selectedAction) && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Target</label>
                    <select
                      value={selectedTargetId}
                      onChange={(e) => setSelectedTargetId(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select target...</option>
                      {getTargetOptions(selectedAction).map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancel}
                className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              {learnedNote && (
                <button
                  onClick={handleSave}
                  disabled={needsTarget(selectedAction) && !selectedTargetId}
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Save Mapping
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

