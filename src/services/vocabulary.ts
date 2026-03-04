import { supabase } from '@/lib/supabase';

// --- สำหรับ USER ---
// 1. ส่งคำศัพท์ใหม่เข้าส่วนกลาง (รออนุมัติ)
export const suggestNewWord = async (word: string, definition: string, userId: string) => {
  const { error } = await supabase
    .from('global_vocabulary')
    .insert([{ word, definition, suggested_by: userId, status: 'pending' }]);
  if (error) throw error;
};

// 2. ดึงคำศัพท์จากส่วนกลางเข้า Book ตัวเอง
export const addToMyBook = async (userId: string, wordId: string) => {
  const { error } = await supabase
    .from('user_books')
    .insert([{ user_id: userId, word_id: wordId }]);
  if (error) throw error;
};

// --- สำหรับ ADMIN ---
// 3. ดึงรายการคำศัพท์ที่รอการอนุมัติ
export const getPendingWords = async () => {
  const { data, error } = await supabase
    .from('global_vocabulary')
    .select('*')
    .eq('status', 'pending');
  if (error) throw error;
  return data;
};

// 4. อนุมัติคำศัพท์
export const approveWord = async (wordId: string) => {
  const { error } = await supabase
    .from('global_vocabulary')
    .update({ status: 'approved' })
    .eq('id', wordId);
  if (error) throw error;
};
// --- ฟังก์ชันเพิ่มเติมสำหรับ My Book ---

// 1. ดึงคำศัพท์ทั้งหมดใน Book ของ User คนนั้น
export const getMyBook = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_books')
    .select(`
      id,
      is_mastered,
      custom_note,
      global_vocabulary (id, word, definition)
    `)
    .eq('user_id', userId);
  
  if (error) throw error;
  return data;
};

// 2. อัปเดตสถานะว่าจำได้แล้ว หรือแก้ไขโน้ต
export const updateMyWord = async (rowId: string, updates: { is_mastered?: boolean, custom_note?: string }) => {
  const { error } = await supabase
    .from('user_books')
    .update(updates)
    .eq('id', rowId);
  if (error) throw error;
};

// 3. ลบคำศัพท์ออกจาก My Book
export const removeFromMyBook = async (rowId: string) => {
  const { error } = await supabase
    .from('user_books')
    .delete()
    .eq('id', rowId);
  if (error) throw error;
};
// ดึงคำศัพท์ทั้งหมดที่สถานะเป็น 'approved'
export const getGlobalLibrary = async () => {
  const { data, error } = await supabase
    .from('global_vocabulary')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};
// ฟังก์ชันค้นหาคำศัพท์จากฐานข้อมูล (Global Library)
export const searchGlobalLibrary = async (query: string) => {
  const { data, error } = await supabase
    .from('global_vocabulary')
    .select('*')
    .eq('status', 'approved')
    .ilike('word', `%${query}%`); // ilike คือการค้นหาแบบไม่สนตัวพิมพ์เล็ก-ใหญ่
  
  if (error) throw error;
  return data;
};