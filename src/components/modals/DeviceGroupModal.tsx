'use client';

import { useState, useEffect } from 'react';
import DeviceSelector from '@/components/devices/DeviceSelector';
import type { DeviceGroupWithItems, DeviceGroupItem, TPLinkDevice } from '@/types';

const GROUP_COLORS = [
  '#10b981', // emerald
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
];

interface DeviceGroupModalProps {
  group?: DeviceGroupWithItems;
  availableDevices: TPLinkDevice[];
  onClose: () => void;
  onSave: (name: string, color: string, devices: Omit<DeviceGroupItem, 'id' | 'device_group_id' | 'created_at'>[]) => void;
}

export default function DeviceGroupModal({ 
  group, 
  availableDevices, 
  onClose, 
  onSave 
}: DeviceGroupModalProps) {
  const [name, setName] = useState(group?.name || '');
  const [color, setColor] = useState(group?.color || GROUP_COLORS[0]);
  const [devices, setDevices] = useState<DeviceGroupItem[]>(group?.items || []);
  const [isSaving, setIsSaving] = useState(false);
  
  const isEditing = Boolean(group);
  
  // Generate temporary IDs for new items
  const [tempIdCounter, setTempIdCounter] = useState(0);
  
  const handleAddDevice = (device: TPLinkDevice) => {
    const newItem: DeviceGroupItem = {
      id: `temp-${tempIdCounter}`,
      device_group_id: group?.id || '',
      device_id: device.deviceId,
      device_name: device.alias,
      device_type: device.deviceType || null,
      turn_on: true,
      created_at: new Date().toISOString(),
    };
    setDevices([...devices, newItem]);
    setTempIdCounter(c => c + 1);
  };
  
  const handleRemoveDevice = (itemId: string) => {
    setDevices(devices.filter(d => d.id !== itemId));
  };
  
  const handleToggleTurnOn = (itemId: string, turnOn: boolean) => {
    setDevices(devices.map(d => 
      d.id === itemId ? { ...d, turn_on: turnOn } : d
    ));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSaving(true);
    try {
      const deviceData = devices.map(d => ({
        device_id: d.device_id,
        device_name: d.device_name,
        device_type: d.device_type,
        turn_on: d.turn_on,
      }));
      await onSave(name.trim(), color, deviceData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">
            {isEditing ? 'Edit Device Group' : 'Create Device Group'}
          </h2>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="device-group-form" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Group Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Front Lights"
                autoFocus
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {GROUP_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      color === c 
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' 
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Devices
              </label>
              <DeviceSelector
                availableDevices={availableDevices}
                selectedDevices={devices}
                onAdd={handleAddDevice}
                onRemove={handleRemoveDevice}
                onToggleTurnOn={handleToggleTurnOn}
              />
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="device-group-form"
            disabled={!name.trim() || isSaving}
            className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}

