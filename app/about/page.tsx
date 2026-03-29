import Link from "next/link";
import RightSidebar from "@/components/home/RightSidebar";
import LeftSidebar from "@/components/home/LeftSidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe, faShield, faUsers, faLock, faCode, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

export default function AboutPage() {
  return (
    <main className="bg-background min-h-screen p-3 sm:p-6 pb-24 lg:pb-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full mx-auto">
        <div className="w-full lg:w-72 lg:shrink-0"><LeftSidebar /></div>

        <div className="flex-1 flex flex-col gap-6" dir="rtl">

          
          <div className="bg-shade2 border border-border rounded-2xl p-8 flex flex-col gap-3 text-center items-center">
            <h1 className="font-ashkal text-primary text-6xl select-none">مجلس</h1>
            <p className="text-white/60 font-tajawal text-lg">منصة تواصل اجتماعي عربية قائمة على الخصوصية</p>
            <span className="text-white/30 font-tajawal text-xs bg-shade3 px-3 py-1 rounded-full">الإصدار 0.1.0 - نسخة تجريبية</span>
          </div>

          
          <div className="bg-shade2 border border-border rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-white font-tajawal font-bold text-xl">ما هو مجلس؟</h2>
            <p className="text-white/70 font-tajawal leading-loose text-right">
              مجلس هي منصة تواصل اجتماعي عربية مبنية على فكرة المجتمعات أو "المجالس"، مستوحاة من ثقافتنا العربية حيث كان المجلس مكاناً للحوار والنقاش والتبادل الفكري. تتيح المنصة للمستخدمين إنشاء مجالس متخصصة والانضمام إليها، ومشاركة الأفكار والنقاشات في بيئة آمنة تحترم خصوصيتك.
            </p>
          </div>

          
          <div className="bg-shade2 border border-border rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-white font-tajawal font-bold text-xl">قيمنا</h2>
            <div className="grid grid-cols-1 gap-4">
              {[
                {
                  icon: faLock,
                  title: "الخصوصية أولاً",
                  desc: "لا نطلب بريدًا أو رقم هاتف للتسجيل. اسم مستخدم وكلمة مرور فقط، لأن هويتك ملكك.",
                },
                {
                  icon: faUsers,
                  title: "الهوية العربية",
                  desc: "منصة مصممة للعرب، باللغة العربية، بمفاهيم مستوحاة من ثقافتنا وتراثنا.",
                },
                {
                  icon: faGlobe,
                  title: "مجتمع عربي موحد",
                  desc: "نجمع العرب من كل أنحاء العالم في مكان واحد، بغض النظر عن اللهجة أو البلد.",
                },
                {
                  icon: faShield,
                  title: "بيئة آمنة",
                  desc: "نؤمن بحق كل شخص في التعبير عن رأيه بحرية في بيئة محترمة وآمنة.",
                },
              ].map((value, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-shade3/40 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={value.icon} className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-white font-tajawal font-bold">{value.title}</h3>
                    <p className="text-white/60 font-tajawal text-sm leading-relaxed">{value.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          
          <div className="bg-shade2 border border-border rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-white font-tajawal font-bold text-xl">المطور</h2>
            <div className="flex items-center gap-4 p-4 bg-shade3/40 rounded-xl">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faCode} className="w-7 h-7 text-primary" />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <h3 className="text-white font-tajawal font-bold text-lg">حمزة المحاميد</h3>
                <p className="text-white/60 font-tajawal text-sm">Full Stack Developer</p>
                <Link
                  href="https://hamzamh.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary font-tajawal text-sm hover:underline mt-1 w-fit"
                >
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 h-3" />
                  hamzamh.netlify.app
                </Link>
              </div>
            </div>
          </div>


          <div className="bg-shade2 border border-border rounded-2xl p-6 flex flex-col gap-3">
            <h2 className="text-white font-tajawal font-bold text-xl">تواصل معنا</h2>
            <p className="text-white/60 font-tajawal text-sm leading-relaxed">
              إذا واجهت أي مشكلة أو لديك اقتراح أو تريد الإبلاغ عن محتوى مسيء، يمكنك التواصل معنا عبر موقع المطور.
            </p>
            <Link
              href="https://hamzamh.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-primary text-background font-tajawal font-bold px-5 py-2 rounded-xl w-fit hover:opacity-90 transition-opacity text-sm"
            >
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 h-3" />
              تواصل مع المطور
            </Link>
          </div>

        </div>

        <div className="w-full lg:w-72 lg:shrink-0"><RightSidebar /></div>
      </div>
    </main>
  );
}