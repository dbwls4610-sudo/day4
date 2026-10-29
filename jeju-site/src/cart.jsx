import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase.js';
import { useAuth } from './auth.jsx';

// 로그인한 사용자의 장바구니 (RLS 덕분에 내 것만 보여요). 사진은 가격 0원으로 담습니다.
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user || !supabase) { setItems([]); return; }
    setLoading(true); setError('');
    const { data, error } = await supabase.from('cart_items').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message); else setItems(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const ids = useMemo(() => new Set(items.map((i) => String(i.item_id))), [items]);
  const count = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items]);
  const total = useMemo(() => items.reduce((n, i) => n + i.price * i.quantity, 0), [items]);

  // 이미 담긴 상품이면 수량만 +1
  const add = async (img) => {
    const itemId = String(img.id);
    const existing = items.find((i) => String(i.item_id) === itemId);
    if (existing) return setQuantity(existing.id, existing.quantity + 1);
    const row = { user_id: user.id, item_id: itemId, name: img.tags || `사진 ${itemId}`, price: 0, quantity: 1, image_url: img.thumb };
    const { data, error } = await supabase.from('cart_items').insert(row).select().single();
    if (error) throw error;
    setItems((p) => [data, ...p]);
  };

  const setQuantity = async (id, quantity) => {
    if (quantity < 1) return remove(id);
    const { data, error } = await supabase.from('cart_items').update({ quantity, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    setItems((p) => p.map((i) => (i.id === id ? data : i)));
  };

  const remove = async (id) => {
    const { error } = await supabase.from('cart_items').delete().eq('id', id);
    if (error) throw error;
    setItems((p) => p.filter((i) => i.id !== id));
  };

  const clear = async () => {
    const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id);
    if (error) throw error;
    setItems([]);
  };

  const value = { items, ids, count, total, loading, error, add, setQuantity, remove, clear, reload: load };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
