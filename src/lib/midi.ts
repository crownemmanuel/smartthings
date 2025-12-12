import type { MIDIMapping, MIDIActionType, DeviceGroupWithItems, SequenceWithSteps } from '@/types';
import { useDeviceStore } from '@/store/deviceStore';
import { useShowStore } from '@/store/showStore';

// Execute a MIDI mapping action
export async function executeMIDIAction(
  mapping: MIDIMapping,
  getDeviceGroup: (id: string) => DeviceGroupWithItems | null,
  getSequence: (id: string) => SequenceWithSteps | null,
  playSequence: (sequence: SequenceWithSteps) => Promise<void>
) {
  const deviceStore = useDeviceStore.getState();
  const showStore = useShowStore.getState();
  
  switch (mapping.action_type) {
    case 'device_group_on':
      if (mapping.target_id) {
        const group = getDeviceGroup(mapping.target_id);
        if (group) {
          await turnGroupOn(group);
        }
      }
      break;
      
    case 'device_group_off':
      if (mapping.target_id) {
        const group = getDeviceGroup(mapping.target_id);
        if (group) {
          await turnGroupOff(group);
        }
      }
      break;
      
    case 'device_group_toggle':
      if (mapping.target_id) {
        const group = getDeviceGroup(mapping.target_id);
        if (group) {
          await toggleGroup(group);
        }
      }
      break;
      
    case 'sequence_play':
      if (mapping.target_id) {
        const sequence = getSequence(mapping.target_id);
        if (sequence) {
          await playSequence(sequence);
        }
      }
      break;
      
    case 'scene_activate':
      if (mapping.target_id) {
        showStore.setSelectedSceneId(mapping.target_id);
      }
      break;
      
    case 'blackout':
      await deviceStore.blackout();
      break;
  }
}

// Turn all devices in a group on
export async function turnGroupOn(group: DeviceGroupWithItems) {
  const deviceStore = useDeviceStore.getState();
  
  const promises = group.items.map(item => {
    if (item.turn_on) {
      return deviceStore.turnOn(item.device_id).catch(err => {
        console.error(`Failed to turn on ${item.device_name}:`, err);
      });
    }
    return Promise.resolve();
  });
  
  await Promise.all(promises);
}

// Turn all devices in a group off
export async function turnGroupOff(group: DeviceGroupWithItems) {
  const deviceStore = useDeviceStore.getState();
  
  const promises = group.items.map(item => {
    return deviceStore.turnOff(item.device_id).catch(err => {
      console.error(`Failed to turn off ${item.device_name}:`, err);
    });
  });
  
  await Promise.all(promises);
}

// Toggle all devices in a group
export async function toggleGroup(group: DeviceGroupWithItems) {
  const deviceStore = useDeviceStore.getState();
  
  const promises = group.items.map(item => {
    return deviceStore.toggle(item.device_id).catch(err => {
      console.error(`Failed to toggle ${item.device_name}:`, err);
    });
  });
  
  await Promise.all(promises);
}

// Play a sequence
export async function playSequence(sequence: SequenceWithSteps): Promise<void> {
  const deviceStore = useDeviceStore.getState();
  
  // Sort steps by order_index
  const sortedSteps = [...sequence.steps].sort((a, b) => a.order_index - b.order_index);
  
  for (const step of sortedSteps) {
    // Wait for the delay
    if (step.delay_ms > 0) {
      await new Promise(resolve => setTimeout(resolve, step.delay_ms));
    }
    
    // Execute all actions in this step in parallel
    const actionPromises = step.actions.map(async (action) => {
      try {
        if (action.action === 'on') {
          if (action.device_id) {
            await deviceStore.turnOn(action.device_id);
          }
        } else {
          if (action.device_id) {
            await deviceStore.turnOff(action.device_id);
          }
        }
      } catch (err) {
        console.error(`Failed to execute action for ${action.device_name}:`, err);
      }
    });
    
    await Promise.all(actionPromises);
  }
}

