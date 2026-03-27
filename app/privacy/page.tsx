import RightSidebar from "@/components/home/RightSidebar";
import LeftSidebar from "@/components/home/LeftSidebar";

export default function PrivacyPage() {
  const sections = [
    {
      title: "ما المعلومات التي نجمعها؟",
      content: `نجمع فقط المعلومات الضرورية لتشغيل المنصة. عند التسجيل نطلب اسم مستخدم وكلمة مرور فقط. البريد الإلكتروني اختياري ويُستخدم فقط لاسترداد الحساب. لا نطلب اسمك الحقيقي أو رقم هاتفك أو أي معلومات شخصية أخرى.`,
    },
    {
      title: "كيف نستخدم معلوماتك؟",
      content: `المعلومات التي نجمعها تُستخدم فقط لتشغيل المنصة وتحسين تجربتك. لا نبيع بياناتك لأي طرف ثالث، ولا نستخدمها للإعلانات المستهدفة. كلمة مرورك مشفرة ولا يمكن لأحد الاطلاع عليها بما فيهم فريق مجلس.`,
    },
    {
      title: "المحتوى الذي تنشره",
      content: `المنشورات العامة مرئية لجميع مستخدمي المنصة. المنشورات داخل المجالس مرئية لأعضاء المجلس فقط. المنشورات المؤقتة تُحذف تلقائياً بعد 3 أيام. يحق لك حذف أي محتوى نشرته في أي وقت.`,
    },
    {
      title: "ملفات تعريف الارتباط (Cookies)",
      content: `نستخدم ملفات تعريف الارتباط فقط لإبقائك مسجلاً دخولك إلى المنصة. لا نستخدم أي ملفات تتبع أو تحليل سلوكي.`,
    },
    {
      title: "حقوقك",
      content: `يحق لك في أي وقت تعديل بياناتك الشخصية، حذف حسابك وجميع بياناتك نهائياً، تصفح المنصة بشكل مجهول بدون ربط إيميل، وطلب أي معلومات تتعلق ببياناتك المحفوظة.`,
    },
    {
      title: "أمان البيانات",
      content: `نحرص على حماية بياناتك باستخدام أفضل ممارسات الأمان. كلمات المرور مشفرة باستخدام خوارزمية bcrypt. الاتصالات مشفرة عبر HTTPS. نستخدم Supabase كقاعدة بيانات موثوقة وآمنة.`,
    },
    {
      title: "التغييرات على هذه السياسة",
      content: `قد نحدث سياسة الخصوصية من وقت لآخر. سيتم إشعارك بأي تغييرات جوهرية عبر المنصة. استمرارك في استخدام مجلس بعد التغييرات يعني موافقتك عليها.`,
    },
    {
      title: "تواصل معنا",
      content: `إذا كان لديك أي أسئلة حول سياسة الخصوصية يمكنك التواصل معنا عبر موقع المطور على الرابط: hamzamh.netlify.app`,
    },
  ];

  return (
    <main className="bg-background min-h-screen p-6">
      <div className="flex gap-6 w-full mx-auto">

        <div className="flex-1 flex flex-col gap-4" dir="rtl">


          <div className="bg-shade2 border border-border rounded-2xl p-6 flex flex-col gap-2">
            <h1 className="text-white font-tajawal font-bold text-2xl">سياسة الخصوصية والشروط</h1>
            <p className="text-white/40 font-tajawal text-sm">آخر تحديث: مارس 2026</p>
            <p className="text-white/60 font-tajawal text-sm leading-relaxed mt-2">
              في مجلس، نؤمن بأن الخصوصية حق أساسي لكل إنسان. هذه السياسة توضح كيف نتعامل مع بياناتك بشفافية كاملة.
            </p>
          </div>


          <div className="bg-shade2 border border-border rounded-2xl overflow-hidden">
            {sections.map((section, i) => (
              <div key={i}>
                <div className="p-5 flex flex-col gap-2">
                  <h2 className="text-white font-tajawal font-bold flex items-center gap-2">
                    <span className="text-primary font-ashkal text-lg">{i + 1}.</span>
                    {section.title}
                  </h2>
                  <p className="text-white/60 font-tajawal text-sm leading-loose">{section.content}</p>
                </div>
                {i < sections.length - 1 && <div className="border-t border-border mx-5" />}
              </div>
            ))}
          </div>

        </div>
      </div>
    </main>
  );
}