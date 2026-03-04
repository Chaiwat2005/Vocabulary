"use client";
import React, { useState } from 'react';
import { supabase } from "@/lib/supabase"; // ใช้ตัวนี้แทน createClientComponentClient
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // 1. ตรวจสอบรหัสผ่านตรงกันไหม
    if (password !== confirmPassword) {
      setErrorMsg("รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
      setLoading(false);
      return;
    }

    // 2. ส่งข้อมูลสมัครสมาชิกไปที่ Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message); // แสดง Error ถ้าสมัครไม่สำเร็จ
      setLoading(false);
    } else {
      alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
      router.push('/login'); // ย้ายไปหน้า Login
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Create Account</h2>
        
        <form onSubmit={handleSignUp} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg border border-red-100">
              {errorMsg}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="example@gmail.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg transition duration-300 mt-4 disabled:bg-gray-400"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
        {/* เพิ่มส่วนนี้ลงไปครับ */}
<p className="text-center text-sm text-gray-500 mt-6">
  มีบัญชีอยู่แล้ว? 
  <Link href="/login" className="ml-1 text-blue-600 font-medium hover:underline">
    เข้าสู่ระบบที่นี่
  </Link>
</p>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}