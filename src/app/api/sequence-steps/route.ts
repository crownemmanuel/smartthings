import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/sequence-steps - Create a new step
export async function POST(request: NextRequest) {
  try {
    const { sequence_id, delay_ms, order_index } = await request.json();

    if (!sequence_id) {
      return NextResponse.json({ error: 'sequence_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('sequence_steps')
      .insert({ 
        sequence_id, 
        delay_ms: delay_ms ?? 0,
        order_index: order_index ?? 0 
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ step: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create step' },
      { status: 500 }
    );
  }
}

// PUT /api/sequence-steps - Update a step
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('sequence_steps')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ step: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update step' },
      { status: 500 }
    );
  }
}

// DELETE /api/sequence-steps - Delete a step
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('sequence_steps')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete step' },
      { status: 500 }
    );
  }
}





