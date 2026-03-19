// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAt } from "@fortawesome/free-solid-svg-icons";
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    async function handleLogin() {
        setError("");
        setLoading(true);
    
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
    
        const data = await res.json();
        setLoading(false);
    
        if (!res.ok) {
          setError(data.error);
          return;
        }
    
        router.push("/");
      }



  return (
    <main className="bg-background min-h-screen flex flex-col items-center justify-center gap-8">
      
      {/* اللوغو */}
      <h1 className="font-ashkal text-primary text-6xl select-none">مجلس</h1>

      {/* الفورم */}
      <div className="flex flex-col gap-3 w-80">

        {/* رسالة الخطأ */}
        {error && (
          <p className="text-red-400 text-sm text-center font-tajawal bg-red-400/10 py-2 px-4 rounded-lg">
            {error}
          </p>
        )}
        
        {/* اسم المستخدم */}
        <div className="bg-shade2 border border-border rounded-lg px-4 py-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faAt} className="text-white/40 w-5 h-5" />
            <input
            type="text"
            placeholder="اسم المستخدم او البريد الالكتروني"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-transparent text-white placeholder-white/40 text-right outline-none w-full font-tajawal"
            />
        </div>
        

        {/* كلمة المرور */}
        <div className="bg-shade2 border border-border rounded-lg px-4 py-3 flex items-center gap-2">
          <button onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? (
              <FontAwesomeIcon icon={faEye} className="text-white/40 w-5 h-5" />
            ) : (
              <FontAwesomeIcon icon={faEyeSlash} className="text-white/40 w-5 h-5" />
            )}
          </button>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-transparent text-white placeholder-white/40 text-right outline-none w-full font-tajawal"
          />
        </div>

        {/* زر تسجيل الدخول */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-primary text-background font-tajawal font-bold text-xl rounded-lg py-3 w-full mt-1 disabled:opacity-50"
        >
          {loading ? "جاري الدخول..." : "تسجيل الدخول"}
        </button>
        
        {/* رابط تسجيل الدخول */}
        <p className="text-white/40 text-center text-sm font-tajawal">
          أو يمكنك{" "}
          <Link href="/register" className="text-primary">
            انشاء حساب جديد
          </Link>
        </p>
      </div>

      {/* نص الخصوصية */}
      <p className="text-white/20 text-xs text-center font-tajawal absolute bottom-6">
        من خلال تسجيل دخولك فإنك توافق على{" "}
        <Link href="/privacy" className="text-white/40">
          سياسة الخصوصية والشروط والأحكام
        </Link>
      </p>
    </main>
  );
}
