'use client';

import { useState } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import type { TPLinkDevice } from '@/types';

interface DeviceTableProps {
  devices: TPLinkDevice[];
}

export default function DeviceTable({ devices }: DeviceTableProps) {
  const { 
    getDeviceState, 
    isDeviceControlling, 
    turnOn, 
    turnOff, 
    toggle,
    fetchDevices,
    isLoadingDevices 
  } = useDeviceStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'status'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  
  // Filter devices based on search
  const filteredDevices = devices.filter(device => 
    device.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.deviceType?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort devices
  const sortedDevices = [...filteredDevices].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.alias.localeCompare(b.alias);
        break;
      case 'type':
        comparison = (a.deviceType || '').localeCompare(b.deviceType || '');
        break;
      case 'status':
        const aOn = getDeviceState(a.deviceId);
        const bOn = getDeviceState(b.deviceId);
        comparison = Number(bOn) - Number(aOn);
        break;
    }
    return sortAsc ? comparison : -comparison;
  });
  
  const handleSort = (column: 'name' | 'type' | 'status') => {
    if (sortBy === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(column);
      setSortAsc(true);
    }
  };
  
  const handleToggle = async (deviceId: string) => {
    try {
      await toggle(deviceId);
    } catch (error) {
      console.error('Failed to toggle device:', error);
    }
  };
  
  const handleTurnAllOn = async () => {
    for (const device of sortedDevices) {
      try {
        await turnOn(device.deviceId);
      } catch (error) {
        console.error(`Failed to turn on ${device.alias}:`, error);
      }
    }
  };
  
  const handleTurnAllOff = async () => {
    for (const device of sortedDevices) {
      try {
        await turnOff(device.deviceId);
      } catch (error) {
        console.error(`Failed to turn off ${device.alias}:`, error);
      }
    }
  };
  
  const SortIcon = ({ column }: { column: 'name' | 'type' | 'status' }) => {
    if (sortBy !== column) return null;
    return (
      <svg className="w-4 h-4 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d={sortAsc ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
      </svg>
    );
  };
  
  const onDevicesCount = sortedDevices.filter(d => getDeviceState(d.deviceId)).length;
  
  return (
    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">All Devices</h2>
              <p className="text-sm text-zinc-500">
                {onDevicesCount} of {devices.length} devices are on
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Refresh button */}
            <button
              onClick={() => fetchDevices()}
              disabled={isLoadingDevices}
              className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all disabled:opacity-50"
              title="Refresh devices"
            >
              <svg className={`w-5 h-5 ${isLoadingDevices ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            {/* Bulk actions */}
            <button
              onClick={handleTurnAllOn}
              className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-lg shadow-emerald-600/20"
            >
              All On
            </button>
            <button
              onClick={handleTurnAllOff}
              className="px-4 py-2 text-sm font-medium bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-all"
            >
              All Off
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search devices by name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
          />
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800/50">
              <th className="px-6 py-4 text-left">
                <button 
                  onClick={() => handleSort('status')}
                  className="flex items-center text-xs font-semibold text-zinc-400 uppercase tracking-wider hover:text-white transition-colors"
                >
                  Status
                  <SortIcon column="status" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button 
                  onClick={() => handleSort('name')}
                  className="flex items-center text-xs font-semibold text-zinc-400 uppercase tracking-wider hover:text-white transition-colors"
                >
                  Device Name
                  <SortIcon column="name" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button 
                  onClick={() => handleSort('type')}
                  className="flex items-center text-xs font-semibold text-zinc-400 uppercase tracking-wider hover:text-white transition-colors"
                >
                  Type
                  <SortIcon column="type" />
                </button>
              </th>
              <th className="px-6 py-4 text-right">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Control
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {sortedDevices.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                      </svg>
                    </div>
                    <p className="text-zinc-500">
                      {searchQuery ? 'No devices match your search' : 'No devices found'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedDevices.map((device) => {
                const isOn = getDeviceState(device.deviceId);
                const isControlling = isDeviceControlling(device.deviceId);
                
                return (
                  <tr 
                    key={device.deviceId}
                    className={`group hover:bg-zinc-800/30 transition-colors ${isOn ? 'bg-emerald-950/20' : ''}`}
                  >
                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`relative w-3 h-3 rounded-full ${
                          isControlling 
                            ? 'bg-amber-500 animate-pulse' 
                            : isOn 
                              ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' 
                              : 'bg-zinc-600'
                        }`}>
                          {isOn && !isControlling && (
                            <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
                          )}
                        </div>
                        <span className={`text-sm font-medium ${
                          isControlling ? 'text-amber-400' : isOn ? 'text-emerald-400' : 'text-zinc-500'
                        }`}>
                          {isControlling ? 'Working...' : isOn ? 'On' : 'Off'}
                        </span>
                      </div>
                    </td>
                    
                    {/* Device Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                          isOn ? 'bg-emerald-900/50 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {device.deviceType?.startsWith('LB') || device.deviceType?.startsWith('KL') ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{device.alias}</p>
                          <p className="text-xs text-zinc-500 font-mono">{device.deviceId.slice(0, 16)}...</p>
                        </div>
                      </div>
                    </td>
                    
                    {/* Type */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {device.deviceType || 'Unknown'}
                      </span>
                    </td>
                    
                    {/* Control */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Toggle Switch */}
                        <button
                          onClick={() => handleToggle(device.deviceId)}
                          disabled={isControlling}
                          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
                            isControlling 
                              ? 'bg-amber-600/50 cursor-wait' 
                              : isOn 
                                ? 'bg-emerald-600 shadow-lg shadow-emerald-600/30' 
                                : 'bg-zinc-700 hover:bg-zinc-600'
                          }`}
                        >
                          <span className="sr-only">Toggle device</span>
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-300 ${
                              isControlling 
                                ? 'translate-x-4 opacity-70' 
                                : isOn 
                                  ? 'translate-x-8' 
                                  : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer */}
      {sortedDevices.length > 0 && (
        <div className="px-6 py-4 border-t border-zinc-800/50 bg-zinc-900/50">
          <p className="text-sm text-zinc-500">
            Showing {sortedDevices.length} of {devices.length} devices
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      )}
    </div>
  );
}

