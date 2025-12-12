import { create } from 'zustand';
import { 
  getLocalShows, 
  getLocalShow, 
  saveLocalShow, 
  deleteLocalShow, 
  getCurrentShowId, 
  setCurrentShowId,
  createEmptyShow,
  generateId 
} from '@/lib/storage';
import type { 
  Show, 
  FullShow, 
  Scene, 
  SceneWithGroups, 
  DeviceGroup, 
  DeviceGroupWithItems, 
  DeviceGroupItem,
  Sequence,
  SequenceWithSteps,
  SequenceStep,
  SequenceStepWithActions,
  StepAction,
  MIDIMapping,
  AppMode 
} from '@/types';

interface ShowState {
  // App state
  mode: AppMode;
  isLoading: boolean;
  error: string | null;
  
  // Shows
  shows: Show[];
  currentShowId: string | null;
  currentShow: FullShow | null;
  
  // Selected items
  selectedSceneId: string | null;
  
  // Actions - Mode
  setMode: (mode: AppMode) => void;
  
  // Actions - Loading
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Actions - Shows (localStorage)
  loadShows: () => void;
  loadShow: (showId: string) => void;
  createShow: (name: string) => FullShow;
  saveCurrentShow: () => void;
  deleteShow: (id: string) => void;
  importShow: (show: FullShow) => void;
  
  // Legacy setters (for compatibility)
  setShows: (shows: Show[]) => void;
  setCurrentShow: (show: FullShow | null) => void;
  setCurrentShowId: (id: string | null) => void;
  
  // Actions - Scenes
  setSelectedSceneId: (id: string | null) => void;
  addScene: (name: string, color: string) => void;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  deleteScene: (id: string) => void;
  reorderScenes: (sceneIds: string[]) => void;
  
  // Actions - Device Groups
  addDeviceGroup: (sceneId: string, name: string, color: string) => string;
  updateDeviceGroup: (id: string, updates: Partial<DeviceGroup>) => void;
  deleteDeviceGroup: (id: string) => void;
  reorderDeviceGroups: (sceneId: string, groupIds: string[]) => void;
  
  // Actions - Device Group Items
  addDeviceToGroup: (groupId: string, deviceId: string, deviceName: string, deviceType: string | null) => void;
  removeDeviceFromGroup: (groupId: string, itemId: string) => void;
  updateDeviceItem: (groupId: string, itemId: string, updates: Partial<DeviceGroupItem>) => void;
  
  // Actions - Sequences
  addSequence: (name: string) => string;
  updateSequence: (id: string, updates: Partial<Sequence>) => void;
  deleteSequence: (id: string) => void;
  
  // Actions - Sequence Steps
  addSequenceStep: (sequenceId: string, delayMs: number) => string;
  updateSequenceStep: (sequenceId: string, stepId: string, updates: Partial<SequenceStep>) => void;
  deleteSequenceStep: (sequenceId: string, stepId: string) => void;
  reorderSequenceSteps: (sequenceId: string, stepIds: string[]) => void;
  
  // Actions - Step Actions
  addStepAction: (sequenceId: string, stepId: string, deviceId: string, deviceName: string, action: 'on' | 'off') => void;
  removeStepAction: (sequenceId: string, stepId: string, actionId: string) => void;
  
  // Actions - MIDI Mappings
  addMIDIMapping: (midiNote: number, midiChannel: number, actionType: string, targetId: string | null) => void;
  updateMIDIMapping: (id: string, updates: Partial<MIDIMapping>) => void;
  deleteMIDIMapping: (id: string) => void;
  
  // Helpers
  getSelectedScene: () => SceneWithGroups | null;
  getSceneById: (id: string) => SceneWithGroups | null;
  getDeviceGroupById: (id: string) => DeviceGroupWithItems | null;
  getSequenceById: (id: string) => SequenceWithSteps | null;
}

