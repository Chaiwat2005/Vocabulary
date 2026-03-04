"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [vocabs, setVocabs] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newVocab, setNewVocab] = useState({ word: "", def: "" });
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
  const [cardColors, setCardColors] = useState<{[key: string]: string}>({});
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState({ word: "", def: "" });

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

  const toggleFlip = (id: string) => {
    const newFlipped = new Set(flippedIds);
    if (!newFlipped.has(id)) {
      const randomColor = bgColors[Math.floor(Math.random() * bgColors.length)];
      setCardColors(prev => ({ ...prev, [id]: randomColor }));
      newFlipped.add(id);
    } else {
      newFlipped.delete(id);
    }
    setFlippedIds(newFlipped);
  };

  const handleAdminAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('vocabulary').insert([{ word: newVocab.word, definition: newVocab.def, is_approved: true }]);
    if (!error) {
      setNewVocab({ word: "", def: "" });
      fetchData();
    }
  };

  const handleUpdate = async (id: string) => {
    const { error } = await supabase.from('vocabulary').update({ word: editValue.word, definition: editValue.def }).eq('id', id);
    if (!error) { setIsEditing(null); fetchData(); }
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
    <div className="pl-1 pr-4 py-8 max-w-[100vw] mx-auto bg-gray-50 min-h-screen flex gap-2 md:gap-4">
      
      {/* Sidebar A-Z (ชิดซ้ายสุด) */}
      <div className="hidden lg:flex flex-col gap-0.5 sticky top-5 h-[90vh] overflow-y-auto bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 min-w-[50px] scrollbar-hide">
        {alphabet.map((char) => {
          const hasData = groupedVocabs[char] && groupedVocabs[char].length > 0;
          return (
            <a key={char} href={hasData ? `#section-${char}` : undefined}
              className={`text-[13px] font-bold w-9 h-9 flex items-center justify-center rounded-lg transition-all
                ${hasData ? 'text-blue-600 hover:bg-blue-600 hover:text-white' : 'text-gray-200 cursor-not-allowed'}`}>
              {char}
            </a>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 pr-4">
        <h1 className="text-4xl font-black text-gray-800 mb-2 ml-4">Global Library</h1>
        <p className="text-sm text-gray-500 mb-6 ml-4">Total: {vocabs.length} words</p>
        
        <div className="ml-4">
          <input type="text" placeholder="ค้นหาคำศัพท์..." className="block w-full max-w-md p-3 mb-8 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            onChange={(e) => setSearchTerm(e.target.value)} />

          {/* Admin Add Form */}
          {role === 'admin' && (
            <div className="mb-10 bg-blue-50 p-6 rounded-3xl border border-blue-100 shadow-sm">
              <h2 className="text-lg font-bold text-blue-700 mb-4">⚡ Admin Quick Add</h2>
              <form onSubmit={handleAdminAdd} className="flex flex-col sm:flex-row gap-3">
                <input className="flex-1 p-3 rounded-xl border-white outline-none" placeholder="คำศัพท์..." value={newVocab.word} onChange={e => setNewVocab({...newVocab, word: e.target.value})} required />
                <input className="flex-1 p-3 rounded-xl border-white outline-none" placeholder="คำแปล..." value={newVocab.def} onChange={e => setNewVocab({...newVocab, def: e.target.value})} required />
                <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">Add</button>
              </form>
            </div>
          )}

          {/* Flashcards Grouped by A-Z */}
          {Object.keys(groupedVocabs).length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">ไม่พบคำศัพท์</div>
          ) : (
            alphabet.map((char) => groupedVocabs[char] && (
              <section key={char} id={`section-${char}`} className="mb-16 scroll-mt-24">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-white border-2 border-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-2xl font-black text-blue-600">{char}</span>
                  </div>
                  <div className="h-[1px] flex-1 bg-blue-100"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                  {groupedVocabs[char].map((item: any) => (
                    <div key={item.id} className="relative">
                      {isEditing === item.id ? (
                        <div className="bg-white border-2 border-blue-500 rounded-3xl p-6 h-64 flex flex-col gap-3 justify-center shadow-xl">
                          <input className="border p-2 rounded-xl" value={editValue.word} onChange={e => setEditValue({...editValue, word: e.target.value})} />
                          <textarea className="border p-2 rounded-xl h-20" value={editValue.def} onChange={e => setEditValue({...editValue, def: e.target.value})} />
                          <div className="flex gap-2">
                            <button onClick={() => handleUpdate(item.id)} className="flex-1 bg-green-500 text-white py-2 rounded-xl font-bold">Save</button>
                            <button onClick={() => setIsEditing(null)} className="flex-1 bg-gray-100 text-gray-400 py-2 rounded-xl font-bold">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={`relative w-full h-64 transition-all duration-500 cursor-pointer [transform-style:preserve-3d] ${flippedIds.has(item.id) ? '[transform:rotateY(180deg)]' : ''}`}
                            onClick={() => toggleFlip(item.id)}>
                            <div className="absolute inset-0 bg-white border-2 border-blue-50 rounded-3xl shadow-sm flex items-center justify-center p-6 [backface-visibility:hidden]">
                              <h3 className="text-2xl font-bold text-gray-800 text-center">{item.word}</h3>
                            </div>
                            <div className={`absolute inset-0 ${cardColors[item.id] || 'bg-blue-600'} text-white rounded-3xl shadow-xl flex items-center justify-center p-8 [backface-visibility:hidden] [transform:rotateY(180deg)]`}>
                              <p className="text-lg text-center font-medium leading-relaxed">{item.definition}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex justify-between items-center px-2">
                            <button onClick={() => addToMyBook(item.id)} className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors">⭐ Add My Book</button>
                            {role === 'admin' && (
                              <div className="flex gap-3 text-lg cursor-pointer">
                                <span onClick={() => { setIsEditing(item.id); setEditValue({ word: item.word, def: item.definition }); }}>✏️</span>
                                <span onClick={() => handleDelete(item.id)}>🗑️</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}