# Stage Control - Live Show Lighting

A professional stage show control application for managing TP-Link smart devices with scenes, sequences, and MIDI integration. Built with Next.js, Supabase, and the `tplink-cloud-api` library.

## Features

- 🎭 **Scenes** - Organize your show into scenes, each with its own device groups
- 💡 **Device Groups** - Group devices together for quick control
- ⏱️ **Sequences** - Create timed sequences of light actions with customizable delays
- 🎹 **MIDI Integration** - Map MIDI notes to actions for hands-free control
- 🌙 **Blackout** - One-click emergency all-off button
- 📱 **Edit/Show Modes** - Edit mode for setup, Show mode for performance
- ⌨️ **Keyboard Shortcuts** - Number keys (1-9) for scene switching, Spacebar for blackout
- 🔄 **Offline-Ready** - All data loaded at startup for zero-latency performance during shows

## Prerequisites

- Node.js 18+ installed
- A TP-Link / Kasa account with registered devices
- (Optional) A Supabase project for cloud backup

## Login

When you first open the app, you'll see a login screen. Enter your **TP-Link / Kasa** credentials:
- The same email and password you use in the Kasa or TP-Link app
- Credentials are stored locally in your browser (not sent anywhere except TP-Link)
- Click the logout button in the header to switch accounts

## Installation

1. Install dependencies:
```bash
npm install
```

2. (Optional) Set up environment variables for cloud backup - create a `.env.local` file:
```env
# Supabase Configuration (Optional - for cloud backup only)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. (Optional) Set up Supabase for cloud backup:
   - Go to your Supabase project's SQL Editor
   - Run the `cloud_shows` table creation from `supabase/schema.sql`

**Note**: TP-Link credentials are entered via the login screen - no `.env.local` required for basic use!

## Data Storage

**All show data is stored locally in your browser's localStorage** - no database required for basic use!

- ✅ Works offline during shows
- ✅ No latency from database calls
- ✅ Automatic save on every change
- ✅ Export/import shows as JSON files
- ✅ Optional cloud backup to Supabase

## Running the App

### Development
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the Stage Control app.

### Production
```bash
npm run build
npm start
```

## Usage Guide

### Getting Started
1. Create a new show using the "+" button in the header
2. Select your show from the dropdown
3. Add scenes to organize your lighting cues

### Creating Scenes
1. Switch to **Edit Mode**
2. Click "Add Scene" in the sidebar
3. Name your scene and choose a color
4. Add device groups to the scene

### Device Groups
1. Click "Add Group" in the main panel
2. Name your group (e.g., "Front Lights")
3. Select devices from your TP-Link account
4. Use ON/OFF buttons to control the entire group

### Sequences
1. Create a sequence with the "Add Sequence" button
2. Add steps with delays (in milliseconds)
3. Add device actions (ON/OFF) to each step
4. Click PLAY to run the sequence

### MIDI Control
1. Open Settings (gear icon)
2. Select your MIDI input device
3. Click "Learn New Mapping"
4. Press a key on your MIDI controller
5. Choose the action to trigger
6. Save the mapping

### Show Mode
- Switch to **Show Mode** for performance
- Large touch-friendly buttons
- Keyboard shortcuts enabled:
  - `1-9`: Quick switch to scenes
  - `Spacebar`: Blackout (all devices off)
- MIDI triggers active

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/devices` | GET | List all TP-Link devices |
| `/api/control` | POST | Control a device (on/off) |
| `/api/shows` | GET, POST | List/create shows |
| `/api/shows/[id]` | GET, PUT, DELETE | Manage single show |
| `/api/shows/[id]/full` | GET | Get show with all data |
| `/api/scenes` | POST, PUT, DELETE | Manage scenes |
| `/api/device-groups` | POST, PUT, DELETE | Manage device groups |
| `/api/device-group-items` | POST, PUT, DELETE | Manage group devices |
| `/api/sequences` | POST, PUT, DELETE | Manage sequences |
| `/api/sequence-steps` | POST, PUT, DELETE | Manage sequence steps |
| `/api/step-actions` | POST, DELETE | Manage step actions |
| `/api/midi-mappings` | POST, PUT, DELETE | Manage MIDI mappings |

## Supported Devices

- Smart Plugs: HS100, HS110, HS300
- Smart Switches: HS200
- Smart Bulbs: LB100, LB110, LB120, LB130, KL60, KL110, KL120, KL130

## Export / Import

Click the **↔** button in the header to:
- **Download as JSON** - Save your show as a file
- **Upload JSON** - Import a show from a file
- **Cloud Sync** - Save/load from Supabase (if configured)

## Architecture

- **Frontend**: Next.js 16 with App Router, React 19, Tailwind CSS
- **State Management**: Zustand with localStorage persistence
- **Cloud Backup**: Supabase (optional)
- **MIDI**: Web MIDI API (Chrome, Edge, Opera)
- **Device Control**: tplink-cloud-api

## Troubleshooting

- **"TP-Link credentials not configured"**: Check your `.env.local` file
- **"Failed to fetch devices"**: Verify TP-Link credentials
- **MIDI not working**: Use Chrome, Edge, or Opera (Web MIDI API required)
- **Supabase errors**: Ensure schema is properly set up

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)
- [tplink-cloud-api on npm](https://www.npmjs.com/package/tplink-cloud-api)
