import { createClient } from '@supabase/supabase-js';
import { Activity, MaterialFile } from '../types';

const supabaseUrl = 'https://ilbjytyukicbssqftmma.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsYmp5dHl1a2ljYnNzcWZ0bW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MzA0NjEsImV4cCI6MjA3MDQwNjQ2MX0.I_PWByMPcOYhWgeq9MxXgOo-NCZYfEuzYmo35XnBFAY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const IDEA_EMPLOYEE_ID = 'emp_z4ftvagjq';
const STORAGE_BUCKET = 'idea-materials';

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

// --- File Upload ---

export async function uploadFile(file: File): Promise<MaterialFile | null> {
  try {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${timestamp}_${safeName}`;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return {
      name: file.name,
      url: urlData.publicUrl,
      size: file.size,
      type: file.type,
    };
  } catch (err) {
    console.error('Upload error:', err);
    return null;
  }
}

export async function deleteFile(url: string): Promise<void> {
  try {
    const parts = url.split(`/${STORAGE_BUCKET}/`);
    if (parts.length < 2) return;
    const filePath = parts[1];
    await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
  } catch (err) {
    console.error('Delete file error:', err);
  }
}

// --- Activities ---

function parseDurationMinutes(duration: string): number {
  if (!duration) return 0;
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function activityToRow(activity: Omit<Activity, 'id' | 'createdAt' | 'archived'>) {
  const payload = {
    shortDescription: activity.shortDescription,
    longDescription: activity.longDescription,
    images: activity.images,
    links: activity.links,
    materials: activity.materials,
    costs: activity.costs,
    contact: activity.contact,
    youtubeUrl: activity.youtubeUrl,
    videoUrl: activity.videoUrl,
    tags: activity.tags,
    duration: activity.duration,
    durationMinutes: activity.durationMinutes,
    groupSize: activity.groupSize,
    difficulty: activity.difficulty,
    location: activity.location,
    author: activity.author,
  };
  return {
    title: activity.title,
    description: JSON.stringify(payload),
    assigned_to: IDEA_EMPLOYEE_ID,
    priority: activity.difficulty,
    category: 'idea-activity',
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

  // Handle legacy materials (string[] -> MaterialFile[])
  let materials: MaterialFile[] = [];
  if (Array.isArray(data.materials)) {
    materials = data.materials.map((m: any) => {
      if (typeof m === 'string') {
        return { name: m, url: '', size: 0, type: 'text/plain' };
      }
      return m as MaterialFile;
    });
  }

  const duration = data.duration || '';

  return {
    id: row.id,
    title: row.title,
    shortDescription: data.shortDescription || '',
    longDescription: data.longDescription || '',
    images: data.images || [],
    links: data.links || [],
    materials,
    costs: data.costs || [],
    contact: data.contact || { company: '', country: '', phone: '', whatsapp: '', email: '' },
    youtubeUrl: data.youtubeUrl || '',
    videoUrl: data.videoUrl || '',
    tags: data.tags || [],
    duration,
    durationMinutes: data.durationMinutes || parseDurationMinutes(duration),
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
      .eq('category', 'idea-activity')
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
    // First fetch to clean up files
    const activity = await fetchActivity(id);
    if (activity) {
      for (const mat of activity.materials) {
        if (mat.url) await deleteFile(mat.url);
      }
    }

    const { error } = await supabase.from('todos').delete().eq('id', id);
    return { success: !error };
  } catch {
    return { success: false };
  }
}
