import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ilbjytyukicbssqftmma.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsYmp5dHl1a2ljYnNzcWZ0bW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MzA0NjEsImV4cCI6MjA3MDQwNjQ2MX0.I_PWByMPcOYhWgeq9MxXgOo-NCZYfEuzYmo35XnBFAY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MARIA_EMPLOYEE_ID = 'emp_z4ftvagjq';

export interface IdeaTodo {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  created_at: string;
  resolved: boolean;
  priority: string | null;
  category: string | null;
}

export const fetchIdeas = async (): Promise<IdeaTodo[]> => {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('id, title, description, assigned_to, created_at, resolved, priority, category')
      .eq('category', 'IDEER')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as IdeaTodo[];
  } catch (err) {
    console.error('fetchIdeas exception:', err);
    return [];
  }
};

export const submitIdea = async (
  ideaText: string,
  authorName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const now = new Date();
    const dateStr = now.toLocaleDateString('da-DK', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const { error } = await supabase
      .from('todos')
      .insert({
        title: `💡 IDÉBOKS: ${ideaText.substring(0, 80)}${ideaText.length > 80 ? '...' : ''}`,
        description: `<p><strong>Idé:</strong> ${ideaText}</p><p><strong>Fra:</strong> ${authorName}</p><p><strong>Dato:</strong> ${dateStr}</p>`,
        assigned_to: MARIA_EMPLOYEE_ID,
        priority: 'Normal',
        category: 'IDEER',
        resolved: false,
        is_error: false,
      });

    if (error) {
      console.error('submitIdea error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('submitIdea exception:', err);
    return { success: false, error: 'Uventet fejl' };
  }
};
