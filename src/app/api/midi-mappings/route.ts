import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/midi-mappings - Create a new MIDI mapping
export async function POST(request: NextRequest) {
  try {
    const { show_id, midi_note, midi_channel, action_type, target_id } = await request.json();

    if (!show_id || midi_note === undefined || !action_type) {
      return NextResponse.json(
        { error: 'show_id, midi_note, and action_type are required' }, 
        { status: 400 }
      );
    }

    const validActions = [
      'device_group_on', 
      'device_group_off', 
      'device_group_toggle', 
      'sequence_play', 
      'scene_activate', 
      'blackout'
    ];

    if (!validActions.includes(action_type)) {
      return NextResponse.json({ error: 'Invalid action_type' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('midi_mappings')
      .insert({ 
        show_id, 
        midi_note, 
        midi_channel: midi_channel ?? 0,
        action_type,
        target_id: target_id || null
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ mapping: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create MIDI mapping' },
      { status: 500 }
    );
  }
}

// PUT /api/midi-mappings - Update a MIDI mapping
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('midi_mappings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ mapping: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update MIDI mapping' },
      { status: 500 }
    );
  }
}

// DELETE /api/midi-mappings - Delete a MIDI mapping
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('midi_mappings')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete MIDI mapping' },
      { status: 500 }
    );
  }
}


