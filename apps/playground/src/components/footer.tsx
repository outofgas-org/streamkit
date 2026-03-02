interface FooterProps {
  technologies: string[];
}

export function Footer({ technologies }: FooterProps) {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-gray-500">
        Built with {technologies.join(" · ")}
      </p>
    </div>
  );
}
