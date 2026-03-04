"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        setRole(profile?.role || 'user');
      }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setRole(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4">
        
        {/* แก้ไขส่วนที่ Error ตรงนี้ครับ */}
        {pathname !== "/" && pathname !== "/login" ? (
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center text-gray-600"
            title="Go Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
        ) : null}

        <Link href="/" className="text-xl font-bold text-blue-600 flex items-center gap-2">
          <span className="text-2xl">🗂️</span> 
          <span className="hidden sm:inline">VocabFlash</span>
        </Link>
        
        {user && (
          <div className="hidden md:flex gap-6 ml-4 text-sm font-medium text-gray-500">
            <Link href="/" className={`hover:text-blue-600 ${pathname === '/' ? 'text-blue-600 font-bold' : ''}`}>Library</Link>
            <Link href="/my-book" className={`hover:text-blue-600 ${pathname === '/my-book' ? 'text-blue-600 font-bold' : ''}`}>My Book</Link>
            {role === 'admin' && (
              <Link href="/admin-dashboard" className="text-red-500 hover:text-red-700 font-bold underline decoration-dotted">Admin Panel</Link>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            {/* --- เพิ่มบรรทัดด้านล่างนี้เพื่อแสดง Email --- */}
            <span className="hidden lg:block text-sm font-medium text-gray-600 mr-2">
              {user.email}
            </span>

            <Link href="/add" className="hidden sm:block bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all">
              + Suggest
            </Link>
            <button 
              onClick={handleLogout}
              className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          pathname !== "/login" && (
            <Link href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-blue-700">
              Login
            </Link>
          )
        )}
      </div>
    </nav>
  );
}