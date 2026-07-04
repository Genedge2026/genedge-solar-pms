import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';

// ── DPR Records ──────────────────────────────────────────────
export function useDPRs(siteFilter = 'all') {
  const { profile } = useAuth();
  const [dprs, setDprs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('dprs')
      .select('*')
      .order('date', { ascending: false });

    // Site users only see their own site
    if (profile?.role === 'site') {
      query = query.eq('site', profile.site);
    } else if (siteFilter !== 'all') {
      query = query.eq('site', siteFilter);
    }

    const { data, error } = await query;
    if (error) setError(error.message);
    else setDprs(data || []);
    setLoading(false);
  }, [profile, siteFilter]);

  useEffect(() => { if (profile) fetch(); }, [fetch, profile]);

  return { dprs, loading, error, refresh: fetch };
}

// ── Latest DPR per site (for dashboard) ─────────────────────
export function useLatestDPRs() {
  const [latest, setLatest] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('dprs')
        .select('*')
        .order('date', { ascending: false });

      if (data) {
        const map = {};
        data.forEach(d => { if (!map[d.site]) map[d.site] = d; });
        setLatest(map);
      }
      setLoading(false);
    }
    fetch();
  }, []);

  return { latest, loading };
}

// ── Inventory ────────────────────────────────────────────────
export function useInventory(siteFilter = 'all') {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('inventory').select('*').order('site');
    if (siteFilter !== 'all') query = query.eq('site', siteFilter);
    const { data } = await query;
    setItems(data || []);
    setLoading(false);
  }, [siteFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  async function addItem(item) {
    const { error } = await supabase.from('inventory').insert([item]);
    if (!error) fetch();
    return error;
  }

  async function updateItem(id, updates) {
    const { error } = await supabase.from('inventory').update(updates).eq('id', id);
    if (!error) fetch();
    return error;
  }

  async function deleteItem(id) {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (!error) fetch();
    return error;
  }

  return { items, loading, addItem, updateItem, deleteItem, refresh: fetch };
}

// ── Issues extracted from DPRs ───────────────────────────────
export function useIssues(siteFilter = 'all') {
  const { profile } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      let query = supabase
        .from('dprs')
        .select('id, date, site, issues, action_from, priority')
        .not('issues', 'is', null)
        .neq('issues', '')
        .order('date', { ascending: false });

      if (profile?.role === 'site') query = query.eq('site', profile.site);
      else if (siteFilter !== 'all') query = query.eq('site', siteFilter);

      const { data } = await query;
      setIssues(data || []);
      setLoading(false);
    }
    if (profile) fetch();
  }, [profile, siteFilter]);

  return { issues, loading };
}
