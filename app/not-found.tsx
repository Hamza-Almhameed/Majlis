import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bg-background min-h-screen flex flex-col items-center justify-center gap-6" dir="rtl">
      <h1 className="font-ashkal text-primary text-8xl select-none">مجلس</h1>
      <div className="flex flex-col items-center gap-2">
        <p className="text-white font-tajawal font-bold text-2xl">الصفحة غير موجودة</p>
        <p className="text-white/40 font-tajawal text-sm">الصفحة التي تبحث عنها غير موجودة أو تم حذفها</p>
      </div>
      <Link
        href="/"
        className="flex items-center gap-2 bg-primary text-background font-tajawal font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
      >
        العودة للرئيسية
      </Link>
    </main>
  );
}