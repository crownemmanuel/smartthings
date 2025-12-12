import { create } from 'zustand';
import { getCredentials } from '@/lib/credentials';
import type { TPLinkDevice, DeviceState } from '@/types';

interface DeviceStoreState {
  // Available devices from TP-Link
  availableDevices: TPLinkDevice[];
  isLoadingDevices: boolean;
  deviceError: string | null;
  
  // Device states (on/off tracking)
  deviceStates: Map<string, DeviceState>;
  
  // Controlling state
  controllingDevices: Set<string>;
  
  // Actions
  setAvailableDevices: (devices: TPLinkDevice[]) => void;
  setLoadingDevices: (loading: boolean) => void;
  setDeviceError: (error: string | null) => void;
  
  setDeviceState: (deviceId: string, isOn: boolean) => void;
  setControlling: (deviceId: string, controlling: boolean) => void;
  
  // Device control
  turnOn: (deviceId: string) => Promise<void>;
  turnOff: (deviceId: string) => Promise<void>;
  toggle: (deviceId: string) => Promise<void>;
  blackout: () => Promise<void>;
  
  // Fetch devices
  fetchDevices: () => Promise<void>;
  
  // Helpers
  getDeviceState: (deviceId: string) => boolean;
  isDeviceControlling: (deviceId: string) => boolean;
}

export const useDeviceStore = create<DeviceStoreState>((set, get) => ({
  availableDevices: [],
  isLoadingDevices: false,
  deviceError: null,
  deviceStates: new Map(),
  controllingDevices: new Set(),
  
  setAvailableDevices: (devices) => set({ availableDevices: devices }),
  setLoadingDevices: (loading) => set({ isLoadingDevices: loading }),
  setDeviceError: (error) => set({ deviceError: error }),
  
  setDeviceState: (deviceId, isOn) => set((state) => {
    const newStates = new Map(state.deviceStates);
    newStates.set(deviceId, { deviceId, isOn, lastUpdated: Date.now() });
    return { deviceStates: newStates };
  }),
  
  setControlling: (deviceId, controlling) => set((state) => {
    const newSet = new Set(state.controllingDevices);
    if (controlling) {
      newSet.add(deviceId);
    } else {
      newSet.delete(deviceId);
    }
    return { controllingDevices: newSet };
  }),
  
  fetchDevices: async () => {
    const credentials = getCredentials();
    if (!credentials) {
      set({ deviceError: 'Not logged in', isLoadingDevices: false });
      return;
    }
    
    set({ isLoadingDevices: true, deviceError: null });
    try {
      const params = new URLSearchParams({
        email: credentials.email,
        password: credentials.password,
      });
      
      const response = await fetch(`/api/devices?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch devices');
      }
      
      set({ availableDevices: data.devices || [], isLoadingDevices: false });
    } catch (error) {
      set({ 
        deviceError: error instanceof Error ? error.message : 'Failed to fetch devices',
        isLoadingDevices: false 
      });
    }
  },
  
  turnOn: async (deviceId) => {
    const credentials = getCredentials();
    if (!credentials) {
      throw new Error('Not logged in');
    }
    
    const { setControlling, setDeviceState } = get();
    setControlling(deviceId, true);
    
    try {
      const response = await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deviceId, 
          action: 'on',
          email: credentials.email,
          password: credentials.password,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to turn on device');
      }
      
      setDeviceState(deviceId, true);
    } catch (error) {
      console.error('Failed to turn on device:', error);
      throw error;
    } finally {
      setControlling(deviceId, false);
    }
  },
  
  turnOff: async (deviceId) => {
    const credentials = getCredentials();
    if (!credentials) {
      throw new Error('Not logged in');
    }
    
    const { setControlling, setDeviceState } = get();
    setControlling(deviceId, true);
    
    try {
      const response = await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deviceId, 
          action: 'off',
          email: credentials.email,
          password: credentials.password,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to turn off device');
      }
      
      setDeviceState(deviceId, false);
    } catch (error) {
      console.error('Failed to turn off device:', error);
      throw error;
    } finally {
      setControlling(deviceId, false);
    }
  },
  
  toggle: async (deviceId) => {
    const { getDeviceState, turnOn, turnOff } = get();
    const currentState = getDeviceState(deviceId);
    
    if (currentState) {
      await turnOff(deviceId);
    } else {
      await turnOn(deviceId);
    }
  },
  
  blackout: async () => {
    const { availableDevices, turnOff } = get();
    
    // Turn off all devices in parallel
    const promises = availableDevices.map(device => 
      turnOff(device.deviceId).catch(err => {
        console.error(`Failed to turn off ${device.alias}:`, err);
      })
    );
    
    await Promise.all(promises);
  },
  
  getDeviceState: (deviceId) => {
    const state = get().deviceStates.get(deviceId);
    return state?.isOn ?? false;
  },
  
  isDeviceControlling: (deviceId) => {
    return get().controllingDevices.has(deviceId);
  },
}));
