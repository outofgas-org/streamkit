interface HeroProps {
  title: string;
  subtitle: string;
  description: string;
}

export function Hero({ title, subtitle, description }: HeroProps) {
  return (
    <div className="text-center space-y-4 py-12">
      <h1 className="text-7xl sm:text-8xl font-semibold tracking-tight text-gray-900">
        {title}
      </h1>

      <p className="text-3xl sm:text-4xl font-light text-gray-600 tracking-tight">
        {subtitle}
      </p>

      <p className="text-xl text-gray-500 max-w-2xl mx-auto pt-4">
        {description}
      </p>
    </div>
  );
}
