import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { FaqList } from "@/components/marketing/FaqList";
import { publicRegistrationEnabled } from "@/lib/config/private-preview";

export default function HomePage() {
  const registrationEnabled = publicRegistrationEnabled();
  const preview = !registrationEnabled;
  return (
    <>
      <SiteHeader state="signed-out" registrationEnabled={registrationEnabled} current="home" />
      <main>
        <section className="page-container landing-hero">
          <div>
            <span className="status-tag status-tag--demo">{preview ? "Abuja/FCT private preview" : "Abuja/FCT workflow prototype"}</span>
            <h1>A clearer first step for land decisions in Abuja.</h1>
            <p className="landing-hero__lead">Atexgrove gives customers a structured place to describe an Abuja/FCT site, save private documents and follow a recorded review. The current service is a limited verification workflow, not a title certificate or government approval.</p>
            <div className="landing-actions">
              <Link className="button button--primary" href="/login">Log in</Link>
              {registrationEnabled ? <Link className="button button--secondary" href="/register">Start a request</Link> : null}
              <Link className="button button--secondary" href="#how-it-works">How it works</Link>
            </div>
          </div>
          <div className="landing-visual">
            <Image src="/images/atexgrove-built-environment-hero.png" alt="Architectural plans, survey equipment and a building under construction" width={1792} height={896} priority sizes="(max-width: 960px) 100vw, 46vw" />
            <div className="account-access">
              <div><p className="eyebrow">Account access</p><h2>{preview ? "Invitation-only preview" : "Continue to Atexgrove"}</h2></div>
              <p className="muted">{preview ? "Registration is restricted to approved accounts. Hiding registration in the interface is not the security control; preview access must also be enforced in Supabase." : "Choose the account action that applies to you."}</p>
              <div className="account-access__actions">
                <Link className="button button--primary" href="/login">Sign in</Link>
                {registrationEnabled ? <Link className="button button--secondary" href="/register">Create account</Link> : null}
              </div>
            </div>
          </div>
        </section>
        <section className="landing-section landing-section--surface" id="how-it-works">
          <div className="page-container">
            <div className="section-heading"><p className="eyebrow">How it works</p><h2>A controlled, traceable review journey</h2><p className="muted">The {preview ? "private preview" : "prototype"} demonstrates the request, evidence and staff-review workflow. It does not issue a legal or statutory verification result.</p></div>
            <div className="feature-grid">
              <article className="feature-card"><span className="feature-card__number">1</span><h3>Start and review a request</h3><p>Describe the Abuja/FCT site, your purpose and your relationship to the land. The request starts as a private draft so you can check the details before submission.</p></article>
              <article className="feature-card"><span className="feature-card__number">2</span><h3>Add private evidence deliberately</h3><p>Use synthetic or properly redacted PDF, JPG or PNG files. Saved evidence stays private from staff until you explicitly submit the request or a requested reply.</p></article>
              <article className="feature-card"><span className="feature-card__number">3</span><h3>Follow the recorded review</h3><p>Customer-safe milestones explain whether a case is received, assigned, in review or waiting for you. Internal staff notes and identities remain in the restricted workspace.</p></article>
            </div>
            <div className="landing-image-strip"><Image src="/images/atexgrove-built-environment-triptych.png" alt="Illustrative architectural plans, survey equipment and a building under construction" width={1536} height={512} sizes="(max-width: 960px) 100vw, 1200px" /></div>
          </div>
        </section>
        <section className="landing-section landing-section--photo"><div className="page-container">
          <div className="boundary-grid">
            <article className="content-card"><p className="eyebrow">What a future report records</p><h2>Sources, review and limitations</h2><ul className="boundary-list"><li>What information and document versions were considered.</li><li>Who reviewed a matter and at what authority level.</li><li>What remained unresolved or required an official source.</li></ul></article>
            <article className="content-card boundary-card--note"><p className="eyebrow">Important boundary</p><h2>What Atexgrove does not confirm</h2><p>Atexgrove is not a government registry and does not confer title, certify a cadastral boundary or replace advice from a qualified professional or official authority.</p><p className="muted">Report generation is not part of the current preview.</p></article>
          </div>
        </div></section>
        <section className="page-container landing-section"><div className="section-heading"><p className="eyebrow">Built for careful decisions</p><h2>Know what has been submitted and what still needs review</h2><p className="muted">A case keeps the customer request, document versions and customer-safe updates together. Staff work within their assigned scope. A submitted document stays labelled as customer supplied until a separate review records a conclusion.</p></div><div className="landing-actions"><Link className="button button--primary" href="/login">Sign in to your case</Link><Link className="button button--secondary" href="#help">Read common questions</Link></div></section>
        <section className="landing-section landing-section--surface" id="help"><div className="page-container"><div className="section-heading"><p className="eyebrow">Help</p><h2>Frequently asked questions</h2></div><FaqList /></div></section>
        <section className="page-container landing-section" id="contact">
          <div className="content-card boundary-card--note">
            <p className="eyebrow">Contact</p>
            <h2>Company contact details are awaiting confirmation</h2>
            <p>We will publish the approved company email, telephone number, address and support availability here before real use. No unconfirmed contact detail is presented by this prototype.</p>
          </div>
        </section>
      </main>
      <footer className="site-footer"><div className="page-container site-footer__grid"><div><strong>Atexgrove</strong><p>Atexgrove {preview ? "private preview" : "prototype"} · Demonstration data only<br />Not government certification</p></div><nav aria-label="Footer information"><Link href="/info/about">About Atexgrove</Link><Link href="/info/contact">Contact</Link><Link href="/info/privacy">Privacy Policy</Link><Link href="/info/terms">Terms of Service</Link><Link href="/info/cookies">Cookie information</Link></nav></div></footer>
    </>
  );
}