export const useShowStore = create<ShowState>((set, get) => ({
  // Initial state
  mode: 'edit',
  isLoading: false,
  error: null,
  shows: [],
  currentShowId: null,
  currentShow: null,
  selectedSceneId: null,
  
  // Mode actions
  setMode: (mode) => set({ mode }),
  
  // Loading actions
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  // Show actions (localStorage)
  loadShows: () => {
    const shows = getLocalShows();
    const lastShowId = getCurrentShowId();
    set({ shows });
    
    // Auto-load last show
    if (lastShowId && shows.some(s => s.id === lastShowId)) {
      get().loadShow(lastShowId);
    }
  },
  
  loadShow: (showId) => {
    const show = getLocalShow(showId);
    if (show) {
      setCurrentShowId(showId);
      set({ 
        currentShow: show, 
        currentShowId: showId,
        selectedSceneId: show.scenes[0]?.id || null
      });
    }
  },
  
  createShow: (name) => {
    const show = createEmptyShow(name);
    saveLocalShow(show);
    
    const shows = getLocalShows();
    setCurrentShowId(show.id);
    
    set({ 
      shows,
      currentShow: show, 
      currentShowId: show.id,
      selectedSceneId: null
    });
    
    return show;
  },
  
  saveCurrentShow: () => {
    const { currentShow } = get();
    if (currentShow) {
      saveLocalShow(currentShow);
      const shows = getLocalShows();
      set({ shows });
    }
  },
  
  deleteShow: (id) => {
    deleteLocalShow(id);
    const shows = getLocalShows();
    const { currentShowId } = get();
    
    if (currentShowId === id) {
      setCurrentShowId(null);
      set({ 
        shows,
        currentShow: null, 
        currentShowId: null,
        selectedSceneId: null
      });
    } else {
      set({ shows });
    }
  },
  
  importShow: (show) => {
    saveLocalShow(show);
    const shows = getLocalShows();
    setCurrentShowId(show.id);
    
    set({ 
      shows,
      currentShow: show, 
      currentShowId: show.id,
      selectedSceneId: show.scenes[0]?.id || null
    });
  },
  
  // Legacy setters
  setShows: (shows) => set({ shows }),
  setCurrentShow: (show) => {
    if (show) {
      setCurrentShowId(show.id);
      set({ 
        currentShow: show, 
        currentShowId: show.id,
        selectedSceneId: show.scenes[0]?.id || null
      });
    } else {
      setCurrentShowId(null);
      set({ currentShow: null, currentShowId: null, selectedSceneId: null });
    }
  },
  setCurrentShowId: (id) => {
    if (id) {
      setCurrentShowId(id);
    }
    set({ currentShowId: id });
  },
  
  // Scene actions
  setSelectedSceneId: (id) => set({ selectedSceneId: id }),
  
  addScene: (name, color) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return;
    
    const newScene: SceneWithGroups = {
      id: generateId(),
      show_id: currentShow.id,
      name,
      color,
      order_index: currentShow.scenes.length,
      created_at: new Date().toISOString(),
      device_groups: [],
    };
    
    set({
      currentShow: {
        ...currentShow,
        scenes: [...currentShow.scenes, newScene]
      },
      selectedSceneId: newScene.id,
    });
    
    saveCurrentShow();
  },
  
  updateScene: (id, updates) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return;
    
    set({
      currentShow: {
        ...currentShow,
        scenes: currentShow.scenes.map(s => 
          s.id === id ? { ...s, ...updates } : s
        )
      }
    });
    
    saveCurrentShow();
  },
  
  deleteScene: (id) => {
    const { currentShow, selectedSceneId, saveCurrentShow } = get();
    if (!currentShow) return;
    
    const newScenes = currentShow.scenes.filter(s => s.id !== id);
    
    set({
      currentShow: {
        ...currentShow,
        scenes: newScenes
      },
      selectedSceneId: selectedSceneId === id 
        ? (newScenes[0]?.id || null) 
        : selectedSceneId
    });
    
    saveCurrentShow();
  },
  
  reorderScenes: (sceneIds) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return;
    
    const sceneMap = new Map(currentShow.scenes.map(s => [s.id, s]));
    const reorderedScenes = sceneIds
      .map((id, index) => {
        const scene = sceneMap.get(id);
        return scene ? { ...scene, order_index: index } : null;
      })
      .filter((s): s is SceneWithGroups => s !== null);
    
    set({
      currentShow: {
        ...currentShow,
        scenes: reorderedScenes
      }
    });
    
    saveCurrentShow();
  },
  
  // Device Group actions
  addDeviceGroup: (sceneId, name, color) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return '';
    
    const scene = currentShow.scenes.find(s => s.id === sceneId);
    if (!scene) return '';
    
    const groupId = generateId();
    const newGroup: DeviceGroupWithItems = {
      id: groupId,
      scene_id: sceneId,
      name,
      color,
      order_index: scene.device_groups.length,
      created_at: new Date().toISOString(),
      items: [],
    };
    
    set({
      currentShow: {
        ...currentShow,
        scenes: currentShow.scenes.map(s => 
          s.id === sceneId 
            ? { ...s, device_groups: [...s.device_groups, newGroup] }
            : s
        )
      }
    });
    
    saveCurrentShow();
    return groupId;
  },
  
  updateDeviceGroup: (id, updates) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return;
    
    set({
      currentShow: {
        ...currentShow,
        scenes: currentShow.scenes.map(scene => ({
          ...scene,
          device_groups: scene.device_groups.map(g => 
            g.id === id ? { ...g, ...updates } : g
          )
        }))
      }
    });
    
    saveCurrentShow();
  },
  
  deleteDeviceGroup: (id) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return;
    
    set({
      currentShow: {
        ...currentShow,
        scenes: currentShow.scenes.map(scene => ({
          ...scene,
          device_groups: scene.device_groups.filter(g => g.id !== id)
        }))
      }
    });
    
    saveCurrentShow();
  },
  
  reorderDeviceGroups: (sceneId, groupIds) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return;
    
    set({
      currentShow: {
        ...currentShow,
        scenes: currentShow.scenes.map(scene => {
          if (scene.id !== sceneId) return scene;
          const groupMap = new Map(scene.device_groups.map(g => [g.id, g]));
          const reorderedGroups = groupIds
            .map((id, index) => {
              const group = groupMap.get(id);
              return group ? { ...group, order_index: index } : null;
            })
            .filter((g): g is DeviceGroupWithItems => g !== null);
          return { ...scene, device_groups: reorderedGroups };
        })
      }
    });
    
    saveCurrentShow();
  },
  
  // Device Group Item actions
  addDeviceToGroup: (groupId, deviceId, deviceName, deviceType) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return;
    
    const newItem: DeviceGroupItem = {
      id: generateId(),
      device_group_id: groupId,
      device_id: deviceId,
      device_name: deviceName,
      device_type: deviceType,
      turn_on: true,
      created_at: new Date().toISOString(),
    };
    
    set({
      currentShow: {
        ...currentShow,
        scenes: currentShow.scenes.map(scene => ({
          ...scene,
          device_groups: scene.device_groups.map(group => 
            group.id === groupId 
              ? { ...group, items: [...group.items, newItem] }
              : group
          )
        }))
      }
    });
    
    saveCurrentShow();
  },
  
  removeDeviceFromGroup: (groupId, itemId) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return;
    
    set({
      currentShow: {
        ...currentShow,
        scenes: currentShow.scenes.map(scene => ({
          ...scene,
          device_groups: scene.device_groups.map(group => 
            group.id === groupId 
              ? { ...group, items: group.items.filter(i => i.id !== itemId) }
              : group
          )
        }))
      }
    });
    
    saveCurrentShow();
  },
  
  updateDeviceItem: (groupId, itemId, updates) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return;
    
    set({
      currentShow: {
        ...currentShow,
        scenes: currentShow.scenes.map(scene => ({
          ...scene,
          device_groups: scene.device_groups.map(group => 
            group.id === groupId 
              ? { 
                  ...group, 
                  items: group.items.map(i => 
                    i.id === itemId ? { ...i, ...updates } : i
                  ) 
                }
              : group
          )
        }))
      }
    });
    
    saveCurrentShow();
  },
  
  // Sequence actions
  addSequence: (name) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return '';
    
    const sequenceId = generateId();
    const newSequence: SequenceWithSteps = {
      id: sequenceId,
      show_id: currentShow.id,
      name,
      created_at: new Date().toISOString(),
      steps: [],
    };
    
    set({
      currentShow: {
        ...currentShow,
        sequences: [...currentShow.sequences, newSequence]
      }
    });
    
    saveCurrentShow();
    return sequenceId;
  },
  
  updateSequence: (id, updates) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return;
    
    set({
      currentShow: {
        ...currentShow,
        sequences: currentShow.sequences.map(s => 
          s.id === id ? { ...s, ...updates } : s
        )
      }
    });
    
    saveCurrentShow();
  },
  
  deleteSequence: (id) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return;
    
    set({
      currentShow: {
        ...currentShow,
        sequences: currentShow.sequences.filter(s => s.id !== id)
      }
    });
    
    saveCurrentShow();
  },
  
  // Sequence Step actions
  addSequenceStep: (sequenceId, delayMs) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return '';
    
    const sequence = currentShow.sequences.find(s => s.id === sequenceId);
    if (!sequence) return '';
    
    const stepId = generateId();
    const newStep: SequenceStepWithActions = {
      id: stepId,
      sequence_id: sequenceId,
      delay_ms: delayMs,
      order_index: sequence.steps.length,
      created_at: new Date().toISOString(),
      actions: [],
    };
    
    set({
      currentShow: {
        ...currentShow,
        sequences: currentShow.sequences.map(seq => 
          seq.id === sequenceId 
            ? { ...seq, steps: [...seq.steps, newStep] }
            : seq
        )
      }
    });
    
    saveCurrentShow();
    return stepId;
  },
  
  updateSequenceStep: (sequenceId, stepId, updates) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return;
    
    set({
      currentShow: {
        ...currentShow,
        sequences: currentShow.sequences.map(seq => 
          seq.id === sequenceId 
            ? { 
                ...seq, 
                steps: seq.steps.map(s => 
                  s.id === stepId ? { ...s, ...updates } : s
                ) 
              }
            : seq
        )
      }
    });
    
    saveCurrentShow();
  },
  
  deleteSequenceStep: (sequenceId, stepId) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return;
    
    set({
      currentShow: {
        ...currentShow,
        sequences: currentShow.sequences.map(seq => 
          seq.id === sequenceId 
            ? { ...seq, steps: seq.steps.filter(s => s.id !== stepId) }
            : seq
        )
      }
    });
    
    saveCurrentShow();
  },
  
  reorderSequenceSteps: (sequenceId, stepIds) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return;
    
    set({
      currentShow: {
        ...currentShow,
        sequences: currentShow.sequences.map(seq => {
          if (seq.id !== sequenceId) return seq;
          const stepMap = new Map(seq.steps.map(s => [s.id, s]));
          const reorderedSteps = stepIds
            .map((id, index) => {
              const step = stepMap.get(id);
              return step ? { ...step, order_index: index } : null;
            })
            .filter((s): s is SequenceStepWithActions => s !== null);
          return { ...seq, steps: reorderedSteps };
        })
      }
    });
    
    saveCurrentShow();
  },
  
  // Step Action actions
  addStepAction: (sequenceId, stepId, deviceId, deviceName, action) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return;
    
    const newAction: StepAction = {
      id: generateId(),
      step_id: stepId,
      device_group_id: null,
      device_id: deviceId,
      device_name: deviceName,
      action,
      created_at: new Date().toISOString(),
    };
    
    set({
      currentShow: {
        ...currentShow,
        sequences: currentShow.sequences.map(seq => 
          seq.id === sequenceId 
            ? { 
                ...seq, 
                steps: seq.steps.map(step => 
                  step.id === stepId 
                    ? { ...step, actions: [...step.actions, newAction] }
                    : step
                ) 
              }
            : seq
        )
      }
    });
    
    saveCurrentShow();
  },
  
  removeStepAction: (sequenceId, stepId, actionId) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return;
    
    set({
      currentShow: {
        ...currentShow,
        sequences: currentShow.sequences.map(seq => 
          seq.id === sequenceId 
            ? { 
                ...seq, 
                steps: seq.steps.map(step => 
                  step.id === stepId 
                    ? { ...step, actions: step.actions.filter(a => a.id !== actionId) }
                    : step
                ) 
              }
            : seq
        )
      }
    });
    
    saveCurrentShow();
  },
  
  // MIDI Mapping actions
  addMIDIMapping: (midiNote, midiChannel, actionType, targetId) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return;
    
    const newMapping: MIDIMapping = {
      id: generateId(),
      show_id: currentShow.id,
      midi_note: midiNote,
      midi_channel: midiChannel,
      action_type: actionType as any,
      target_id: targetId,
      created_at: new Date().toISOString(),
    };
    
    set({
      currentShow: {
        ...currentShow,
        midi_mappings: [...currentShow.midi_mappings, newMapping]
      }
    });
    
    saveCurrentShow();
  },
  
  updateMIDIMapping: (id, updates) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return;
    
    set({
      currentShow: {
        ...currentShow,
        midi_mappings: currentShow.midi_mappings.map(m => 
          m.id === id ? { ...m, ...updates } : m
        )
      }
    });
    
    saveCurrentShow();
  },
  
  deleteMIDIMapping: (id) => {
    const { currentShow, saveCurrentShow } = get();
    if (!currentShow) return;
    
    set({
      currentShow: {
        ...currentShow,
        midi_mappings: currentShow.midi_mappings.filter(m => m.id !== id)
      }
    });
    
    saveCurrentShow();
  },
  
  // Helpers
  getSelectedScene: () => {
    const state = get();
    if (!state.currentShow || !state.selectedSceneId) return null;
    return state.currentShow.scenes.find(s => s.id === state.selectedSceneId) || null;
  },
  
  getSceneById: (id) => {
    const state = get();
    if (!state.currentShow) return null;
    return state.currentShow.scenes.find(s => s.id === id) || null;
  },
  
  getDeviceGroupById: (id) => {
    const state = get();
    if (!state.currentShow) return null;
    for (const scene of state.currentShow.scenes) {
      const group = scene.device_groups.find(g => g.id === id);
      if (group) return group;
    }
    return null;
  },
  
  getSequenceById: (id) => {
    const state = get();
    if (!state.currentShow) return null;
    return state.currentShow.sequences.find(s => s.id === id) || null;
  }
}));
