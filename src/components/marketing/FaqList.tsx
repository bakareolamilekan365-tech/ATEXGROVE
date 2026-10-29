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
  { question: "When can staff see my documents?", answer: "Your saved draft is private. After you submit a request or a requested reply, authorized staff can review the submitted evidence. Saved replacements remain private until you submit them." },
  { question: "Can I correct a document later?", answer: "You can add a replacement version while your request is still a draft or when staff request more information. Earlier versions stay in the case history." },
  { question: "Can I cancel a request?", answer: "You can discard an unsubmitted draft or cancel an open submitted request. The case and evidence are retained until a separate retention and deletion policy is approved." },
  { question: "Which locations are supported?", answer: "The prototype is limited to the six FCT area councils. Its starter area list is a guide, not an official geographic register." },
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
