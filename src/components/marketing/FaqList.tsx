"use client";

import { useState } from "react";

const items = [
  {
    question: "Does Atexgrove certify land ownership?",
    answer: "No. Atexgrove coordinates a review workflow and records what was supplied, reviewed and left unresolved. It is not a government registry or statutory authority.",
  },
  {
    question: "What should I upload in the prototype?",
    answer: "Use synthetic or properly redacted demonstration files only. Do not upload real land documents or sensitive personal information.",
  },
  {
    question: "Can staff see a document as soon as I add it?",
    answer: "No. A saved file remains private until you explicitly submit the request or send a requested reply.",
  },
  {
    question: "What do the case statuses mean?",
    answer: "They describe the workflow position, such as received, assigned, in review or waiting for your information. A status is not a legal conclusion and does not mean the land or evidence is verified.",
  },
  {
    question: "Does the current preview generate a Land & Development Report?",
    answer: "No. Report generation is planned for a later phase. The current preview demonstrates request intake, private evidence and a controlled staff workflow.",
  },
  {
    question: "How do I access an account?",
    answer: "Existing approved users sign in with email and password. Public registration appears only when it is enabled; invitation-only access must also be enforced by the authentication service, not just hidden in the interface.",
  },
];

export function FaqList() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="faq-list">
      {items.map((item, index) => {
        const expanded = open === index;
        return (
          <section className="faq-item" key={item.question}>
            <h3>
              <button type="button" aria-expanded={expanded} aria-controls={`faq-answer-${index}`} onClick={() => setOpen(expanded ? null : index)}>
                <span>{item.question}</span><span aria-hidden="true">{expanded ? "−" : "+"}</span>
              </button>
            </h3>
            <div id={`faq-answer-${index}`} hidden={!expanded}><p>{item.answer}</p></div>
          </section>
        );
      })}
    </div>
  );
}
