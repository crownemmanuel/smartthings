import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/device-group-items - Add device to group
export async function POST(request: NextRequest) {
  try {
    const { device_group_id, device_id, device_name, device_type, turn_on } = await request.json();

    if (!device_group_id || !device_id || !device_name) {
      return NextResponse.json(
        { error: 'device_group_id, device_id, and device_name are required' }, 
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('device_group_items')
      .insert({ 
        device_group_id, 
        device_id, 
        device_name,
        device_type: device_type || null,
        turn_on: turn_on ?? true
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add device to group' },
      { status: 500 }
    );
  }
}

// PUT /api/device-group-items - Update a device item
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('device_group_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update device item' },
      { status: 500 }
    );
  }
}

// DELETE /api/device-group-items - Remove device from group
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('device_group_items')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove device from group' },
      { status: 500 }
    );
  }
}

