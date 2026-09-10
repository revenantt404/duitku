// Penanda alur sesi Supabase asli (login Google / email-password).
// Dipakai untuk membersihkan flag demo basi ("duitku_demo_user") yang bisa
// mengunci hook data ke mode demo sementara API memakai sesi asli —
// salah satu pemicu skeleton infinite pasca login.
export const SESSION_FLAG = "duitku_session_flow";
