// TP-Link Device from API
export interface TPLinkDevice {
  deviceId: string;
  alias: string;
  deviceType: string;
  status?: number;
  deviceModel?: string;
  appServerUrl?: string;
  deviceMac?: string;
  role?: number;
}

// Show - top level container
export interface Show {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// Scene - belongs to a show
export interface Scene {
  id: string;
  show_id: string;
  name: string;
  order_index: number;
  color: string;
  created_at: string;
}

// Device Group - belongs to a scene
export interface DeviceGroup {
  id: string;
  scene_id: string;
  name: string;
  color: string;
  order_index: number;
  created_at: string;
}

// Device Group Item - devices in a group with on/off state
export interface DeviceGroupItem {
  id: string;
  device_group_id: string;
  device_id: string;
  device_name: string;
  device_type: string | null;
  turn_on: boolean;
  created_at: string;
}

// Sequence - timed sequence of actions
export interface Sequence {
  id: string;
  show_id: string;
  name: string;
  created_at: string;
}

// Sequence Step - individual step with timing
export interface SequenceStep {
  id: string;
  sequence_id: string;
  delay_ms: number;
  order_index: number;
  created_at: string;
}

// Step Action - what happens in each step
export interface StepAction {
  id: string;
  step_id: string;
  device_group_id: string | null;
  device_id: string | null;
  device_name: string | null;
  action: 'on' | 'off';
  created_at: string;
}

// MIDI Mapping - map MIDI notes to actions
export type MIDIActionType = 
  | 'device_group_on' 
  | 'device_group_off' 
  | 'device_group_toggle' 
  | 'sequence_play' 
  | 'scene_activate' 
  | 'blackout';

export interface MIDIMapping {
  id: string;
  show_id: string;
  midi_note: number;
  midi_channel: number;
  action_type: MIDIActionType;
  target_id: string | null;
  created_at: string;
}

// Full show data with all relations loaded
export interface FullShow extends Show {
  scenes: SceneWithGroups[];
  sequences: SequenceWithSteps[];
  midi_mappings: MIDIMapping[];
}

export interface SceneWithGroups extends Scene {
  device_groups: DeviceGroupWithItems[];
}

export interface DeviceGroupWithItems extends DeviceGroup {
  items: DeviceGroupItem[];
}

export interface SequenceWithSteps extends Sequence {
  steps: SequenceStepWithActions[];
}

export interface SequenceStepWithActions extends SequenceStep {
  actions: StepAction[];
}

// App mode
export type AppMode = 'edit' | 'show';

// Device state tracking
export interface DeviceState {
  deviceId: string;
  isOn: boolean;
  lastUpdated: number;
}
