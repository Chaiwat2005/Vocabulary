"use client";
import { useState, useEffect } from "react"; // เพิ่ม useEffect
import { supabase } from "@/lib/supabase"; // นำเข้า supabase
import { useRouter } from "next/navigation"; // นำเข้า useRouter

export default function AddWord() {
  const [word, setWord] = useState("");
  const [definition, setDef] = useState("");
  const [user, setUser] = useState<any>(null); // สร้างตัวแปรเก็บข้อมูล User
  const router = useRouter();

  // ดึงข้อมูล User ที่ Login อยู่มาใช้
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนเพิ่มคำศัพท์ครับ");
      return;
    }

    const { error } = await supabase
      .from('vocabulary')
      .insert([
        { 
          word, 
          definition, 
          user_id: user.id, // ตอนนี้ user.id จะมีค่าแล้ว
          is_approved: false // ส่งไปรอที่หน้า Admin
        }
      ]);

    if (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } else {
      alert("ส่งคำศัพท์สำเร็จ! รอ Admin ตรวจสอบครับ");
      router.push('/');
    }
  };

  return (
    <div className="p-10 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 placeholder:text-gray-500">เพิ่มคำศัพท์ใหม่</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="text" 
          placeholder="คำศัพท์ (Word)" 
          className="w-full border p-3 rounded-xl text-gray-900 placeholder:text-gray-500"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          required
        />
        <textarea 
          placeholder="คำแปล (Definition)" 
          className="w-full border p-3 rounded-xl text-gray-900 placeholder:text-gray-500"
          value={definition}
          onChange={(e) => setDef(e.target.value)}
          required
        />
        <button type="submit" className="w-full bg-orange-500 text-white p-3 rounded-xl font-bold shadow-md hover:bg-orange-600 transition-all">
          ส่งคำศัพท์
        </button>
      </form>
    </div>
  );
}