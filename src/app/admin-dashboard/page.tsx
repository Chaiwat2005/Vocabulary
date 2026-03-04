"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // เรียกใช้ supabase client ที่เราตั้งค่าไว้
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. ตึงข้อมูลคำศัพท์ที่ is_approved เป็น false
  useEffect(() => {
    const fetchPendingVocab = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('vocabulary')
        .select('*')
        .eq('is_approved', false) // ดึงเฉพาะตัวที่ยังไม่ได้ Approve
        .order('created_at', { ascending: false });

      if (data) setPendingList(data);
      setLoading(false);
    };

    fetchPendingVocab();
  }, []);

  // 2. ฟังก์ชันสำหรับกดอนุมัติ (Approve)
  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('vocabulary')
      .update({ is_approved: true }) // เปลี่ยนสถานะเป็น true
      .eq('id', id);

    if (!error) {
      alert("อนุมัติคำศัพท์เรียบร้อย!");
      // อัปเดต UI โดยลบแถวที่อนุมัติแล้วออก
      setPendingList(pendingList.filter(item => item.id !== id));
    }
  };

  // 3. ฟังก์ชันสำหรับลบ/ปฏิเสธ (Delete)
  const handleDelete = async (id: string) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบคำศัพท์นี้?")) {
      const { error } = await supabase
        .from('vocabulary')
        .delete()
        .eq('id', id);

      if (!error) {
        setPendingList(pendingList.filter(item => item.id !== id));
      }
    }
  };

  if (loading) return <div className="p-10 text-center">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-red-600">Admin Dashboard: รอการอนุมัติ</h1>
      
      {pendingList.length === 0 ? (
        <p className="text-gray-500 italic">ไม่มีคำศัพท์ที่รอการอนุมัติในขณะนี้</p>
      ) : (
        <div className="grid gap-4">
          {pendingList.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-blue-600">{item.word}</h3>
                <p className="text-gray-600">{item.definition}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleApprove(item.id)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}