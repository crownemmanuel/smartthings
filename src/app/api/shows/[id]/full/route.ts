import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { 
  FullShow, 
  SceneWithGroups, 
  DeviceGroupWithItems, 
  SequenceWithSteps,
  SequenceStepWithActions 
} from '@/types';

// GET /api/shows/[id]/full - Get a show with all related data
// This loads everything at once for offline/cached use during shows
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the show
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select('*')
      .eq('id', id)
      .single();

    if (showError || !show) {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 });
    }

    // Fetch all scenes for this show
    const { data: scenes, error: scenesError } = await supabase
      .from('scenes')
      .select('*')
      .eq('show_id', id)
      .order('order_index');

    if (scenesError) {
      return NextResponse.json({ error: scenesError.message }, { status: 500 });
    }

    // Fetch all device groups for all scenes
    const sceneIds = scenes?.map(s => s.id) || [];
    const { data: deviceGroups, error: groupsError } = await supabase
      .from('device_groups')
      .select('*')
      .in('scene_id', sceneIds.length > 0 ? sceneIds : ['__none__'])
      .order('order_index');

    if (groupsError) {
      return NextResponse.json({ error: groupsError.message }, { status: 500 });
    }

    // Fetch all device group items
    const groupIds = deviceGroups?.map(g => g.id) || [];
    const { data: groupItems, error: itemsError } = await supabase
      .from('device_group_items')
      .select('*')
      .in('device_group_id', groupIds.length > 0 ? groupIds : ['__none__']);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Fetch all sequences for this show
    const { data: sequences, error: seqError } = await supabase
      .from('sequences')
      .select('*')
      .eq('show_id', id);

    if (seqError) {
      return NextResponse.json({ error: seqError.message }, { status: 500 });
    }

    // Fetch all sequence steps
    const sequenceIds = sequences?.map(s => s.id) || [];
    const { data: steps, error: stepsError } = await supabase
      .from('sequence_steps')
      .select('*')
      .in('sequence_id', sequenceIds.length > 0 ? sequenceIds : ['__none__'])
      .order('order_index');

    if (stepsError) {
      return NextResponse.json({ error: stepsError.message }, { status: 500 });
    }

    // Fetch all step actions
    const stepIds = steps?.map(s => s.id) || [];
    const { data: stepActions, error: actionsError } = await supabase
      .from('step_actions')
      .select('*')
      .in('step_id', stepIds.length > 0 ? stepIds : ['__none__']);

    if (actionsError) {
      return NextResponse.json({ error: actionsError.message }, { status: 500 });
    }

    // Fetch all MIDI mappings
    const { data: midiMappings, error: midiError } = await supabase
      .from('midi_mappings')
      .select('*')
      .eq('show_id', id);

    if (midiError) {
      return NextResponse.json({ error: midiError.message }, { status: 500 });
    }

    // Assemble the full show object
    const itemsByGroup = new Map<string, typeof groupItems>();
    groupItems?.forEach(item => {
      const items = itemsByGroup.get(item.device_group_id) || [];
      items.push(item);
      itemsByGroup.set(item.device_group_id, items);
    });

    const groupsByScene = new Map<string, DeviceGroupWithItems[]>();
    deviceGroups?.forEach(group => {
      const groups = groupsByScene.get(group.scene_id) || [];
      groups.push({
        ...group,
        items: itemsByGroup.get(group.id) || []
      });
      groupsByScene.set(group.scene_id, groups);
    });

    const actionsByStep = new Map<string, typeof stepActions>();
    stepActions?.forEach(action => {
      const actions = actionsByStep.get(action.step_id) || [];
      actions.push(action);
      actionsByStep.set(action.step_id, actions);
    });

    const stepsBySequence = new Map<string, SequenceStepWithActions[]>();
    steps?.forEach(step => {
      const seqSteps = stepsBySequence.get(step.sequence_id) || [];
      seqSteps.push({
        ...step,
        actions: (actionsByStep.get(step.id) || []).map(a => ({
          ...a,
          action: a.action as 'on' | 'off'
        }))
      });
      stepsBySequence.set(step.sequence_id, seqSteps);
    });

    const fullShow: FullShow = {
      ...show,
      scenes: (scenes || []).map(scene => ({
        ...scene,
        device_groups: groupsByScene.get(scene.id) || []
      })),
      sequences: (sequences || []).map(seq => ({
        ...seq,
        steps: stepsBySequence.get(seq.id) || []
      })),
      midi_mappings: (midiMappings || []).map(m => ({
        ...m,
        action_type: m.action_type as any
      }))
    };

    return NextResponse.json({ show: fullShow });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch show data' },
      { status: 500 }
    );
  }
}
