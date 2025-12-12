import { NextRequest, NextResponse } from 'next/server';
import { login } from 'tplink-cloud-api';

// GET /api/devices - List devices using stored credentials (from query params)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const password = searchParams.get('password');

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Credentials required. Please log in.' },
        { status: 401 }
      );
    }

    const tplink = await login(email, password);
    const deviceList = await tplink.getDeviceList();

    return NextResponse.json({ devices: deviceList });
  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch devices', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/devices - Test credentials and list devices
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const tplink = await login(email, password);
    const deviceList = await tplink.getDeviceList();

    return NextResponse.json({ devices: deviceList });
  } catch (error) {
    console.error('Error connecting to TP-Link:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for common auth errors
    if (message.includes('credentials') || message.includes('password') || message.includes('email')) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to connect to TP-Link', details: message },
      { status: 500 }
    );
  }
}
