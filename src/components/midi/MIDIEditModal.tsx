'use client';

import { useState } from 'react';
import { useShowStore } from '@/store/showStore';
import type { MIDIMapping, MIDIActionType } from '@/types';

interface MIDIEditModalProps {
  mapping: MIDIMapping;
  onSave: (id: string, actionType: MIDIActionType, targetId: string | null) => void;
  onClose: () => void;
}

export default function MIDIEditModal({ mapping, onSave, onClose }: MIDIEditModalProps) {
  const { currentShow } = useShowStore();
  
  const [selectedAction, setSelectedAction] = useState<MIDIActionType>(mapping.action_type);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(mapping.target_id || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Get all device groups from all scenes
  const allDeviceGroups = currentShow?.scenes.flatMap(scene => scene.device_groups) || [];
  const allSequences = currentShow?.sequences || [];
  const allScenes = currentShow?.scenes || [];
  
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
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const targetId = needsTarget(selectedAction) ? selectedTargetId || null : null;
      await onSave(mapping.id, selectedAction, targetId);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };
  
  const targetOptions = getTargetOptions(selectedAction);
  const currentTargetName = (() => {
    if (!mapping.target_id) return null;
    const group = allDeviceGroups.find(g => g.id === mapping.target_id);
    if (group) return group.name;
    const seq = allSequences.find(s => s.id === mapping.target_id);
    if (seq) return seq.name;
    const scene = allScenes.find(s => s.id === mapping.target_id);
    if (scene) return scene.name;
    return null;
  })();
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Edit MIDI Mapping</h3>
        
        {/* Current note display */}
        <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-lg text-center mb-6">
          <p className="text-sm text-zinc-400 mb-1">MIDI Note</p>
          <p className="text-2xl font-mono text-amber-500">
            Note {mapping.midi_note}
          </p>
          <p className="text-sm text-zinc-500 mt-1">Channel {mapping.midi_channel + 1}</p>
        </div>
        
        {/* Action selection */}
        <div className="mb-4">
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
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-400 mb-2">Target</label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            >
              <option value="">Select target...</option>
              {targetOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || (needsTarget(selectedAction) && !selectedTargetId)}
            className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}


