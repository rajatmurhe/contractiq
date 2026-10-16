import type { ReactNode } from "react";
import "./legal.css";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const contact = process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL;
  return (
    <div className="legal-page">
      <header><a href="/" aria-label="contractIQ home">contractIQ</a><a href="/">Back to product</a></header>
      <main>
        <p className="legal-date">Last updated: 16 October 2026</p>
        <h1>{title}</h1>
        {!contact && <aside role="note">Pre-launch draft. The operator must confirm a private contact channel and the final service details before launch.</aside>}
        {children}
        <section id="contact">
          <h2>Contact the operator</h2>
          <p>contractIQ is operated by Rajat Murhe.</p>
          {contact ? <p>For privacy requests or service questions, email <a href={`mailto:${contact}`}>{contact}</a>. Include enough information to identify your review, but do not send passwords, API keys, or the full contract in an initial request.</p>
            : <p>A private contact address has not been configured. This is a launch blocker. Do not post contracts or personal information in public GitHub issues.</p>}
        </section>
      </main>
      <footer><a href="/privacy/">Privacy policy</a><a href="/terms/">Terms and conditions</a></footer>
    </div>
  );
}
