import { createClient } from '@supabase/supabase-js';

// Cópiala EXACTAMENTE de la pantalla "Data API" de Supabase
// Debe empezar con https:// y terminar en .supabase.co
const supabaseUrl = 'https://tfxsnboewskovzuallak.supabase.co'; 

const supabaseKey = 'sb_publishable_9z76DVq4m3QZMXzXXUJnSw_H2iI6U4U';

export const supabase = createClient(supabaseUrl, supabaseKey);