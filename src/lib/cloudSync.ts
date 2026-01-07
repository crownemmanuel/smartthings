import { supabase, isSupabaseConfigured } from './supabase';
import type { FullShow } from '@/types';

export interface CloudShow {
  id: string;
  name: string;
  data: FullShow;
  created_at: string;
  updated_at: string;
}

// Check if cloud sync is available
export function isCloudAvailable(): boolean {
  return isSupabaseConfigured();
}

// List all shows from cloud
export async function listCloudShows(): Promise<CloudShow[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('cloud_shows')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

// Save show to cloud
export async function saveToCloud(show: FullShow, cloudName?: string): Promise<CloudShow> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const cloudShow = {
    name: cloudName || show.name,
    data: show,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('cloud_shows')
    .upsert(cloudShow, { onConflict: 'name' })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Load show from cloud
export async function loadFromCloud(cloudShowId: string): Promise<FullShow> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('cloud_shows')
    .select('data')
    .eq('id', cloudShowId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.data as FullShow;
}

// Delete show from cloud
export async function deleteFromCloud(cloudShowId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('cloud_shows')
    .delete()
    .eq('id', cloudShowId);

  if (error) {
    throw new Error(error.message);
  }
}





