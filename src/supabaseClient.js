import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfxsnboewskovzuallak.supabase.co'; 

const supabaseKey = 'sb_publishable_9z76DVq4m3QZMXzXXUJnSw_H2iI6U4U';

export const supabase = createClient(supabaseUrl, supabaseKey);