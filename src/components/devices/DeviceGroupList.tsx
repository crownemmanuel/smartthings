'use client';

import DeviceGroupCard from './DeviceGroupCard';
import type { DeviceGroupWithItems, TPLinkDevice } from '@/types';

interface DeviceGroupListProps {
  groups: DeviceGroupWithItems[];
  availableDevices: TPLinkDevice[];
  isEditMode: boolean;
  onEdit: (group: DeviceGroupWithItems) => void;
  onDelete: (groupId: string) => void;
}

export default function DeviceGroupList({
  groups,
  availableDevices,
  isEditMode,
  onEdit,
  onDelete,
}: DeviceGroupListProps) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-8 bg-zinc-900/50 rounded-lg border border-zinc-800 border-dashed">
        <svg className="w-12 h-12 mx-auto text-zinc-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p className="text-zinc-500 text-sm">No device groups in this scene</p>
        {isEditMode && (
          <p className="text-zinc-600 text-xs mt-1">Add a group to organize your devices</p>
        )}
      </div>
    );
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map((group) => (
        <DeviceGroupCard
          key={group.id}
          group={group}
          isEditMode={isEditMode}
          onEdit={() => onEdit(group)}
          onDelete={() => onDelete(group.id)}
        />
      ))}
    </div>
  );
}

