'use client';

import { useEffect, useState } from 'react';
import { useShowStore } from '@/store/showStore';
import { useDeviceStore } from '@/store/deviceStore';
import { useMIDIStore } from '@/store/midiStore';
import { playSequence, executeMIDIAction } from '@/lib/midi';
import { hasCredentials, clearCredentials } from '@/lib/credentials';

import LoginScreen from '@/components/auth/LoginScreen';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MainPanel from '@/components/layout/MainPanel';

import CreateShowModal from '@/components/modals/CreateShowModal';
import SceneModal from '@/components/modals/SceneModal';
import DeviceGroupModal from '@/components/modals/DeviceGroupModal';
import SequenceModal from '@/components/modals/SequenceModal';
import SequenceEditor from '@/components/sequences/SequenceEditor';
import SequenceVisualizer from '@/components/sequences/SequenceVisualizer';
import MIDISettings from '@/components/midi/MIDISettings';
import ExportImportModal from '@/components/modals/ExportImportModal';
import ConfirmModal from '@/components/modals/ConfirmModal';

import type { 
  SceneWithGroups, 
  DeviceGroupWithItems,
  MIDIActionType, 
  SequenceWithSteps,
  DeviceGroupItem
} from '@/types';

export default function StageControl() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  
  // Check login status on mount
  useEffect(() => {
    setIsLoggedIn(hasCredentials());
  }, []);
  
  const handleLogout = () => {
    clearCredentials();
    setIsLoggedIn(false);
  };
  
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };
  
  // Show loading while checking auth
  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }
  
  return <StageControlApp onLogout={handleLogout} />;
}

