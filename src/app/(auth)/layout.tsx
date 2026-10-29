import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="auth-header"><Link className="site-brand" href="/" aria-label="Atexgrove home"><Image className="site-brand__mark" src="/logo/atexgrove-mark.svg" alt="" width={40} height={40} /><Image className="site-brand__wordmark" src="/logo/atexgrove-wordmark.svg" alt="Atexgrove" width={140} height={39} /></Link><Link className="auth-back" href="/">← Back to home</Link></header>
      <div className="auth-page">{children}</div>
    </>
  );
}
