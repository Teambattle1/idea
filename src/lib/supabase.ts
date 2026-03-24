import { createClient } from '@supabase/supabase-js';
import { Activity, IdeaList } from '../types';

const supabaseUrl = 'https://ilbjytyukicbssqftmma.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsYmp5dHl1a2ljYnNzcWZ0bW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MzA0NjEsImV4cCI6MjA3MDQwNjQ2MX0.I_PWByMPcOYhWgeq9MxXgOo-NCZYfEuzYmo35XnBFAY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MARIA_EMPLOYEE_ID = 'emp_z4ftvagjq';

interface TodoRow {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  created_at: string;
  resolved: boolean;
  priority: string | null;
  category: string | null;
}

// --- Activities ---

function activityToRow(activity: Omit<Activity, 'id' | 'createdAt' | 'archived'>) {
  const payload = {
    shortDescription: activity.shortDescription,
    longDescription: activity.longDescription,
    images: activity.images,
    links: activity.links,
    materials: activity.materials,
    youtubeUrl: activity.youtubeUrl,
    videoUrl: activity.videoUrl,
    tags: activity.tags,
    duration: activity.duration,
    groupSize: activity.groupSize,
    difficulty: activity.difficulty,
    location: activity.location,
    author: activity.author,
  };
  return {
    title: activity.title,
    description: JSON.stringify(payload),
    assigned_to: MARIA_EMPLOYEE_ID,
    priority: activity.difficulty,
    category: 'TEAMBUILDING',
    resolved: false,
    is_error: false,
  };
}

function rowToActivity(row: TodoRow): Activity {
  let data: any = {};
  try {
    data = JSON.parse(row.description || '{}');
  } catch {
    data = {};
  }
  return {
    id: row.id,
    title: row.title,
    shortDescription: data.shortDescription || '',
    longDescription: data.longDescription || '',
    images: data.images || [],
    links: data.links || [],
    materials: data.materials || [],
    youtubeUrl: data.youtubeUrl || '',
    videoUrl: data.videoUrl || '',
    tags: data.tags || [],
    duration: data.duration || '',
    groupSize: data.groupSize || '',
    difficulty: data.difficulty || 'medium',
    location: data.location || 'begge',
    author: data.author || 'Ukendt',
    createdAt: row.created_at,
    archived: row.resolved,
  };
}

export async function fetchActivities(): Promise<Activity[]> {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('category', 'TEAMBUILDING')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return (data as TodoRow[]).map(rowToActivity);
  } catch (err) {
    console.error('fetchActivities error:', err);
    return [];
  }
}

export async function fetchActivity(id: string): Promise<Activity | null> {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return rowToActivity(data as TodoRow);
  } catch {
    return null;
  }
}

export async function createActivity(
  activity: Omit<Activity, 'id' | 'createdAt' | 'archived'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const row = activityToRow(activity);
    const { error } = await supabase.from('todos').insert(row);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: 'Uventet fejl' };
  }
}

export async function updateActivity(
  id: string,
  activity: Omit<Activity, 'id' | 'createdAt' | 'archived'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const row = activityToRow(activity);
    const { error } = await supabase
      .from('todos')
      .update(row)
      .eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: 'Uventet fejl' };
  }
}

export async function deleteActivity(id: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    return { success: !error };
  } catch {
    return { success: false };
  }
}

// --- Idea Lists ---

function ideaListToRow(list: Omit<IdeaList, 'id' | 'createdAt' | 'archived'>) {
  const payload = {
    description: list.description,
    activityIds: list.activityIds,
    author: list.author,
  };
  return {
    title: list.title,
    description: JSON.stringify(payload),
    assigned_to: MARIA_EMPLOYEE_ID,
    priority: 'Normal',
    category: 'IDEA_LIST',
    resolved: false,
    is_error: false,
  };
}

function rowToIdeaList(row: TodoRow): IdeaList {
  let data: any = {};
  try {
    data = JSON.parse(row.description || '{}');
  } catch {
    data = {};
  }
  return {
    id: row.id,
    title: row.title,
    description: data.description || '',
    activityIds: data.activityIds || [],
    author: data.author || 'Ukendt',
    createdAt: row.created_at,
    archived: row.resolved,
  };
}

export async function fetchIdeaLists(): Promise<IdeaList[]> {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('category', 'IDEA_LIST')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return (data as TodoRow[]).map(rowToIdeaList);
  } catch {
    return [];
  }
}

export async function fetchIdeaList(id: string): Promise<IdeaList | null> {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return rowToIdeaList(data as TodoRow);
  } catch {
    return null;
  }
}

export async function createIdeaList(
  list: Omit<IdeaList, 'id' | 'createdAt' | 'archived'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const row = ideaListToRow(list);
    const { error } = await supabase.from('todos').insert(row);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: 'Uventet fejl' };
  }
}

export async function updateIdeaList(
  id: string,
  list: Omit<IdeaList, 'id' | 'createdAt' | 'archived'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const row = ideaListToRow(list);
    const { error } = await supabase
      .from('todos')
      .update(row)
      .eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: 'Uventet fejl' };
  }
}

export async function deleteIdeaList(id: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    return { success: !error };
  } catch {
    return { success: false };
  }
}
