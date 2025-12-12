'use client';

import { useState } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { turnGroupOn, turnGroupOff } from '@/lib/midi';
import type { DeviceGroupWithItems } from '@/types';

interface DeviceGroupCardProps {
  group: DeviceGroupWithItems;
  isEditMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function DeviceGroupCard({
  group,
  isEditMode,
  onEdit,
  onDelete,
}: DeviceGroupCardProps) {
  const { getDeviceState, isDeviceControlling } = useDeviceStore();
  const [isControlling, setIsControlling] = useState(false);
  
  const handleTurnOn = async () => {
    setIsControlling(true);
    try {
      await turnGroupOn(group);
    } catch (error) {
      console.error('Failed to turn on group:', error);
    } finally {
      setIsControlling(false);
    }
  };
  
  const handleTurnOff = async () => {
    setIsControlling(true);
    try {
      await turnGroupOff(group);
    } catch (error) {
      console.error('Failed to turn off group:', error);
    } finally {
      setIsControlling(false);
    }
  };
  
  // Check if any device in the group is on
  const anyDeviceOn = group.items.some(item => getDeviceState(item.device_id));
  const allDevicesOn = group.items.length > 0 && group.items.every(item => getDeviceState(item.device_id));
  
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div 
        className="p-4 border-b border-zinc-800"
        style={{ borderLeftColor: group.color, borderLeftWidth: 4 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="font-medium text-white">{group.name}</h4>
            {/* Status indicator */}
            <div className={`w-2 h-2 rounded-full ${
              allDevicesOn ? 'bg-emerald-500' : anyDeviceOn ? 'bg-amber-500' : 'bg-zinc-600'
            }`} />
          </div>
          
          {isEditMode && (
            <div className="flex items-center gap-1">
              <button
                onClick={onEdit}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                title="Edit Group"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                title="Delete Group"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        <p className="text-xs text-zinc-500 mt-1">
          {group.items.length} device{group.items.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      {/* Device list */}
      <div className="p-3">
        {group.items.length === 0 ? (
          <p className="text-sm text-zinc-600 text-center py-2">No devices added</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {group.items.map((item) => {
              const isOn = getDeviceState(item.device_id);
              const isControllingDevice = isDeviceControlling(item.device_id);
              
              return (
                <div
                  key={item.id}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isControllingDevice
                      ? 'bg-zinc-700 text-zinc-400'
                      : isOn
                        ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {item.device_name}
                  {item.turn_on === false && (
                    <span className="ml-1 text-zinc-500">(off)</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Control buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleTurnOn}
            disabled={isControlling || group.items.length === 0}
            className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
              isControlling || group.items.length === 0
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
            }`}
          >
            {isControlling ? 'TURNING ON...' : 'ON'}
          </button>
          <button
            onClick={handleTurnOff}
            disabled={isControlling || group.items.length === 0}
            className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
              isControlling || group.items.length === 0
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-zinc-700 hover:bg-zinc-600 text-white'
            }`}
          >
            {isControlling ? 'TURNING OFF...' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
}

