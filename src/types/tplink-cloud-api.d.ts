declare module 'tplink-cloud-api' {
  interface Device {
    deviceId: string;
    alias: string;
    deviceType: string;
    status?: number;
    deviceModel?: string;
    appServerUrl?: string;
    deviceMac?: string;
    role?: number;
    fwVer?: string;
    hwVer?: string;
  }

  interface DeviceController {
    powerOn(): Promise<void>;
    powerOff(): Promise<void>;
    toggle(): Promise<void>;
    getInfo(): Promise<Record<string, unknown>>;
    getStatus(): Promise<number>;
  }

  interface TPLink {
    getDeviceList(): Promise<Device[]>;
    getHS100(deviceId: string): DeviceController;
    getHS110(deviceId: string): DeviceController;
    getHS200(deviceId: string): DeviceController;
    getHS300(deviceId: string): DeviceController;
    getLB100(deviceId: string): DeviceController;
    getLB110(deviceId: string): DeviceController;
    getLB120(deviceId: string): DeviceController;
    getLB130(deviceId: string): DeviceController;
    getKL60(deviceId: string): DeviceController;
    getKL110(deviceId: string): DeviceController;
    getKL120(deviceId: string): DeviceController;
    getKL130(deviceId: string): DeviceController;
  }

  export function login(email: string, password: string, termId?: string): Promise<TPLink>;
}





