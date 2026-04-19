import { createClient } from '@supabase/supabase-js';
import { Activity, Agency, CompanyProfile, COUNTRIES, MaterialFile } from '../types';

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
    execution: activity.execution,
    activityNotes: activity.activityNotes,
    production: activity.production,
    pricing: activity.pricing,
    originalText: activity.originalText,
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
    execution: data.execution || '',
    activityNotes: data.activityNotes || '',
    production: data.production || '',
    pricing: data.pricing || '',
    originalText: data.originalText || null,
    images: data.images || [],
    links: data.links || [],
    materials,
    costs: data.costs || [],
    contact: data.contact || { company: '', country: '', address: '', city: '', zip: '', website: '', phone: '', whatsapp: '', email: '', notes: '' },
    youtubeUrl: data.youtubeUrl || '',
    videoUrl: data.videoUrl || '',
    tags: data.tags || [],
    duration,
    durationMinutes: data.durationMinutes || parseDurationMinutes(duration),
    groupSize: data.groupSize || '',
    difficulty: data.difficulty || 'medium',
    location: data.location || 'begge',
    author: data.author || 'Unknown',
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
    return { success: false, error: 'Unexpected error' };
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
    return { success: false, error: 'Unexpected error' };
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

// --- Company Profiles ---

function companyToRow(company: Omit<CompanyProfile, 'id' | 'createdAt'>) {
  const payload = {
    country: company.country,
    address: company.address,
    city: company.city,
    zip: company.zip,
    website: company.website,
    phone: company.phone,
    whatsapp: company.whatsapp,
    email: company.email,
    notes: company.notes,
    gameOwner: company.gameOwner,
  };
  return {
    title: company.company,
    description: JSON.stringify(payload),
    assigned_to: IDEA_EMPLOYEE_ID,
    priority: 'Normal',
    category: 'idea-company',
    resolved: false,
    is_error: false,
  };
}

function rowToCompany(row: TodoRow): CompanyProfile {
  let data: any = {};
  try {
    data = JSON.parse(row.description || '{}');
  } catch {
    data = {};
  }
  return {
    id: row.id,
    company: row.title,
    country: data.country || '',
    address: data.address || '',
    city: data.city || '',
    zip: data.zip || '',
    website: data.website || '',
    phone: data.phone || '',
    whatsapp: data.whatsapp || '',
    email: data.email || '',
    notes: data.notes || '',
    gameOwner: data.gameOwner || '',
    createdAt: row.created_at,
  };
}

export async function fetchCompanies(): Promise<CompanyProfile[]> {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('category', 'idea-company')
      .order('title', { ascending: true });

    if (error || !data) return [];
    return (data as TodoRow[]).map(rowToCompany);
  } catch {
    return [];
  }
}

export async function createCompany(
  company: Omit<CompanyProfile, 'id' | 'createdAt'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const row = companyToRow(company);
    const { error } = await supabase.from('todos').insert(row);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: 'Unexpected error' };
  }
}

export async function updateCompany(
  id: string,
  company: Omit<CompanyProfile, 'id' | 'createdAt'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const row = companyToRow(company);
    const { error } = await supabase.from('todos').update(row).eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: 'Unexpected error' };
  }
}

export async function deleteCompany(id: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    return { success: !error };
  } catch {
    return { success: false };
  }
}

// --- Agencies ---

function agencyToRow(agency: Omit<Agency, 'id' | 'createdAt'>) {
  const payload = {
    logo: agency.logo,
    website: agency.website,
    country: agency.country,
    city: agency.city,
    address: agency.address,
    contactName: agency.contactName,
    contactEmail: agency.contactEmail,
    contactPhone: agency.contactPhone,
    services: agency.services,
    tags: agency.tags,
    notes: agency.notes,
  };
  return {
    title: agency.name,
    description: JSON.stringify(payload),
    assigned_to: IDEA_EMPLOYEE_ID,
    priority: 'Normal',
    category: 'idea-agency',
    resolved: false,
    is_error: false,
  };
}

function rowToAgency(row: TodoRow): Agency {
  let data: any = {};
  try {
    data = JSON.parse(row.description || '{}');
  } catch {
    data = {};
  }
  return {
    id: row.id,
    name: row.title,
    logo: data.logo || '',
    website: data.website || '',
    country: data.country || '',
    city: data.city || '',
    address: data.address || '',
    contactName: data.contactName || '',
    contactEmail: data.contactEmail || '',
    contactPhone: data.contactPhone || '',
    services: Array.isArray(data.services) ? data.services : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    notes: data.notes || '',
    createdAt: row.created_at,
  };
}

