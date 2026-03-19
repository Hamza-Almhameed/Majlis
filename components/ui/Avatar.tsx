interface AvatarProps {
    username: string;
    avatarUrl?: string | null;
    size?: number;
  }
  
  export default function Avatar({ username, avatarUrl, size = 36 }: AvatarProps) {
    const firstLetter = username?.charAt(0) || "؟";
  
    // توليد لون ثابت بناءً على اسم المستخدم
    const colors = [
      "#E63946", "#2A9D8F", "#E9C46A", "#F4A261",
      "#264653", "#6A4C93", "#1982C4", "#8AC926",
    ];
    const colorIndex = username?.charCodeAt(0) % colors.length || 0;
    const bgColor = colors[colorIndex];
  
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt={username}
          width={size}
          height={size}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      );
    }
  
    return (
      <div
        className="rounded-full flex items-center justify-center font-tajawal text-white select-none"
        style={{ width: size, height: size, backgroundColor: bgColor, fontSize: size * 0.45 }}
      >
        {firstLetter}
      </div>
    );
  }