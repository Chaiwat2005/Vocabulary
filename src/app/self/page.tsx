"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Vocab = { id: number; word: string; definition: string; color: string; };

export default function MyLibrary() {
  const [myVocab, setMyVocab] = useState<Vocab[]>([]);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ word: "", def: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const getRandomColor = () => {
    const colors = ["bg-emerald-600", "bg-cyan-600", "bg-teal-600", "bg-sky-600", "bg-indigo-600", "bg-purple-600"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("myPersonalCards");
    if (stored) setMyVocab(JSON.parse(stored));
  }, []);

  const saveAndRefresh = (data: Vocab[]) => {
    setMyVocab(data);
    localStorage.setItem("myPersonalCards", JSON.stringify(data));
  };

  const handleAddPersonal = () => {
    if (!form.word || !form.def) return;
    const newItem = { 
      id: Date.now(), 
      word: form.word, 
      definition: form.def, 
      color: getRandomColor() // <--- สุ่มสีตรงนี้
    };
    saveAndRefresh([...myVocab, newItem]);
    setForm({ word: "", def: "" });
    setIsModalOpen(false);
  };

  const handleUpdate = (e: React.FormEvent, id: number) => {
    e.preventDefault();
    saveAndRefresh(myVocab.map(v => v.id === id ? { ...v, definition: editVal } : v));
    setEditingId(null);
  };

  if (!isMounted) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto text-white">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-bold text-emerald-400">🏠 คลังส่วนตัว</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 px-6 py-2 rounded-full font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform hover:bg-emerald-500">+ เพิ่มคำศัพท์ของฉัน</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myVocab.map((item) => (
          <div key={item.id} className="h-64 cursor-pointer" style={{ perspective: "1200px" }} onClick={() => setFlipped(p => ({...p, [item.id]: !p[item.id]}))}>
            <motion.div animate={{ rotateY: flipped[item.id] ? 180 : 0 }} transition={{ duration: 0.3, ease: "backOut" }} className="w-full h-full relative" style={{ transformStyle: "preserve-3d" }}>
              <div className="absolute inset-0 bg-slate-900 border border-emerald-500/20 rounded-3xl flex flex-col items-center justify-center p-6 shadow-xl" style={{ backfaceVisibility: "hidden" }}>
                <h3 className="text-3xl font-bold text-emerald-400">{item.word}</h3>
                <button onClick={(e) => { e.stopPropagation(); saveAndRefresh(myVocab.filter(v => v.id !== item.id)); }} className="absolute top-4 right-4 text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg text-xs font-bold">ลบ</button>
              </div>

              <div className={`absolute inset-0 ${item.color} rounded-3xl flex flex-col items-center justify-center p-8 text-center shadow-inner`} style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                {editingId === item.id ? (
                  <form onClick={e => e.stopPropagation()} onSubmit={e => handleUpdate(e, item.id)} className="w-full">
                    <textarea className="w-full bg-black/40 border border-white/30 rounded-xl p-3 text-sm mb-2 outline-none text-white" value={editVal} onChange={e => setEditVal(e.target.value)} autoFocus />
                    <button type="submit" className="bg-white text-emerald-700 px-4 py-1 rounded-lg text-xs font-bold uppercase">บันทึกแก้ไข</button>
                  </form>
                ) : (
                  <div>
                    <p className="text-xl font-bold mb-4">{item.definition}</p>
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(item.id); setEditVal(item.definition); }} className="text-[10px] bg-black/20 px-3 py-1 rounded-full hover:bg-black/40 transition-all uppercase tracking-widest font-bold border border-white/10">แก้ไขความหมาย</button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        ))}
      </div>

      {/* Modal เพิ่มศัพท์ส่วนตัว */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-900 p-8 rounded-[2rem] border border-emerald-500/20 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6 text-emerald-400">เพิ่มคำศัพท์ใหม่</h2>
              <input type="text" placeholder="คำศัพท์" className="w-full mb-4 p-4 bg-black border border-slate-800 rounded-2xl outline-none focus:border-emerald-500 text-white" value={form.word} onChange={e => setForm({...form, word: e.target.value})} />
              <textarea placeholder="ความหมาย" className="w-full mb-6 p-4 bg-black border border-slate-800 rounded-2xl h-32 outline-none focus:border-emerald-500 text-white" value={form.def} onChange={e => setForm({...form, def: e.target.value})} />
              <button onClick={handleAddPersonal} className="w-full bg-emerald-600 py-4 rounded-2xl font-bold hover:bg-emerald-500 transition-all">บันทึกเข้าคลังส่วนตัว ✨</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}