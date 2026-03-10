"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [vocabs, setVocabs] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [newVocab, setNewVocab] = useState({ 
    word: "", 
    def: "", 
    pos: "noun", 
    image: "", 
    example: "" 
  });

  const [cardColors, setCardColors] = useState<{[key: string]: string}>({});
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  // 🌟 เพิ่มฟิลด์ให้ editValue ครบถ้วน
  const [editValue, setEditValue] = useState({ 
    word: "", 
    def: "", 
    pos: "noun", 
    example: "", 
    image_url: "" 
  });
  
  const [selectedVocabId, setSelectedVocabId] = useState<string | null>(null);

  const bgColors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500"];
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      setRole(profile?.role || 'user');
    }

    const { data } = await supabase.from('vocabulary').select('*').eq('is_approved', true).order('word', { ascending: true });
    if (data) setVocabs(data);
    setLoading(false);
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('vocab-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('vocab-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setImageFile(null);
      setPreviewUrl(null);
    }
  };

  const toggleFlip = (id: string) => {
    if (selectedVocabId === id) {
      setSelectedVocabId(null);
    } else {
      const randomColor = bgColors[Math.floor(Math.random() * bgColors.length)];
      setCardColors(prev => ({ ...prev, [id]: randomColor }));
      setSelectedVocabId(id);
    }
  };

  const handleAdminAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = newVocab.image;
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const { error } = await supabase.from('vocabulary').insert([
        { 
          word: newVocab.word, 
          definition: newVocab.def, 
          part_of_speech: newVocab.pos,
          image_url: finalImageUrl || null,
          example_sentence: newVocab.example || null,
          is_approved: true 
        }
      ]);

      if (!error) {
        alert("บันทึกข้อมูลเรียบร้อย!");
        setNewVocab({ word: "", def: "", pos: "noun", image: "", example: "" });
        setImageFile(null);
        setPreviewUrl(null);
        fetchData();
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🌟 ปรับปรุง handleUpdate ให้รองรับทุกฟิลด์
  const handleUpdate = async (id: string) => {
    setLoading(true);
    try {
      let finalImageUrl = editValue.image_url;

      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const { error } = await supabase
        .from('vocabulary')
        .update({ 
          word: editValue.word, 
          definition: editValue.def,
          part_of_speech: editValue.pos,
          image_url: finalImageUrl,
          example_sentence: editValue.example
        })
        .eq('id', id);

      if (!error) {
        setIsEditing(null);
        setImageFile(null);
        setPreviewUrl(null);
        fetchData();
        alert("อัปเดตข้อมูลเรียบร้อย!");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบคำศัพท์นี้ออกจากคลังหลัก?")) return;
    const { error } = await supabase.from('vocabulary').delete().eq('id', id);
    if (!error) fetchData();
  };

  const addToMyBook = async (vocabId: string) => {
    if (!user) return alert("กรุณา Login ก่อน");
    const { error } = await supabase.from('user_vocabulary').insert([{ user_id: user.id, vocab_id: vocabId }]);
    if (!error) alert("เพิ่มเข้า My Book เรียบร้อย!");
  };

  const filteredVocabs = vocabs.filter(item => 
    item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedVocabs = filteredVocabs.reduce((groups: any, item) => {
    const letter = item.word[0]?.toUpperCase() || '#';
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(item);
    return groups;
  }, {});

  if (loading) return <div className="p-10 text-center font-bold text-gray-400">กำลังโหลดคำศัพท์...</div>;

  return (
    <div className="pl-1 pr-4 py-8 max-w-[100vw] mx-auto bg-gray-50 min-h-screen flex gap-2 md:gap-4 relative text-gray-900">
      
      {/* Sidebar A-Z */}
      <div className="hidden lg:flex flex-col gap-0.5 sticky top-5 h-[90vh] overflow-y-auto bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-gray-100 min-w-[50px] scrollbar-hide">
        {alphabet.map((char) => {
          const hasData = groupedVocabs[char] && groupedVocabs[char].length > 0;
          return (
            <a key={char} href={hasData ? `#section-${char}` : undefined}
              className={`text-[13px] font-bold w-9 h-9 flex items-center justify-center rounded-lg transition-all
                ${hasData ? 'text-blue-600 hover:bg-blue-600 hover:text-white shadow-sm' : 'text-gray-200 cursor-not-allowed'}`}>
              {char}
            </a>
          );
        })}
      </div>

      <div className="flex-1 min-w-0 pr-4 ml-4">
        <h1 className="text-4xl font-black text-gray-800 mb-2">คลังคำศัพท์ทั้งหมด</h1>
        <p className="text-sm text-gray-500 mb-6 font-medium">คำทั้งหมด: {vocabs.length} คำ</p>
        
        <input type="text" placeholder="ค้นหาคำศัพท์..." className="block w-full max-w-md p-3 mb-8 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-900 placeholder:text-gray-500"
          onChange={(e) => setSearchTerm(e.target.value)} />

        {role === 'admin' && (
          <div className="mb-12 bg-indigo-900 p-8 rounded-[2.5rem] shadow-2xl border border-indigo-800 text-white">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2">⚡ Admin Entry</h2>
            <form onSubmit={handleAdminAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-indigo-300 ml-1">Word *</label>
                <input className="p-4 rounded-xl bg-indigo-800/50 outline-none focus:ring-2 focus:ring-indigo-400 text-white" 
                  value={newVocab.word} onChange={e => setNewVocab({...newVocab, word: e.target.value})} required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-indigo-300 ml-1">Context *</label>
                <select className="p-4 rounded-xl bg-indigo-800/50 outline-none focus:ring-2 focus:ring-indigo-400 text-white"
                  value={newVocab.pos} onChange={e => setNewVocab({...newVocab, pos: e.target.value})} required>
                  <option value="noun" className="text-black">Noun</option>
                  <option value="verb" className="text-black">Verb</option>
                  <option value="adj" className="text-black">Adjective</option>
                  <option value="adv" className="text-black">Adverb</option>
                </select>
              </div>
              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-bold text-indigo-300 ml-1">Definition *</label>
                <input className="p-4 rounded-xl bg-indigo-800/50 outline-none focus:ring-2 focus:ring-indigo-400 text-white" 
                  value={newVocab.def} onChange={e => setNewVocab({...newVocab, def: e.target.value})} required />
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-indigo-300 ml-1 italic uppercase tracking-wider">Image Upload</label>
                <div className="flex items-center gap-5 bg-indigo-800/40 p-4 rounded-3xl border border-indigo-700/50 shadow-inner">
                  <div className="relative w-20 h-20 bg-indigo-900/60 rounded-2xl overflow-hidden border-2 border-indigo-500/30 flex items-center justify-center shrink-0 shadow-lg">
                    {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : "🖼️"}
                  </div>
                  <div className="flex-1">
                    <label className="inline-block">
                      <span className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black py-2 px-4 rounded-xl cursor-pointer">Choose File</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                    <p className="mt-2 text-[9px] text-indigo-200 truncate">{imageFile?.name || "No file chosen"}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-indigo-300 italic">Example Sentence</label>
                <textarea className="p-3 rounded-xl bg-indigo-800/30 outline-none focus:ring-2 focus:ring-indigo-400 h-20 resize-none text-sm text-white" 
                  value={newVocab.example} onChange={e => setNewVocab({...newVocab, example: e.target.value})} />
              </div>
              <button type="submit" className="md:col-span-2 bg-white text-indigo-900 py-4 rounded-xl font-black hover:bg-indigo-100 shadow-lg transition-all">SAVE</button>
            </form>
          </div>
        )}

        <div className="space-y-16">
          {alphabet.map((char) => groupedVocabs[char] && (
            <section key={char} id={`section-${char}`} className="scroll-mt-24">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-white border-2 border-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-xl font-black text-blue-600">{char}</span>
                </div>
                <div className="h-[1px] flex-1 bg-blue-100"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-10">
                {groupedVocabs[char].map((item: any) => (
                  <div key={item.id} className="group relative w-full">
                    {isEditing === item.id ? (
                      /* --- 📝 โหมดแก้ไข (Full Admin Editing) --- */
                      <div className="w-full min-h-[400px] bg-white border-2 border-blue-500 rounded-[2.5rem] p-6 flex flex-col gap-3 shadow-2xl z-20">
                        <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">Edit Vocabulary</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            className="border p-2 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-400" 
                            value={editValue.word} 
                            onChange={e => setEditValue({...editValue, word: e.target.value})} 
                            placeholder="Word"
                          />
                          <select 
                            className="border p-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                            value={editValue.pos}
                            onChange={e => setEditValue({...editValue, pos: e.target.value})}
                          >
                            <option value="noun">Noun</option>
                            <option value="verb">Verb</option>
                            <option value="adj">Adjective</option>
                            <option value="adv">Adverb</option>
                          </select>
                        </div>
                        <textarea 
                          className="border p-2 rounded-xl text-xs h-16 outline-none focus:ring-2 focus:ring-blue-400 resize-none text-gray-900" 
                          value={editValue.def} 
                          onChange={e => setEditValue({...editValue, def: e.target.value})} 
                          placeholder="Definition"
                        />
                        <textarea 
                          className="border p-2 rounded-xl text-xs h-16 outline-none focus:ring-2 focus:ring-blue-400 resize-none font-serif italic text-gray-900" 
                          value={editValue.example} 
                          onChange={e => setEditValue({...editValue, example: e.target.value})} 
                          placeholder="Example Sentence"
                        />
                        <div className="flex items-center gap-3 bg-blue-50 p-2 rounded-xl border border-blue-100">
                          <div className="w-10 h-10 bg-white rounded-lg overflow-hidden shrink-0 border">
                            <img src={previewUrl || editValue.image_url || "🖼️"} className="w-full h-full object-cover" />
                          </div>
                          <input type="file" accept="image/*" className="text-[9px] w-full" onChange={handleFileChange} />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleUpdate(item.id)} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-blue-700 shadow-md">บันทึก</button>
                          <button onClick={() => { setIsEditing(null); setPreviewUrl(null); setImageFile(null); }} className="flex-1 bg-gray-100 text-gray-500 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-200">ยกเลิก</button>
                        </div>
                      </div>
                    ) : (
                      /* --- 🖼️ โหมดแสดงผลปกติ --- */
                      <>
                        <div 
                          className="w-full h-64 bg-white border-2 border-gray-100 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-blue-200 relative overflow-hidden"
                          onClick={() => setSelectedVocabId(item.id)}
                        >
                          {/* บริบทมุมขวาบน (Noun/Verb) เหมือน My Book */}
                          <span className="absolute top-6 right-8 text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">
                            {item.part_of_speech || 'noun'}
                          </span>

                          <h3 className={`font-black text-gray-800 text-center uppercase group-hover:text-blue-600 transition-colors tracking-tighter
                            ${item.word.length > 15 ? 'text-xl' : 'text-3xl'}`}>
                            {item.word}
                          </h3>
                          
                          <div className="mt-4 text-[10px] font-black text-blue-400 opacity-0 group-hover:opacity-100 transition-all uppercase bg-blue-50 px-3 py-1 rounded-full">
                            ดูคำแปล 📖
                          </div>
                        </div>

                        <div className="mt-4 flex justify-between items-center px-4">
                          <button 
                            onClick={() => addToMyBook(item.id)} 
                            className="text-[11px] font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition-colors border border-orange-100"
                          >
                            ⭐ เก็บลง My Book
                          </button>
                          
                          {role === 'admin' && (
                            <div className="flex gap-4 text-lg opacity-40 group-hover:opacity-100 transition-opacity items-center">
                              <span 
                                className="cursor-pointer hover:text-blue-600 hover:scale-125 transition-transform" 
                                onClick={() => { 
                                  setIsEditing(item.id); 
                                  setEditValue({ 
                                    word: item.word, 
                                    def: item.definition,
                                    pos: item.part_of_speech || 'noun',
                                    example: item.example_sentence || '',
                                    image_url: item.image_url || ''
                                  }); 
                                }}
                              >
                                ✏️
                              </span>
                              <span 
                                className="cursor-pointer hover:text-red-600 hover:scale-125 transition-transform" 
                                onClick={() => handleDelete(item.id)}
                              >
                                🗑️
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* --- Focus Mode Popup (Fixed Scaling Logic) --- */}
      {selectedVocabId && (() => {
        const item = vocabs.find(v => v.id === selectedVocabId);
        if (!item) return null;
        const hasImage = !!item.image_url;

        return (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[999] flex items-center justify-center p-4 md:p-10 animate-fadeIn" onClick={() => setSelectedVocabId(null)}>
            <div 
              className={`relative ${cardColors[item.id] || 'bg-indigo-600'} text-white rounded-[3rem] shadow-2xl w-[95%] max-w-7xl 
                ${hasImage ? 'h-[85vh] md:h-[70vh] flex flex-col md:flex-row' : 'h-auto max-h-[80vh] flex flex-col items-center justify-center p-12 md:p-20'} 
                overflow-hidden animate-zoomIn`} 
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setSelectedVocabId(null)} className="absolute top-6 right-8 text-4xl font-light z-10 hover:text-red-200 transition-colors">×</button>

              {hasImage && (
                <div className="w-full md:w-1/2 h-1/2 md:h-full bg-black/20 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-white/10">
                  <img src={item.image_url} alt="" className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl border-4 border-white/20" />
                </div>
              )}

              <div className={`${hasImage ? 'w-full md:w-1/2 h-1/2 md:h-full p-8 md:p-16' : 'w-full max-w-4xl'} flex flex-col justify-center overflow-y-auto`}>
                <span className={`text-xs font-black bg-white/20 px-5 py-2 rounded-full uppercase tracking-widest mb-4 w-fit ${!hasImage && 'mx-auto'}`}>{item.part_of_speech || 'noun'}</span>
                
                <h2 className={`font-black mb-2 uppercase tracking-tighter leading-none whitespace-nowrap overflow-hidden text-center ${hasImage ? 'text-left' : 'text-center'}
                  ${item.word.length > 25 ? 'text-[5vw]' : 
                    item.word.length > 15 ? 'text-[7vw]' : 
                    'text-[9vw] md:text-8xl'}`}>
                  {item.word}
                </h2>

                <div className={`w-20 h-1.5 bg-white/40 mb-8 rounded-full ${!hasImage && 'mx-auto'}`}></div>
                <p className={`font-bold leading-tight mb-8 ${hasImage ? 'text-3xl md:text-5xl' : 'text-4xl md:text-6xl text-center'}`}>{item.definition}</p>
                
                {item.example_sentence && (
                  <div className={`bg-black/15 p-6 rounded-[2rem] border border-white/10 italic font-medium font-serif ${hasImage ? 'text-lg md:text-xl' : 'text-xl md:text-3xl text-center w-full'}`}>
                    "{item.example_sentence}"
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}