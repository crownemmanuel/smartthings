import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/step-actions - Create a new action
export async function POST(request: NextRequest) {
  try {
    const { step_id, device_group_id, device_id, device_name, action } = await request.json();

    if (!step_id || !action) {
      return NextResponse.json({ error: 'step_id and action are required' }, { status: 400 });
    }

    if (!['on', 'off'].includes(action)) {
      return NextResponse.json({ error: 'action must be "on" or "off"' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('step_actions')
      .insert({ 
        step_id, 
        device_group_id: device_group_id || null,
        device_id: device_id || null,
        device_name: device_name || null,
        action 
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ action: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create action' },
      { status: 500 }
    );
  }
}

// DELETE /api/step-actions - Delete an action
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('step_actions')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete action' },
      { status: 500 }
    );
  }
}


