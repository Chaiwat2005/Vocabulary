"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        alert("Login failed: " + error.message);
    } else {
        // เช็ค Role จากตาราง profiles ที่เราสร้างไว้ใน Supabase
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

        if (profile?.role === 'admin') {
            router.push('/admin-dashboard');
        } else {
            router.push('/');
        }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={handleLogin} className="p-8 border rounded-lg shadow-md w-80">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <input type="email" placeholder="Email" className="border p-2 w-full mb-2" 
               onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" className="border p-2 w-full mb-4" 
               onChange={(e) => setPassword(e.target.value)} />
        <button className="bg-blue-500 text-white w-full py-2 rounded">Sign In</button>

        {/* 2. เพิ่มโค้ดส่วนนี้ลงไปใต้ปุ่มครับ */}
  <div className="mt-6 text-center">
    <p className="text-sm text-gray-500">
      ยังไม่มีบัญชีใช่ไหม? 
      <Link href="/signup" className="ml-1 text-blue-600 font-bold hover:underline">
        สมัครสมาชิกที่นี่
      </Link>
    </p>
  </div>
      </form>
    </div>
  );
}