function StageControlApp({ onLogout }: { onLogout: () => void }) {
  const {
    mode,
    shows,
    currentShow,
    currentShowId,
    selectedSceneId,
    isLoading,
    loadShows,
    loadShow,
    createShow,
    deleteShow,
    setSelectedSceneId,
    addScene,
    updateScene,
    deleteScene,
    addDeviceGroup,
    updateDeviceGroup,
    deleteDeviceGroup,
    addDeviceToGroup,
    removeDeviceFromGroup,
    updateDeviceItem,
    addSequence,
    updateSequence,
    deleteSequence,
    addSequenceStep,
    updateSequenceStep,
    deleteSequenceStep,
    addStepAction,
    removeStepAction,
    addMIDIMapping,
    updateMIDIMapping,
    deleteMIDIMapping,
    getDeviceGroupById,
    getSequenceById,
  } = useShowStore();

  const { 
    availableDevices, 
    fetchDevices, 
    blackout,
    isLoadingDevices 
  } = useDeviceStore();

  const { 
    initialize: initializeMIDI, 
    setNoteOnHandler,
    isSupported: midiSupported 
  } = useMIDIStore();

  // Modals
  const [showCreateShowModal, setShowCreateShowModal] = useState(false);
  const [showSceneModal, setShowSceneModal] = useState(false);
  const [editingScene, setEditingScene] = useState<SceneWithGroups | null>(null);
  const [showDeviceGroupModal, setShowDeviceGroupModal] = useState(false);
  const [editingDeviceGroup, setEditingDeviceGroup] = useState<DeviceGroupWithItems | null>(null);
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [editingSequence, setEditingSequence] = useState<SequenceWithSteps | null>(null);
  const [visualizingSequence, setVisualizingSequence] = useState<SequenceWithSteps | null>(null);
  const [showMIDISettings, setShowMIDISettings] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Load shows from localStorage on mount
  useEffect(() => {
    loadShows();
    fetchDevices();
    if (midiSupported) {
      initializeMIDI();
    }
  }, []);

  // Setup MIDI handler
  useEffect(() => {
    if (!currentShow) return;

    setNoteOnHandler((note, channel, velocity) => {
      const mapping = currentShow.midi_mappings.find(
        m => m.midi_note === note && m.midi_channel === channel
      );

      if (mapping) {
        executeMIDIAction(
          mapping,
          getDeviceGroupById,
          getSequenceById,
          handlePlaySequence
        );
      }
    });

    return () => setNoteOnHandler(() => {});
  }, [currentShow?.midi_mappings]);

  // Keyboard shortcuts (show mode)
  useEffect(() => {
    if (mode !== 'show') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys 1-9 to switch scenes
      if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (currentShow && currentShow.scenes[index]) {
          setSelectedSceneId(currentShow.scenes[index].id);
        }
      }
      // Spacebar for blackout
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        blackout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, currentShow]);

  const handleShowChange = (showId: string) => {
    if (showId) {
      loadShow(showId);
    }
  };

  const handleCreateShow = (name: string) => {
    createShow(name);
    setShowCreateShowModal(false);
  };

  const handleDeleteShow = (showId: string) => {
    setConfirmModal({
      title: 'Delete Show',
      message: 'Are you sure you want to delete this show? This cannot be undone.',
      onConfirm: () => {
        deleteShow(showId);
        setConfirmModal(null);
      },
    });
  };

  // Scene handlers
  const handleAddScene = () => {
    setEditingScene(null);
    setShowSceneModal(true);
  };

  const handleEditScene = (scene: SceneWithGroups) => {
    setEditingScene(scene);
    setShowSceneModal(true);
  };

  const handleSaveScene = (name: string, color: string) => {
    if (editingScene) {
      updateScene(editingScene.id, { name, color });
    } else {
      addScene(name, color);
    }
    setShowSceneModal(false);
    setEditingScene(null);
  };

  const handleDeleteScene = (sceneId: string) => {
    setConfirmModal({
      title: 'Delete Scene',
      message: 'Are you sure you want to delete this scene? All device groups in this scene will also be deleted.',
      onConfirm: () => {
        deleteScene(sceneId);
        setConfirmModal(null);
      },
    });
  };

  // Device Group handlers
  const handleAddDeviceGroup = () => {
    setEditingDeviceGroup(null);
    setShowDeviceGroupModal(true);
  };

  const handleEditDeviceGroup = (group: DeviceGroupWithItems) => {
    setEditingDeviceGroup(group);
    setShowDeviceGroupModal(true);
  };

  const handleSaveDeviceGroup = (
    name: string, 
    color: string, 
    devices: Omit<DeviceGroupItem, 'id' | 'device_group_id' | 'created_at'>[]
  ) => {
    if (!selectedSceneId) return;

    if (editingDeviceGroup) {
      // Update existing group
      updateDeviceGroup(editingDeviceGroup.id, { name, color });
      
      // Clear existing devices and add new ones
      for (const item of editingDeviceGroup.items) {
        removeDeviceFromGroup(editingDeviceGroup.id, item.id);
      }
      for (const device of devices) {
        addDeviceToGroup(
          editingDeviceGroup.id, 
          device.device_id, 
          device.device_name, 
          device.device_type || null
        );
      }
    } else {
      // Create new group
      const groupId = addDeviceGroup(selectedSceneId, name, color);
      if (groupId) {
        for (const device of devices) {
          addDeviceToGroup(
            groupId, 
            device.device_id, 
            device.device_name, 
            device.device_type || null
          );
        }
      }
    }
    
    setShowDeviceGroupModal(false);
    setEditingDeviceGroup(null);
  };

  const handleDeleteDeviceGroup = (groupId: string) => {
    setConfirmModal({
      title: 'Delete Device Group',
      message: 'Are you sure you want to delete this device group?',
      onConfirm: () => {
        deleteDeviceGroup(groupId);
        setConfirmModal(null);
      },
    });
  };

  // Sequence handlers
  const handleAddSequence = () => {
    setShowSequenceModal(true);
  };

  const handleCreateSequence = (name: string) => {
    addSequence(name);
    setShowSequenceModal(false);
  };

  const handleEditSequence = (sequence: SequenceWithSteps) => {
    setEditingSequence(sequence);
  };

  const handleVisualizeSequence = (sequence: SequenceWithSteps) => {
    setVisualizingSequence(sequence);
  };

  const handleDeleteSequence = (sequenceId: string) => {
    setConfirmModal({
      title: 'Delete Sequence',
      message: 'Are you sure you want to delete this sequence?',
      onConfirm: () => {
        deleteSequence(sequenceId);
        setConfirmModal(null);
      },
    });
  };

  const handlePlaySequence = async (sequence: SequenceWithSteps) => {
    await playSequence(sequence);
  };

  // Sequence editor handlers
  const handleUpdateSequenceName = (name: string) => {
    if (!editingSequence) return;
    updateSequence(editingSequence.id, { name });
    setEditingSequence({ ...editingSequence, name });
  };

  const handleAddStep = (delayMs: number) => {
    if (!editingSequence) return;
    const stepId = addSequenceStep(editingSequence.id, delayMs);
    if (stepId) {
      setEditingSequence({
        ...editingSequence,
        steps: [
          ...editingSequence.steps,
          {
            id: stepId,
            sequence_id: editingSequence.id,
            delay_ms: delayMs,
            order_index: editingSequence.steps.length,
            created_at: new Date().toISOString(),
            actions: []
          }
        ]
      });
    }
  };

  const handleUpdateStep = (stepId: string, delayMs: number) => {
    if (!editingSequence) return;
    updateSequenceStep(editingSequence.id, stepId, { delay_ms: delayMs });
    setEditingSequence({
      ...editingSequence,
      steps: editingSequence.steps.map(s => 
        s.id === stepId ? { ...s, delay_ms: delayMs } : s
      )
    });
  };

  const handleDeleteStep = (stepId: string) => {
    if (!editingSequence) return;
    deleteSequenceStep(editingSequence.id, stepId);
    setEditingSequence({
      ...editingSequence,
      steps: editingSequence.steps.filter(s => s.id !== stepId)
    });
  };

  const handleAddStepAction = (
    stepId: string, 
    deviceId: string, 
    deviceName: string, 
    action: 'on' | 'off'
  ) => {
    if (!editingSequence) return;
    addStepAction(editingSequence.id, stepId, deviceId, deviceName, action);
    
    // Refresh editing sequence from store
    const updated = getSequenceById(editingSequence.id);
    if (updated) {
      setEditingSequence(updated);
    }
  };

  const handleRemoveStepAction = (stepId: string, actionId: string) => {
    if (!editingSequence) return;
    removeStepAction(editingSequence.id, stepId, actionId);
    setEditingSequence({
      ...editingSequence,
      steps: editingSequence.steps.map(s => 
        s.id === stepId 
          ? { ...s, actions: s.actions.filter(a => a.id !== actionId) }
          : s
      )
    });
  };

  // MIDI handlers
  const handleAddMIDIMapping = (
    midiNote: number, 
    midiChannel: number, 
    actionType: string, 
    targetId: string | null
  ) => {
    addMIDIMapping(midiNote, midiChannel, actionType, targetId);
  };

  const handleUpdateMIDIMapping = (id: string, actionType: MIDIActionType, targetId: string | null) => {
    updateMIDIMapping(id, { action_type: actionType, target_id: targetId });
  };
  
  const handleDeleteMIDIMapping = (mappingId: string) => {
    deleteMIDIMapping(mappingId);
  };

  // Get all device groups for sequence editor
  const allDeviceGroups = currentShow?.scenes.flatMap(s => s.device_groups) || [];

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-white overflow-hidden">
      <Header
        shows={shows}
        onShowChange={handleShowChange}
        onNewShow={() => setShowCreateShowModal(true)}
        onOpenSettings={() => setShowMIDISettings(true)}
        onOpenExportImport={() => setShowExportImport(true)}
        onLogout={onLogout}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          onAddScene={handleAddScene}
          onEditScene={handleEditScene}
          onDeleteScene={handleDeleteScene}
        />
        
        <MainPanel
          availableDevices={availableDevices}
          onAddDeviceGroup={handleAddDeviceGroup}
          onEditDeviceGroup={handleEditDeviceGroup}
          onDeleteDeviceGroup={handleDeleteDeviceGroup}
          onAddSequence={handleAddSequence}
          onEditSequence={handleEditSequence}
          onDeleteSequence={handleDeleteSequence}
          onPlaySequence={handlePlaySequence}
          onVisualizeSequence={handleVisualizeSequence}
        />
      </div>

      {/* Loading overlay */}
      {(isLoading || isLoadingDevices) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-xl p-8 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white">Loading...</p>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateShowModal && (
        <CreateShowModal
          onClose={() => setShowCreateShowModal(false)}
          onCreate={handleCreateShow}
        />
      )}

      {showSceneModal && (
        <SceneModal
          scene={editingScene || undefined}
          onClose={() => {
            setShowSceneModal(false);
            setEditingScene(null);
          }}
          onSave={handleSaveScene}
        />
      )}

      {showDeviceGroupModal && (
        <DeviceGroupModal
          group={editingDeviceGroup || undefined}
          availableDevices={availableDevices}
          onClose={() => {
            setShowDeviceGroupModal(false);
            setEditingDeviceGroup(null);
          }}
          onSave={handleSaveDeviceGroup}
        />
      )}

      {showSequenceModal && (
        <SequenceModal
          onClose={() => setShowSequenceModal(false)}
          onCreate={handleCreateSequence}
        />
      )}

      {editingSequence && (
        <SequenceEditor
          sequence={editingSequence}
          availableDevices={availableDevices}
          deviceGroups={allDeviceGroups}
          onUpdateName={handleUpdateSequenceName}
          onAddStep={handleAddStep}
          onUpdateStep={handleUpdateStep}
          onDeleteStep={handleDeleteStep}
          onAddAction={handleAddStepAction}
          onRemoveAction={handleRemoveStepAction}
          onClose={() => setEditingSequence(null)}
        />
      )}

      {showMIDISettings && (
        <MIDISettings
          onClose={() => setShowMIDISettings(false)}
          onAddMapping={handleAddMIDIMapping}
          onUpdateMapping={handleUpdateMIDIMapping}
          onDeleteMapping={handleDeleteMIDIMapping}
        />
      )}

      {showExportImport && (
        <ExportImportModal
          onClose={() => setShowExportImport(false)}
        />
      )}

      {visualizingSequence && (
        <SequenceVisualizer
          sequence={visualizingSequence}
          availableDevices={availableDevices}
          onClose={() => setVisualizingSequence(null)}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
