-- Stage Show Control App Schema
-- Run this in your Supabase SQL editor to set up the database

-- ============================================
-- SIMPLE CLOUD SYNC TABLE (Recommended)
-- ============================================
-- This stores entire shows as JSON for easy backup/sync

CREATE TABLE IF NOT EXISTS cloud_shows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cloud_shows_name ON cloud_shows(name);
CREATE INDEX IF NOT EXISTS idx_cloud_shows_updated ON cloud_shows(updated_at DESC);

-- ============================================
-- NORMALIZED TABLES (Optional - for advanced use)
-- ============================================

-- Shows table (top-level container)
CREATE TABLE IF NOT EXISTS shows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scenes table (belong to a show)
CREATE TABLE IF NOT EXISTS scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device groups table (belong to a scene)
CREATE TABLE IF NOT EXISTS device_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#10b981',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device group items (devices in a group with on/off state)
CREATE TABLE IF NOT EXISTS device_group_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_group_id UUID NOT NULL REFERENCES device_groups(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_name TEXT NOT NULL,
    device_type TEXT,
    turn_on BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sequences table (timed sequences of actions)
CREATE TABLE IF NOT EXISTS sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sequence steps (individual steps with timing)
CREATE TABLE IF NOT EXISTS sequence_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
    delay_ms INTEGER NOT NULL DEFAULT 0,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step actions (what happens in each step)
CREATE TABLE IF NOT EXISTS step_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id UUID NOT NULL REFERENCES sequence_steps(id) ON DELETE CASCADE,
    device_group_id UUID REFERENCES device_groups(id) ON DELETE CASCADE,
    device_id TEXT,
    device_name TEXT,
    action TEXT NOT NULL CHECK (action IN ('on', 'off')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MIDI mappings (map MIDI notes to actions)
CREATE TABLE IF NOT EXISTS midi_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    midi_note INTEGER NOT NULL,
    midi_channel INTEGER NOT NULL DEFAULT 0,
    action_type TEXT NOT NULL CHECK (action_type IN ('device_group_on', 'device_group_off', 'device_group_toggle', 'sequence_play', 'scene_activate', 'blackout')),
    target_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scenes_show_id ON scenes(show_id);
CREATE INDEX IF NOT EXISTS idx_device_groups_scene_id ON device_groups(scene_id);
CREATE INDEX IF NOT EXISTS idx_device_group_items_group_id ON device_group_items(device_group_id);
CREATE INDEX IF NOT EXISTS idx_sequences_show_id ON sequences(show_id);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_sequence_id ON sequence_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_step_actions_step_id ON step_actions(step_id);
CREATE INDEX IF NOT EXISTS idx_midi_mappings_show_id ON midi_mappings(show_id);

-- Enable Row Level Security (optional - enable if you want user-based access)
-- ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE device_groups ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE device_group_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE step_actions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE midi_mappings ENABLE ROW LEVEL SECURITY;
