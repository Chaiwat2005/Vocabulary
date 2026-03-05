import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ถ้าไม่มีค่า ให้แจ้ง Error ที่อ่านง่ายขึ้น หรือหยุดการทำงานอย่างปลอดภัย
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables!");
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseKey || ''
)