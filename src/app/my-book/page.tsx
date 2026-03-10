"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function MyBook() {
  const [myVocabs, setMyVocabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [selectedVocabId, setSelectedVocabId] = useState<string | null>(null);
  
  // สถานะสำหรับเพิ่มคำใหม่
  const [newWord, setNewWord] = useState({ word: "", def: "", pos: "noun", example: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // สถานะสำหรับแก้ไขคำเดิม
  const [editValue, setEditValue] = useState({ 
    word: "", 
    def: "", 
    pos: "noun", 
    example: "", 
    image_url: "" 
  });

  const [cardColors, setCardColors] = useState<{[key: string]: string}>({});
  const bgColors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500"];

  const fetchMyBook = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from('user_vocabulary')
        .select(`*, vocabulary (word, definition, part_of_speech, image_url, example_sentence)`)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (data) setMyVocabs(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMyBook(); }, []);

  // 🌟 ฟังก์ชันอัปโหลดรูปภาพ (ที่หายไป)
  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('vocab-images').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('vocab-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // 🌟 ฟังก์ชัน Suggest (ที่หายไป)
  const handleSuggest = async (item: any) => {
    if (!confirm("ต้องการเสนอคำศัพท์นี้เข้าสู่คลังส่วนกลางใช่หรือไม่?")) return;
    const { error } = await supabase.from('vocabulary').insert([{
      word: item.custom_word,
      definition: item.custom_definition,
      part_of_speech: item.part_of_speech || 'noun',
      image_url: item.image_url || null,
      example_sentence: item.example_sentence || null,
      is_approved: false
    }]);
    if (!error) alert("ส่งคำเสนอแนะแล้ว! รอการตรวจสอบจาก Admin");
    else alert("Error: " + error.message);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
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

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let finalImageUrl = "";
      if (imageFile) finalImageUrl = await uploadImage(imageFile);

      const { error } = await supabase.from('user_vocabulary').insert([{ 
        user_id: session?.user.id, 
        custom_word: newWord.word, 
        custom_definition: newWord.def,
        part_of_speech: newWord.pos,
        image_url: finalImageUrl || null,
        example_sentence: newWord.example || null
      }]);

      if (!error) {
        setNewWord({ word: "", def: "", pos: "noun", example: "" });
        setImageFile(null);
        setPreviewUrl(null);
        fetchMyBook();
      }
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  const handleUpdate = async (id: string) => {
    setLoading(true);
    try {
      let finalImageUrl = editValue.image_url;
      if (imageFile) finalImageUrl = await uploadImage(imageFile);

      const { error } = await supabase
        .from('user_vocabulary')
        .update({ 
          custom_word: editValue.word, 
          custom_definition: editValue.def,
          part_of_speech: editValue.pos,
          image_url: finalImageUrl,
          example_sentence: editValue.example
        })
        .eq('id', id);

      if (!error) {
        setIsEditing(null);
        setImageFile(null);
        setPreviewUrl(null);
        fetchMyBook();
        alert("แก้ไขข้อมูลเรียบร้อย!");
      }
    } catch (err: any) { alert("Error: " + err.message); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบคำศัพท์นี้ไหม?")) return;
    const { error } = await supabase.from('user_vocabulary').delete().eq('id', id);
    if (!error) fetchMyBook();
  };

  if (loading) return <div className="p-10 text-center text-gray-500 font-bold">กำลังเปิดสมุด...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen text-gray-900">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black text-gray-800">⭐ My Study Book</h1>
      </div>

      <form onSubmit={handleAddNew} className="mb-12 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-400 ml-1">Word *</label>
          <input className="p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-400" placeholder="Vocabulary..." value={newWord.word} onChange={e => setNewWord({...newWord, word: e.target.value})} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-400 ml-1">Part of Speech *</label>
          <select className="p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-400 bg-white" value={newWord.pos} onChange={e => setNewWord({...newWord, pos: e.target.value})} required>
            <option value="noun">Noun</option>
            <option value="verb">Verb</option>
            <option value="adj">Adjective</option>
            <option value="adv">Adverb</option>
          </select>
        </div>
        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-400 ml-1">Definition *</label>
          <input className="p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-400" placeholder="คำแปล..." value={newWord.def} onChange={e => setNewWord({...newWord, def: e.target.value})} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-400 ml-1">Image Upload</label>
          <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl border border-dashed text-gray-900">
            <div className="w-12 h-12 bg-white rounded-lg overflow-hidden shrink-0 border">
              {previewUrl && <img src={previewUrl} className="w-full h-full object-cover" />}
            </div>
            <input type="file" accept="image/*" className="text-[10px]" onChange={handleFileChange} />
          </div>
        </div>
        <div className="flex flex-col gap-1 text-gray-900">
          <label className="text-xs font-bold text-gray-400 ml-1">Example</label>
          <textarea className="p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-400 h-14 resize-none text-sm" placeholder="Example sentence..." value={newWord.example} onChange={e => setNewWord({...newWord, example: e.target.value})} />
        </div>
        <button className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black shadow-lg transition-all active:scale-95 uppercase">ADD TO MY BOOK</button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {myVocabs.map((item) => (
          <div key={item.id} className="group relative w-full">
            {isEditing === item.id ? (
              <div className="w-full min-h-[400px] bg-white border-2 border-blue-400 rounded-[2.5rem] p-6 flex flex-col gap-3 shadow-xl">
                <h4 className="text-xs font-black text-blue-500 uppercase mb-2">Edit My Word</h4>
                <div className="grid grid-cols-2 gap-2 text-gray-900">
                  <input className="border p-2 rounded-xl text-sm font-bold outline-none" value={editValue.word} onChange={e => setEditValue({...editValue, word: e.target.value})} />
                  <select className="border p-2 rounded-xl text-sm bg-white" value={editValue.pos} onChange={e => setEditValue({...editValue, pos: e.target.value})}>
                    <option value="noun">Noun</option>
                    <option value="verb">Verb</option>
                    <option value="adj">Adjective</option>
                    <option value="adv">Adverb</option>
                  </select>
                </div>
                <textarea className="border p-2 rounded-xl text-sm h-16 resize-none text-gray-900" value={editValue.def} onChange={e => setEditValue({...editValue, def: e.target.value})} />
                <textarea className="border p-2 rounded-xl text-sm h-16 resize-none italic text-gray-900" value={editValue.example} onChange={e => setEditValue({...editValue, example: e.target.value})} />
                <div className="flex items-center gap-3 bg-blue-50 p-2 rounded-xl border border-blue-100">
                  <div className="w-10 h-10 bg-white rounded-lg overflow-hidden border">
                    <img src={previewUrl || editValue.image_url || "🖼️"} className="w-full h-full object-cover" />
                  </div>
                  <input type="file" accept="image/*" className="text-[9px] w-full text-gray-900" onChange={handleFileChange} />
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleUpdate(item.id)} className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-bold text-xs">บันทึก</button>
                  <button onClick={() => { setIsEditing(null); setPreviewUrl(null); setImageFile(null); }} className="flex-1 bg-gray-100 text-gray-400 py-2 rounded-xl font-bold text-xs">ยกเลิก</button>
                </div>
              </div>
            ) : (
              <>
                <div 
                  className="w-full h-64 bg-white border-2 border-gray-100 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-blue-200 relative"
                  onClick={() => toggleFlip(item.id)}
                >
                  <span className="absolute top-6 right-8 text-[11px] font-black text-slate-300 uppercase tracking-widest">
                    {(item.vocab_id ? item.vocabulary?.part_of_speech : item.part_of_speech) || 'noun'}
                  </span>
                  <h3 className="text-3xl font-black text-gray-800 text-center uppercase tracking-tighter">
                    {item.custom_word || item.vocabulary?.word}
                  </h3>
                  <div className="mt-4 text-[10px] font-black text-blue-400 opacity-0 group-hover:opacity-100 transition-all uppercase bg-blue-50 px-3 py-1 rounded-full">เปิดอ่านคำแปล 📖</div>
                  {!item.vocab_id && <span className="absolute bottom-5 text-[9px] bg-indigo-50 text-indigo-400 px-3 py-1 rounded-full font-bold border border-indigo-100 uppercase">Custom Word</span>}
                </div>

                <div className="mt-4 flex justify-between items-center px-4">
                  <div className="flex gap-3">
                    <button onClick={() => handleDelete(item.id)} className="text-[10px] font-black text-red-400 hover:text-red-500 uppercase">Delete</button>
                    <button 
                      onClick={() => { 
                        setIsEditing(item.id); 
                        setEditValue({ 
                          word: item.custom_word || item.vocabulary?.word || "", 
                          def: item.custom_definition || item.vocabulary?.definition || "",
                          pos: item.part_of_speech || item.vocabulary?.part_of_speech || "noun",
                          example: item.example_sentence || item.vocabulary?.example_sentence || "",
                          image_url: item.image_url || item.vocabulary?.image_url || ""
                        }); 
                      }} 
                      className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 uppercase"
                    >
                      Edit
                    </button>
                    {!item.vocab_id && (
                      <button 
                        onClick={() => handleSuggest(item)}
                        className="text-[10px] font-black text-green-500 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 uppercase flex items-center gap-1"
                      >
                        <span>📤</span> Suggest
                      </button>
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tight">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {selectedVocabId && (() => {
        const item = myVocabs.find(v => v.id === selectedVocabId);
        if (!item) return null;
        
        const isCustom = !item.vocab_id;
        const displayData = isCustom ? {
          word: item.custom_word, def: item.custom_definition, pos: item.part_of_speech, image: item.image_url, example: item.example_sentence
        } : {
          word: item.vocabulary?.word, def: item.vocabulary?.definition, pos: item.vocabulary?.part_of_speech, image: item.vocabulary?.image_url, example: item.vocabulary?.example_sentence
        };

        const hasImage = !!displayData.image;

        return (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[999] flex items-center justify-center p-4" onClick={() => setSelectedVocabId(null)}>
            <div className={`relative ${cardColors[item.id] || 'bg-indigo-600'} text-white rounded-[3rem] shadow-2xl w-[95%] max-w-7xl ${hasImage ? 'h-[85vh] md:h-[70vh] flex flex-col md:flex-row' : 'h-auto max-h-[80vh] flex flex-col items-center justify-center p-12 md:p-20'} overflow-hidden animate-zoomIn`} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedVocabId(null)} className="absolute top-6 right-8 text-4xl font-light hover:text-red-200">×</button>

              {hasImage ? (
                <>
                  <div className="w-full md:w-1/2 h-1/2 md:h-full bg-black/20 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-white/10">
                    <img src={displayData.image} alt="" className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl border-4 border-white/20" />
                  </div>
                  <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col justify-center p-8 md:p-16 overflow-y-auto">
                    <span className="text-xs font-black bg-white/20 px-5 py-2 rounded-full uppercase tracking-widest mb-4 w-fit">{displayData.pos || 'noun'}</span>
                    <h2 className={`font-black mb-2 uppercase tracking-tighter leading-[0.9] ${displayData.word.length > 15 ? 'text-4xl md:text-5xl' : displayData.word.length > 10 ? 'text-5xl md:text-7xl' : 'text-6xl md:text-8xl'} break-words [overflow-wrap:anywhere] w-full drop-shadow-md`}>{displayData.word}</h2>
                    <div className="w-20 h-1.5 bg-white/40 mb-8 rounded-full"></div>
                    <p className="text-3xl md:text-5xl font-bold leading-tight mb-8">{displayData.def}</p>
                    {displayData.example && <div className="bg-black/15 p-6 rounded-[2rem] border border-white/10 italic text-lg md:text-xl">"{displayData.example}"</div>}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-center max-w-4xl">
                  <span className="text-sm font-black bg-white/20 px-6 py-2 rounded-full uppercase tracking-widest mb-6 border border-white/10">{displayData.pos || 'noun'}</span>
                  <h2 className={`font-black mb-2 uppercase tracking-tighter leading-none whitespace-nowrap overflow-hidden text-ellipsis ${displayData.word.length > 25 ? 'text-[5vw] md:text-[4vw]' : displayData.word.length > 15 ? 'text-[7vw] md:text-[6vw]' : 'text-6xl md:text-8xl'} w-full drop-shadow-md`}>{displayData.word}</h2>
                  <div className="w-24 h-2 bg-white/30 mb-10 rounded-full"></div>
                  <p className="text-4xl md:text-6xl font-bold mb-12 drop-shadow-lg">{displayData.def}</p>
                  {displayData.example && <div className="bg-black/15 p-8 md:p-12 rounded-[3rem] border border-white/10 shadow-inner italic text-xl md:text-3xl text-indigo-50">"{displayData.example}"</div>}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}