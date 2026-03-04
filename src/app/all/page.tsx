"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Vocab = { id: number; word: string; definition: string; color: string; };

export default function AllVocabulary() {
  const [globalVocab, setGlobalVocab] = useState<Vocab[]>([
    { id: 1, word: "Resilient", definition: "ยืดหยุ่น, ล้มแล้วลุกเร็ว", color: "bg-indigo-600" },
    { id: 2, word: "Inevitably", definition: "อย่างหลีกเลี่ยงไม่ได้", color: "bg-emerald-600" },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [form, setForm] = useState({ word: "", def: "" });
  const [isMounted, setIsMounted] = useState(false);

  // ฟังก์ชันสุ่มสี
  const getRandomColor = () => {
    const colors = [
      "bg-indigo-600", "bg-emerald-600", "bg-rose-600", 
      "bg-amber-600", "bg-violet-600", "bg-cyan-600", 
      "bg-pink-600", "bg-blue-600"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("globalData");
    if (saved) setGlobalVocab(JSON.parse(saved));
  }, []);

  const handleAddGlobal = () => {
    if (!form.word || !form.def) return;
    const newItem = { 
      id: Date.now(), 
      word: form.word, 
      definition: form.def, 
      color: getRandomColor() // <--- สุ่มสีตรงนี้
    };
    const updated = [...globalVocab, newItem];
    setGlobalVocab(updated);
    localStorage.setItem("globalData", JSON.stringify(updated));
    setForm({ word: "", def: "" });
    setIsModalOpen(false);
  };

  const copyToPrivate = (e: React.MouseEvent, item: Vocab) => {
    e.stopPropagation();
    const privateData = JSON.parse(localStorage.getItem("myPersonalCards") || "[]");
    if (privateData.find((v: Vocab) => v.word === item.word)) return alert("มีคำนี้ในคลังส่วนตัวแล้ว");
    localStorage.setItem("myPersonalCards", JSON.stringify([...privateData, item]));
    alert("คัดลอกลงคลังส่วนตัวแล้ว ✨");
  };

  if (!isMounted) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-bold text-indigo-400 tracking-tight">📚 คลังคำศัพท์ทั้งหมด</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 px-6 py-2 rounded-full font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform hover:bg-indigo-500">+ เพิ่มคำศัพท์กลาง</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {globalVocab.map((item) => (
          <div key={item.id} className="h-64 cursor-pointer" style={{ perspective: "1200px" }} onClick={() => setFlipped(p => ({...p, [item.id]: !p[item.id]}))}>
            <motion.div animate={{ rotateY: flipped[item.id] ? 180 : 0 }} transition={{ duration: 0.3, ease: "backOut" }} className="w-full h-full relative" style={{ transformStyle: "preserve-3d" }}>
              <div className="absolute inset-0 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col items-center justify-center p-6" style={{ backfaceVisibility: "hidden" }}>
                <h3 className="text-3xl font-bold">{item.word}</h3>
                <button onClick={(e) => copyToPrivate(e, item)} className="mt-6 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-xs font-bold border border-indigo-500/20">
                  + เพิ่มเข้าคลังส่วนตัว
                </button>
              </div>
              <div className={`absolute inset-0 ${item.color} rounded-3xl flex items-center justify-center p-8 text-center text-xl font-bold shadow-inner`} style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                {item.definition}
              </div>
            </motion.div>
          </div>
        ))}
      </div>

      {/* Modal เพิ่มศัพท์กลาง */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-900 p-8 rounded-[2.5rem] w-full max-w-md border border-slate-700">
              <h2 className="text-2xl font-bold mb-6">เพิ่มคำศัพท์ใหม่</h2>
              <input type="text" placeholder="คำศัพท์" className="w-full mb-4 p-4 bg-black border border-slate-800 rounded-2xl outline-none focus:border-indigo-500 text-white" value={form.word} onChange={e => setForm({...form, word: e.target.value})} />
              <textarea placeholder="ความหมาย" className="w-full mb-6 p-4 bg-black border border-slate-800 rounded-2xl h-32 outline-none focus:border-indigo-500 text-white" value={form.def} onChange={e => setForm({...form, def: e.target.value})} />
              <div className="flex gap-3">
                <button onClick={handleAddGlobal} className="flex-1 bg-indigo-600 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all">บันทึกสุ่มสี</button>
                <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 py-4 rounded-2xl font-bold">ยกเลิก</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}