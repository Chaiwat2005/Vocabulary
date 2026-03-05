"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function MyBook() {
  const [myVocabs, setMyVocabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // 1. เปลี่ยนเป็น Set เพื่อให้เก็บ ID ที่ถูกเปิดได้หลายอันพร้อมกัน
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState({ word: "", def: "" });
  const [newWord, setNewWord] = useState({ word: "", def: "" });


  // รายการสีที่จะใช้สุ่ม (เลือกโทนสีอ่อนที่อ่านง่าย)
  const [cardColors, setCardColors] = useState<{[key: string]: string}>({});
  const bgColors = [
    "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", 
    "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500"
  ];

  const fetchMyBook = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from('user_vocabulary')
        .select(`*, vocabulary (word, definition)`)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (data) {
        // เพิ่มการสุ่มสีให้กับข้อมูลแต่ละแถวตั้งแต่ตอนดึงมา
        const dataWithColors = data.map((item: any) => ({
          ...item,
          randomBg: bgColors[Math.floor(Math.random() * bgColors.length)]
        }));
        setMyVocabs(dataWithColors);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchMyBook(); }, []);

  // ฟังก์ชันสลับการเปิด/ปิดการ์ด (Toggle) โดยไม่กระทบใบอื่น
  const toggleFlip = (id: string) => {
    const newFlipped = new Set(flippedIds);
    
    if (!newFlipped.has(id)) {
      // จังหวะที่กำลังจะเปิด (Flip) ให้สุ่มสีใหม่ทันที
      const randomColor = bgColors[Math.floor(Math.random() * bgColors.length)];
      setCardColors(prev => ({ ...prev, [id]: randomColor }));
      newFlipped.add(id);
    } else {
      // จังหวะที่ปิด
      newFlipped.delete(id);
    }
    
    setFlippedIds(newFlipped);
  };

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('user_vocabulary').insert([{ 
        user_id: session?.user.id, 
        custom_word: newWord.word, 
        custom_definition: newWord.def 
    }]);
    if (!error) { setNewWord({ word: "", def: "" }); fetchMyBook(); }
  };

  const handleUpdate = async (id: string) => {
    const { error } = await supabase.from('user_vocabulary').update({ 
        custom_word: editValue.word, custom_definition: editValue.def 
    }).eq('id', id);
    if (!error) { setIsEditing(null); fetchMyBook(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบคำศัพท์นี้ไหม?")) return;
    const { error } = await supabase.from('user_vocabulary').delete().eq('id', id);
    if (!error) fetchMyBook();
  };

  if (loading) return <div className="p-10 text-center text-gray-500">กำลังเปิดสมุด...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-black text-gray-800 flex items-center gap-2">
          ⭐ คำศัพท์ในคลังส่วนตัว
        </h1>
        <button 
          onClick={() => setFlippedIds(new Set())} 
          className="text-sm bg-gray-200 px-4 py-2 rounded-xl hover:bg-gray-300 transition-all text-gray-900 placeholder:text-gray-500"
        >
          ปิดการ์ดทั้งหมด
        </button>
      </div>

      {/* ฟอร์มเพิ่มคำศัพท์ */}
      <form onSubmit={handleAddNew} className="mb-10 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3">
        <input className="flex-1 p-3 rounded-2xl border outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder:text-gray-500" placeholder="คำศัพท์ใหม่..." value={newWord.word} onChange={e => setNewWord({...newWord, word: e.target.value})} required />
        <input className="flex-1 p-3 rounded-2xl border outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder:text-gray-500" placeholder="คำแปล..." value={newWord.def} onChange={e => setNewWord({...newWord, def: e.target.value})} required />
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-md">เพิ่มคำศัพท์</button>
      </form>

      {myVocabs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400">ยังไม่มีคำศัพท์ในสมุดเล่มนี้</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {myVocabs.map((item) => (
            <div key={item.id} className="relative group">
              {isEditing === item.id ? (
                <div className="bg-white border-2 border-blue-400 rounded-3xl p-6 h-64 flex flex-col gap-3 justify-center shadow-lg">
                  <input className="border p-2 rounded-xl outline-none text-gray-900 placeholder:text-gray-500" value={editValue.word} onChange={e => setEditValue({...editValue, word: e.target.value})} />
                  <textarea className="border p-2 rounded-xl h-20 outline-none text-gray-900 placeholder:text-gray-500" value={editValue.def} onChange={e => setEditValue({...editValue, def: e.target.value})} />
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(item.id)} className="flex-1 bg-green-500 text-white py-2 rounded-xl font-bold">บันทึก</button>
                    <button onClick={() => setIsEditing(null)} className="flex-1 bg-gray-100 text-gray-500 py-2 rounded-xl font-bold">ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <>
                  <div 
                    className={`relative w-full h-64 transition-all duration-500 cursor-pointer [transform-style:preserve-3d] ${flippedIds.has(item.id) ? '[transform:rotateY(180deg)]' : ''}`}
                    onClick={() => toggleFlip(item.id)}
                  >
                    {/* ด้านหน้า: ใช้สีขาวเสมอเพื่อความสะอาดตา */}
                    <div className="absolute inset-0 bg-white border-2 border-gray-100 rounded-3xl shadow-sm flex items-center justify-center p-6 [backface-visibility:hidden]">
                      <h3 className="text-3xl font-bold text-gray-800 text-center">
                        {item.custom_word || item.vocabulary?.word}
                      </h3>
                    </div>
                    {/* ด้านหลัง: ใช้สีที่สุ่มมาจาก Database (randomBg) */}
                    <div className={`absolute inset-0 ${cardColors[item.id] || 'bg-orange-500'} text-white rounded-3xl shadow-xl flex items-center justify-center p-8 [backface-visibility:hidden] [transform:rotateY(180deg)]`}>
                      <p className="text-xl text-center font-medium">
                        {item.custom_definition || item.vocabulary?.definition}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center px-2">
                    <button onClick={() => { setIsEditing(item.id); setEditValue({ word: item.custom_word || item.vocabulary?.word || "", def: item.custom_definition || item.vocabulary?.definition || "" }); }} className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-lg">แก้ไข</button>
                    <button onClick={() => handleDelete(item.id)} className="text-xs font-bold text-gray-400 hover:text-red-500">ลบออก</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}