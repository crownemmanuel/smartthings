import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/device-groups - Create a new device group
export async function POST(request: NextRequest) {
  try {
    const { scene_id, name, color, order_index } = await request.json();

    if (!scene_id || !name) {
      return NextResponse.json({ error: 'scene_id and name are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('device_groups')
      .insert({ 
        scene_id, 
        name, 
        color: color || '#10b981',
        order_index: order_index ?? 0 
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ device_group: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create device group' },
      { status: 500 }
    );
  }
}

// PUT /api/device-groups - Update a device group
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('device_groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ device_group: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update device group' },
      { status: 500 }
    );
  }
}

// DELETE /api/device-groups - Delete a device group
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('device_groups')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete device group' },
      { status: 500 }
    );
  }
}

