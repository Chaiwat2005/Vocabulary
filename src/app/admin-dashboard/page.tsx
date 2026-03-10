"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminApprove() {
  const [pendingVocabs, setPendingVocabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State สำหรับเก็บข้อมูลที่กำลังแก้ไขในรายการอนุมัติ
  const [editData, setEditData] = useState<any>(null);

  const fetchPending = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });
    if (data) setPendingVocabs(data);
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  // ฟังก์ชันอนุมัติ (พร้อมบันทึกข้อมูลที่แก้ไขล่าสุด)
  const handleApprove = async (id: string, currentData: any) => {
    if (!confirm("ยืนยันการอนุมัติคำศัพท์นี้เข้าสู่คลังหลัก?")) return;
    
    const { error } = await supabase
      .from('vocabulary')
      .update({ 
        word: currentData.word,
        definition: currentData.definition,
        part_of_speech: currentData.part_of_speech,
        example_sentence: currentData.example_sentence,
        is_approved: true 
      })
      .eq('id', id);

    if (!error) {
      alert("อนุมัติเรียบร้อย!");
      fetchPending();
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("ต้องการลบคำเสนอนี้ทิ้งใช่หรือไม่?")) return;
    const { error } = await supabase.from('vocabulary').delete().eq('id', id);
    if (!error) fetchPending();
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-400">กำลังดึงข้อมูลคำเสนอแนะ...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-black mb-8">📥 รายการรออนุมัติ ({pendingVocabs.length})</h1>

      {pendingVocabs.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-200 text-gray-400 font-bold">
          ไม่มีคำศัพท์รอการอนุมัติในขณะนี้
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {pendingVocabs.map((item) => (
            <div key={item.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-start hover:shadow-md transition-shadow">
              
              {/* ส่วนรูปภาพ */}
              <div className="w-full md:w-40 h-40 bg-gray-100 rounded-3xl overflow-hidden shrink-0 border border-gray-100">
                {item.image_url ? (
                  <img src={item.image_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">NO IMAGE</div>
                )}
              </div>

              {/* ส่วนฟอร์มแก้ไขก่อนอนุมัติ */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-blue-500 ml-1 uppercase">Word</label>
                  <input 
                    className="p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-400 font-bold"
                    defaultValue={item.word}
                    onChange={(e) => item.word = e.target.value}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-blue-500 ml-1 uppercase">Part of Speech</label>
                  <select 
                    className="p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-400"
                    defaultValue={item.part_of_speech}
                    onChange={(e) => item.part_of_speech = e.target.value}
                  >
                    <option value="noun">Noun</option>
                    <option value="verb">Verb</option>
                    <option value="adj">Adjective</option>
                    <option value="adv">Adverb</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex flex-col gap-1">
                  <label className="text-[10px] font-black text-blue-500 ml-1 uppercase">Definition</label>
                  <input 
                    className="p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-400"
                    defaultValue={item.definition}
                    onChange={(e) => item.definition = e.target.value}
                  />
                </div>
                <div className="md:col-span-2 flex flex-col gap-1">
                  <label className="text-[10px] font-black text-blue-500 ml-1 uppercase">Example Sentence</label>
                  <textarea 
                    className="p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-400 h-20 resize-none text-sm italic"
                    defaultValue={item.example_sentence}
                    onChange={(e) => item.example_sentence = e.target.value}
                  />
                </div>
              </div>

              {/* ส่วนปุ่มตัดสินใจ */}
              <div className="flex flex-col gap-3 w-full md:w-32 self-center">
                <button 
                  onClick={() => handleApprove(item.id, item)}
                  className="bg-green-500 hover:bg-green-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-green-100 transition-all active:scale-95 text-xs"
                >
                  APPROVE
                </button>
                <button 
                  onClick={() => handleReject(item.id)}
                  className="bg-white hover:bg-red-50 text-red-400 py-3 rounded-2xl font-bold transition-all text-xs border border-red-50"
                >
                  REJECT
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}