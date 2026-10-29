import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase.js';

// 로그인한 사용자의 "보관함" 목록과 추가/삭제 (RLS 덕분에 내 것만 보여요)
export function useFavorites(user) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user || !supabase) { setItems([]); return; }
    setLoading(true); setError('');
    const { data, error } = await supabase.from('favorites').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message); else setItems(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const ids = useMemo(() => new Set(items.map((i) => Number(i.pixabay_id))), [items]);

  const add = async (img) => {
    const row = { user_id: user.id, pixabay_id: img.id, image_url: img.thumb, large_url: img.large, tags: img.tags, page_url: img.pageURL };
    const { data, error } = await supabase.from('favorites').insert(row).select().single();
    if (error) throw error;
    setItems((p) => [data, ...p]);
  };

  const remove = async (pixabayId) => {
    const { error } = await supabase.from('favorites').delete().eq('pixabay_id', pixabayId);
    if (error) throw error;
    setItems((p) => p.filter((i) => Number(i.pixabay_id) !== Number(pixabayId)));
  };

  return { items, ids, loading, error, add, remove, reload: load };
}
