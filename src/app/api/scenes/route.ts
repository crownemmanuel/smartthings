import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/scenes - Create a new scene
export async function POST(request: NextRequest) {
  try {
    const { show_id, name, color, order_index } = await request.json();

    if (!show_id || !name) {
      return NextResponse.json({ error: 'show_id and name are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('scenes')
      .insert({ 
        show_id, 
        name, 
        color: color || '#3b82f6',
        order_index: order_index ?? 0 
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ scene: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create scene' },
      { status: 500 }
    );
  }
}

// PUT /api/scenes - Update a scene
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('scenes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ scene: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update scene' },
      { status: 500 }
    );
  }
}

// DELETE /api/scenes - Delete a scene
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('scenes')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete scene' },
      { status: 500 }
    );
  }
}


