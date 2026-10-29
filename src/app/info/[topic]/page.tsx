import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";

const topics: Record<string, string> = { about: "About Atexgrove", contact: "Contact", privacy: "Privacy Policy", terms: "Terms of Service", cookies: "Cookie information" };

export default async function InformationPage({ params }: Readonly<{ params: Promise<{ topic: string }> }>) {
  const { topic } = await params;
  const title = topics[topic];
  if (!title) notFound();
  return <><SiteHeader state="signed-out" /><main className="page-container page-main"><section className="content-card information-card"><p className="eyebrow">Under construction</p><h1>{title}</h1><p>This page is not published yet. No legal policy or official contact details are available from this page. The current preview uses fictional or redacted information only.</p><Link className="button button--secondary" href="/">Back to home</Link></section></main></>;
}
