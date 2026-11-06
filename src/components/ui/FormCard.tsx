export function FormCard({
  eyebrow,
  title,
  intro,
  children,
}: Readonly<{
  eyebrow?: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="form-card">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {intro ? <p className="muted">{intro}</p> : null}
      {children}
    </section>
  );
}
