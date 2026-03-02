interface PackageAvatarsProps {
  count: number;
}

export function PackageAvatars({ count }: PackageAvatarsProps) {
  const colors = [
    { from: "indigo-400", to: "indigo-600" },
    { from: "purple-400", to: "purple-600" },
    { from: "pink-400", to: "pink-600" },
  ];

  return (
    <div className="flex items-center justify-center gap-3">
      <div className="flex -space-x-2">
        {colors.slice(0, count).map((color) => (
          <div
            key={`${color.from}-${color.to}`}
            className={`w-8 h-8 rounded-full bg-gradient-to-br from-${color.from} to-${color.to} border-2 border-white shadow-md`}
          />
        ))}
      </div>
      <span className="text-sm text-gray-500 font-medium">
        {count} Powerful Packages
      </span>
    </div>
  );
}
