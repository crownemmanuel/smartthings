import { NextRequest, NextResponse } from 'next/server';
import { login } from 'tplink-cloud-api';

export async function POST(request: NextRequest) {
  try {
    const { deviceId, action, email, password } = await request.json();

    if (!deviceId || !['on', 'off'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request. deviceId and action (on/off) are required.' },
        { status: 400 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Credentials required. Please log in.' },
        { status: 401 }
      );
    }

    const tplink = await login(email, password);
    const deviceList = await tplink.getDeviceList();
    
    // Find the device by deviceId
    const device = deviceList.find((d: any) => d.deviceId === deviceId);

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    // Get the device instance based on device type
    let deviceInstance;
    if (device.deviceType === 'HS100' || device.deviceType === 'HS110' || device.deviceType === 'HS300') {
      deviceInstance = tplink.getHS100(deviceId);
    } else if (device.deviceType?.startsWith('LB') || device.deviceType?.startsWith('KL')) {
      deviceInstance = tplink.getLB100(deviceId);
    } else {
      // Try generic method
      deviceInstance = tplink.getHS100(deviceId);
    }

    if (action === 'on') {
      await deviceInstance.powerOn();
    } else {
      await deviceInstance.powerOff();
    }

    return NextResponse.json({ success: true, message: `Device turned ${action}` });
  } catch (error) {
    console.error('Error controlling device:', error);
    return NextResponse.json(
      { error: 'Failed to control device', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
