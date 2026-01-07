'use client';

import { useState } from 'react';
import { useShowStore } from '@/store/showStore';
import DeviceGroupList from '@/components/devices/DeviceGroupList';
import DeviceTable from '@/components/devices/DeviceTable';
import SequenceList from '@/components/sequences/SequenceList';
import EmptyState from '@/components/layout/EmptyState';
import type { TPLinkDevice, DeviceGroupWithItems, SequenceWithSteps } from '@/types';

type MainTab = 'show' | 'devices';

interface MainPanelProps {
  availableDevices: TPLinkDevice[];
  onCreateShow: () => void;
  onAddDeviceGroup: () => void;
  onEditDeviceGroup: (group: DeviceGroupWithItems) => void;
  onDeleteDeviceGroup: (groupId: string) => void;
  onAddSequence: () => void;
  onEditSequence: (sequence: SequenceWithSteps) => void;
  onDeleteSequence: (sequenceId: string) => void;
  onPlaySequence: (sequence: SequenceWithSteps) => void;
  onVisualizeSequence: (sequence: SequenceWithSteps) => void;
}

export default function MainPanel({
  availableDevices,
  onCreateShow,
  onAddDeviceGroup,
  onEditDeviceGroup,
  onDeleteDeviceGroup,
  onAddSequence,
  onEditSequence,
  onDeleteSequence,
  onPlaySequence,
  onVisualizeSequence,
}: MainPanelProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('show');
  const { mode, currentShow, selectedSceneId, getSelectedScene } = useShowStore();
  const selectedScene = getSelectedScene();
  const isEditMode = mode === 'edit';
  
  // Tab navigation component
  const TabNav = () => (
    <div className="border-b border-zinc-800 bg-zinc-900/50">
      <div className="max-w-5xl mx-auto px-8">
        <nav className="flex gap-1" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('show')}
            className={`relative px-5 py-4 text-sm font-medium transition-all ${
              activeTab === 'show'
                ? 'text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Show Control
            </span>
            {activeTab === 'show' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('devices')}
            className={`relative px-5 py-4 text-sm font-medium transition-all ${
              activeTab === 'devices'
                ? 'text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              All Devices
              <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-800 text-zinc-400">
                {availableDevices.length}
              </span>
            </span>
            {activeTab === 'devices' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
            )}
          </button>
        </nav>
      </div>
    </div>
  );

  if (!currentShow) {
    return (
      <main className="flex-1 flex flex-col bg-zinc-950">
        <TabNav />
        
        {activeTab === 'devices' ? (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto">
              <DeviceTable devices={availableDevices} />
            </div>
          </div>
        ) : (
          <EmptyState onCreateShow={onCreateShow} />
        )}
      </main>
    );
  }
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
      <TabNav />
      
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'devices' ? (
          <div className="max-w-5xl mx-auto p-8">
            <DeviceTable devices={availableDevices} />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto p-8">
            {/* Scene Header */}
            {selectedScene ? (
              <>
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedScene.color }}
                    />
                    <h2 className="text-2xl font-bold text-white">{selectedScene.name}</h2>
                  </div>
                  <p className="text-zinc-500">
                    {selectedScene.device_groups.length} device group{selectedScene.device_groups.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                {/* Device Groups */}
                <section className="mb-12">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Device Groups</h3>
                    {isEditMode && (
                      <button
                        onClick={onAddDeviceGroup}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-amber-500 hover:text-amber-400 hover:bg-zinc-900 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Group
                      </button>
                    )}
                  </div>
                  
                  <DeviceGroupList
                    groups={selectedScene.device_groups}
                    availableDevices={availableDevices}
                    isEditMode={isEditMode}
                    onEdit={onEditDeviceGroup}
                    onDelete={onDeleteDeviceGroup}
                  />
                </section>
              </>
            ) : (
              <div className="mb-8 py-12 text-center">
                <p className="text-zinc-500">Select a scene from the sidebar to manage device groups</p>
              </div>
            )}
            
            {/* Sequences */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Sequences</h3>
                {isEditMode && (
                  <button
                    onClick={onAddSequence}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-amber-500 hover:text-amber-400 hover:bg-zinc-900 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Sequence
                  </button>
                )}
              </div>
              
              <SequenceList
                sequences={currentShow.sequences}
                isEditMode={isEditMode}
                onEdit={onEditSequence}
                onDelete={onDeleteSequence}
                onPlay={onPlaySequence}
                onVisualize={onVisualizeSequence}
              />
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

