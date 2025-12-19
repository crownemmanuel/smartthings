'use client';

import { getMIDIActionLabel } from '@/store/midiStore';
import { useShowStore } from '@/store/showStore';
import type { MIDIMapping } from '@/types';

interface MIDIMappingListProps {
  mappings: MIDIMapping[];
  onEdit: (mapping: MIDIMapping) => void;
  onDelete: (mappingId: string) => void;
}

export default function MIDIMappingList({ mappings, onEdit, onDelete }: MIDIMappingListProps) {
  const { currentShow } = useShowStore();
  
  const getTargetName = (mapping: MIDIMapping): string => {
    if (!mapping.target_id || !currentShow) return '';
    
    switch (mapping.action_type) {
      case 'device_group_on':
      case 'device_group_off':
      case 'device_group_toggle':
        for (const scene of currentShow.scenes) {
          const group = scene.device_groups.find(g => g.id === mapping.target_id);
          if (group) return group.name;
        }
        return 'Unknown Group';
        
      case 'sequence_play':
        const sequence = currentShow.sequences.find(s => s.id === mapping.target_id);
        return sequence?.name || 'Unknown Sequence';
        
      case 'scene_activate':
        const scene = currentShow.scenes.find(s => s.id === mapping.target_id);
        return scene?.name || 'Unknown Scene';
        
      default:
        return '';
    }
  };
  
  if (mappings.length === 0) {
    return (
      <div className="text-center py-8 bg-zinc-800/50 rounded-lg border border-zinc-700 border-dashed">
        <p className="text-zinc-500 text-sm">No MIDI mappings configured</p>
        <p className="text-zinc-600 text-xs mt-1">Click "Learn New Mapping" to add one</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {mappings.map((mapping) => {
        const targetName = getTargetName(mapping);
        
        return (
          <div
            key={mapping.id}
            className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
          >
            <div className="flex items-center gap-4">
              {/* MIDI Note */}
              <div className="w-20 text-center">
                <span className="text-lg font-mono text-amber-500">
                  Note {mapping.midi_note}
                </span>
                <p className="text-xs text-zinc-500">Ch {mapping.midi_channel + 1}</p>
              </div>
              
              {/* Arrow */}
              <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              
              {/* Action */}
              <div>
                <span className="text-white">{getMIDIActionLabel(mapping.action_type)}</span>
                {targetName && (
                  <span className="ml-2 text-zinc-400">→ {targetName}</span>
                )}
              </div>
            </div>
            
            {/* Edit button */}
            <button
              onClick={() => onEdit(mapping)}
              className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-700 rounded transition-colors"
              title="Edit Mapping"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            {/* Delete button */}
            <button
              onClick={() => onDelete(mapping.id)}
              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded transition-colors"
              title="Delete Mapping"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

