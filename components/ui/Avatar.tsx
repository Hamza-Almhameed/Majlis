interface AvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: number;
  lastSeen?: string | null;
  showPresence?: boolean;
}
  
  export default function Avatar({ username, avatarUrl, size = 36, lastSeen, showPresence = false }: AvatarProps) {
    const firstLetter = username?.charAt(0) || "؟";
  
    const colors = [
      "#E63946", "#2A9D8F", "#E9C46A", "#F4A261",
      "#264653", "#6A4C93", "#1982C4", "#8AC926",
    ];
    const colorIndex = username?.charCodeAt(0) % colors.length || 0;
    const bgColor = colors[colorIndex];

    const isOnline = lastSeen
    ? (Date.now() - new Date(lastSeen).getTime()) < 3 * 60 * 1000
    : false;
  
    const avatar = avatarUrl ? (
      <img
        src={avatarUrl}
        alt={username}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    ) : (
      <div
        className="rounded-full flex items-center justify-center font-tajawal text-white select-none"
        style={{ width: size, height: size, backgroundColor: bgColor, fontSize: size * 0.45 }}
      >
        {firstLetter}
      </div>
    );

  if (!showPresence) return avatar;

  return (
    <div className="relative inline-block">
      {avatar}
      {isOnline && (
        <span
          className="absolute bottom-0 left-0 rounded-full bg-primary border-2 border-shade2"
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
}