export async function fetchAgencies(): Promise<Agency[]> {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('category', 'idea-agency')
      .order('title', { ascending: true });

    if (error || !data) return [];
    return (data as TodoRow[]).map(rowToAgency);
  } catch {
    return [];
  }
}

export async function createAgency(
  agency: Omit<Agency, 'id' | 'createdAt'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const row = agencyToRow(agency);
    const { error } = await supabase.from('todos').insert(row);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: 'Unexpected error' };
  }
}

export async function updateAgency(
  id: string,
  agency: Omit<Agency, 'id' | 'createdAt'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const row = agencyToRow(agency);
    const { error } = await supabase.from('todos').update(row).eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: 'Unexpected error' };
  }
}

export async function deleteAgency(id: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    return { success: !error };
  } catch {
    return { success: false };
  }
}

// --- Import from MEET (meet_companies table on shared Supabase) ---
//
// MEET (meet.eventday.dk) stores its company directory in `meet_companies`
// on the same Supabase instance. Country is a full English name there; we
// map it to the ISO codes used elsewhere in this app.

interface MeetParticipant {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
}

interface MeetCompanyRow {
  id: string;
  company_name: string;
  logo_url: string | null;
  website: string | null;
  country: string | null;
  city: string | null;
  street_address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  specialties: string[] | null;
  short_description: string | null;
  full_description: string | null;
  notes: string | null;
  participants: MeetParticipant[] | null;
  is_published: boolean;
}

// Map MEET's full country name (e.g. "Denmark") to IDEAS' ISO code ("DK").
function countryNameToCode(name: string | null): string {
  if (!name) return '';
  const target = name.trim().toLowerCase();
  for (const [code, { label }] of Object.entries(COUNTRIES)) {
    if (code && label.toLowerCase() === target) return code;
  }
  return '';
}

function meetCompanyToAgencyDraft(row: MeetCompanyRow): Omit<Agency, 'id' | 'createdAt'> {
  const primaryParticipant = row.participants?.[0];
  const notesParts = [row.short_description, row.full_description, row.notes]
    .filter((s): s is string => Boolean(s && s.trim()))
    .map((s) => s.trim());

  return {
    name: row.company_name,
    logo: row.logo_url || '',
    website: row.website || '',
    country: countryNameToCode(row.country),
    city: row.city || '',
    address: row.street_address || '',
    contactName: primaryParticipant?.name || '',
    contactEmail: row.contact_email || primaryParticipant?.email || '',
    contactPhone: row.contact_phone || primaryParticipant?.phone || '',
    services: Array.isArray(row.specialties) ? row.specialties : [],
    tags: [],
    notes: notesParts.join('\n\n'),
  };
}

export async function fetchMeetCompanies(): Promise<MeetCompanyRow[]> {
  try {
    const { data, error } = await supabase
      .from('meet_companies')
      .select(
        'id, company_name, logo_url, website, country, city, street_address, contact_email, contact_phone, specialties, short_description, full_description, notes, participants, is_published',
      )
      .eq('is_published', true)
      .order('company_name');

    if (error || !data) return [];
    return data as MeetCompanyRow[];
  } catch {
    return [];
  }
}

export interface MeetImportResult {
  created: number;
  skipped: number;
  failed: number;
  total: number;
}

export async function importAgenciesFromMeet(): Promise<MeetImportResult> {
  const meetRows = await fetchMeetCompanies();
  const existing = await fetchAgencies();
  const existingNames = new Set(existing.map((a) => a.name.trim().toLowerCase()));

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of meetRows) {
    const draft = meetCompanyToAgencyDraft(row);
    if (!draft.name.trim()) {
      failed++;
      continue;
    }
    if (existingNames.has(draft.name.trim().toLowerCase())) {
      skipped++;
      continue;
    }
    const result = await createAgency(draft);
    if (result.success) {
      created++;
      existingNames.add(draft.name.trim().toLowerCase());
    } else {
      failed++;
    }
  }

  return { created, skipped, failed, total: meetRows.length };
}
