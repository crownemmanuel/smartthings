'use client';

import { useState } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import type { TPLinkDevice, DeviceGroupItem } from '@/types';

interface DeviceSelectorProps {
  availableDevices: TPLinkDevice[];
  selectedDevices: DeviceGroupItem[];
  onAdd: (device: TPLinkDevice) => void;
  onRemove: (itemId: string) => void;
  onToggleTurnOn: (itemId: string, turnOn: boolean) => void;
}

export default function DeviceSelector({
  availableDevices,
  selectedDevices,
  onAdd,
  onRemove,
  onToggleTurnOn,
}: DeviceSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { fetchDevices, isLoadingDevices, deviceError } = useDeviceStore();
  
  const selectedDeviceIds = new Set(selectedDevices.map(d => d.device_id));
  
  const filteredDevices = availableDevices.filter(device => 
    !selectedDeviceIds.has(device.deviceId) &&
    device.alias.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const hasNoDevices = availableDevices.length === 0;
  const allDevicesSelected = !hasNoDevices && filteredDevices.length === 0 && !searchQuery;
  
  return (
    <div className="space-y-4">
      {/* Selected devices */}
      {selectedDevices.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-zinc-400 mb-2">Selected Devices</h4>
          <div className="space-y-2">
            {selectedDevices.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-white">{item.device_name}</span>
                  {item.device_type && (
                    <span className="text-xs text-zinc-500">{item.device_type}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Turn on/off toggle */}
                  <label className="flex items-center gap-2 text-xs text-zinc-400">
                    <span>Turn {item.turn_on ? 'ON' : 'OFF'}</span>
                    <button
                      onClick={() => onToggleTurnOn(item.id, !item.turn_on)}
                      className={`w-10 h-5 rounded-full transition-colors ${
                        item.turn_on ? 'bg-emerald-600' : 'bg-zinc-600'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full transition-transform ${
                          item.turn_on ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </label>
                  
                  {/* Remove button */}
                  <button
                    onClick={() => onRemove(item.id)}
                    className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Available devices */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-zinc-400">Available Devices</h4>
          <button
            onClick={() => fetchDevices()}
            disabled={isLoadingDevices}
            className="text-xs text-amber-500 hover:text-amber-400 disabled:text-zinc-500 flex items-center gap-1"
          >
            <svg className={`w-3 h-3 ${isLoadingDevices ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoadingDevices ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {/* Error message */}
        {deviceError && (
          <div className="mb-3 p-3 bg-red-900/30 border border-red-800 rounded-lg">
            <p className="text-sm text-red-400">{deviceError}</p>
            <p className="text-xs text-red-500 mt-1">Check your TP-Link credentials in .env.local</p>
          </div>
        )}
        
        {/* No devices warning */}
        {hasNoDevices && !deviceError && !isLoadingDevices && (
          <div className="mb-3 p-3 bg-amber-900/30 border border-amber-800 rounded-lg">
            <p className="text-sm text-amber-400">No devices found from your TP-Link account</p>
            <p className="text-xs text-amber-500 mt-1">Make sure your devices are registered in the Kasa/TP-Link app</p>
          </div>
        )}
        
        {/* Search */}
        {!hasNoDevices && (
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search devices..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>
        )}
        
        {/* Device list */}
        <div className="max-h-48 overflow-y-auto space-y-1">
          {isLoadingDevices ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-sm text-zinc-400">Loading devices...</span>
            </div>
          ) : hasNoDevices ? (
            <p className="text-sm text-zinc-500 text-center py-4">
              Click "Refresh" to load devices from your TP-Link account
            </p>
          ) : filteredDevices.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">
              {searchQuery ? 'No devices match your search' : 'All devices have been added to this group'}
            </p>
          ) : (
            filteredDevices.map((device) => (
              <button
                key={device.deviceId}
                onClick={() => onAdd(device)}
                className="w-full flex items-center justify-between p-3 bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors text-left"
              >
                <div>
                  <span className="text-white">{device.alias}</span>
                  <span className="ml-2 text-xs text-zinc-500">{device.deviceType}</span>
                </div>
                <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

