export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-4">
      <h1 className="font-editorial text-3xl tracking-tight text-white sm:text-4xl md:text-5xl">
        {title}
      </h1>
      <p className="max-w-2xl text-sm leading-7 text-white/55">{subtitle}</p>
    </div>
  );
}
