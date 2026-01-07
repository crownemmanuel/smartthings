'use client';

import { useState } from 'react';
import { useShowStore } from '@/store/showStore';
import { useDeviceStore } from '@/store/deviceStore';
import { useMIDIStore } from '@/store/midiStore';
import EditShowModal from '@/components/modals/EditShowModal';
import type { Show } from '@/types';

interface HeaderProps {
  shows: Show[];
  onShowChange: (showId: string) => void;
  onNewShow: () => void;
  onEditShow: (showId: string, name: string) => void;
  onDeleteShow: (showId: string) => void;
  onOpenSettings: () => void;
  onOpenExportImport: () => void;
  onLogout: () => void;
}

export default function Header({ shows, onShowChange, onNewShow, onEditShow, onDeleteShow, onOpenSettings, onOpenExportImport, onLogout }: HeaderProps) {
  const { mode, setMode, currentShowId, currentShow } = useShowStore();
  const { blackout, controllingDevices, availableDevices, isLoadingDevices, deviceError, fetchDevices } = useDeviceStore();
  const { isConnected, lastNote, selectedInputId, availableInputs } = useMIDIStore();
  const [showEditModal, setShowEditModal] = useState(false);
  
  const isBlackingOut = controllingDevices.size > 0;
  const selectedInput = availableInputs.find(i => i.id === selectedInputId);
  const deviceCount = availableDevices.length;
  const currentShowName = currentShow?.name || '';
  
  const handleBlackout = async () => {
    try {
      await blackout();
    } catch (error) {
      console.error('Blackout failed:', error);
    }
  };
  
  const handleEditShow = (name: string) => {
    if (currentShowId) {
      onEditShow(currentShowId, name);
    }
  };
  
  const handleDeleteShow = () => {
    if (currentShowId) {
      onDeleteShow(currentShowId);
    }
  };
  
  return (
    <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6">
      {/* Left section - Logo and Show selector */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-white tracking-tight">Stage Control</h1>
        </div>
        
        <div className="h-8 w-px bg-zinc-700" />
        
        <div className="flex items-center gap-2">
          <select
            value={currentShowId || ''}
            onChange={(e) => onShowChange(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none min-w-[180px]"
          >
            <option value="" disabled>Select a show...</option>
            {shows.map((show) => (
              <option key={show.id} value={show.id}>{show.name}</option>
            ))}
          </select>
          
          {currentShowId && (
            <>
              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                title="Edit Show Name"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={handleDeleteShow}
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Delete Show"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
          
          <button
            onClick={onNewShow}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="New Show"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Center section - Mode toggle */}
      <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-1">
        <button
          onClick={() => setMode('edit')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            mode === 'edit'
              ? 'bg-zinc-700 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Mode
          </span>
        </button>
        <button
          onClick={() => setMode('show')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            mode === 'show'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Show Mode
          </span>
        </button>
      </div>
      
      {/* Right section - Devices, MIDI status, Settings, Blackout */}
      <div className="flex items-center gap-4">
        {/* Device Status */}
        <button
          onClick={() => fetchDevices()}
          disabled={isLoadingDevices}
          className="flex items-center gap-2 text-sm hover:bg-zinc-800 px-2 py-1 rounded transition-colors"
          title={deviceError || `${deviceCount} devices loaded`}
        >
          <div className={`w-2 h-2 rounded-full ${
            isLoadingDevices ? 'bg-amber-500 animate-pulse' :
            deviceError ? 'bg-red-500' :
            deviceCount > 0 ? 'bg-emerald-500' : 'bg-zinc-600'
          }`} />
          <span className={`${deviceError ? 'text-red-400' : 'text-zinc-400'}`}>
            {isLoadingDevices ? 'Loading...' :
             deviceError ? 'Error' :
             `${deviceCount} device${deviceCount !== 1 ? 's' : ''}`}
          </span>
          <svg className={`w-3 h-3 text-zinc-500 ${isLoadingDevices ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        
        <div className="h-4 w-px bg-zinc-700" />
        
        {/* MIDI Status */}
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected && selectedInputId ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
          <span className="text-zinc-400">
            {isConnected && selectedInputId 
              ? `MIDI: ${selectedInput?.name || 'Connected'}` 
              : 'MIDI: Off'}
          </span>
          {lastNote && (
            <span className="text-amber-500 font-mono text-xs">
              Note {lastNote.note}
            </span>
          )}
        </div>
        
        {/* Export/Import */}
        <button
          onClick={onOpenExportImport}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          title="Export / Import"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>
        
        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          title="MIDI Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        
        {/* Logout */}
        <button
          onClick={onLogout}
          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
          title="Logout"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
        
        {/* Blackout Button */}
        <button
          onClick={handleBlackout}
          disabled={isBlackingOut}
          className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${
            isBlackingOut
              ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30'
          }`}
        >
          {isBlackingOut ? 'BLACKING OUT...' : 'BLACKOUT'}
        </button>
      </div>
      
      {/* Edit Show Modal */}
      {showEditModal && (
        <EditShowModal
          showName={currentShowName}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditShow}
        />
      )}
    </header>
  );
}

