interface AvatarProps {
  photoURL?: string;
  name: string;
  size?: number;
  className?: string;
}

/** プロフィール画像。読み込めない場合はイニシャルを表示。 */
export default function Avatar({ photoURL, name, size = 40, className = "" }: AvatarProps) {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-accent-500 to-violet-400 font-semibold text-white ring-1 ring-white/10 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {photoURL ? (
        <img
          src={photoURL}
          alt={name}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
