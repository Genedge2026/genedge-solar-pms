import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Junagadh Cluster site configuration
export const SITES = {
  'Devkigalol': { capacity: 2.0, modules: 3636, inverters: 4, location: 'Junagadh, Gujarat' },
  'Kanja':      { capacity: 1.5, modules: 2727, inverters: 3, location: 'Junagadh, Gujarat' },
  'Mendapara':  { capacity: 2.5, modules: 4545, inverters: 5, location: 'Junagadh, Gujarat' },
  'Mandodara':  { capacity: 1.8, modules: 3272, inverters: 4, location: 'Junagadh, Gujarat' },
};

export const SITE_NAMES = Object.keys(SITES);

export const CLUSTER_CAPACITY = Object.values(SITES).reduce((a, s) => a + s.capacity, 0);
