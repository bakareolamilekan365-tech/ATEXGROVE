"use client";

import { useEffect, useRef, useState } from "react";

export function ScrollReveal({ children, className = "" }: Readonly<{ children: React.ReactNode; className?: string }>) {
  const element = useRef<HTMLDivElement>(null);
  const [observed, setObserved] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = element.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    setObserved(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.unobserve(entry.target);
      },
      { rootMargin: "0px 0px -8%", threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={element} className={`scroll-reveal ${observed ? "scroll-reveal--observed" : ""} ${visible ? "scroll-reveal--visible" : ""} ${className}`.trim()}>
      {children}
    </div>
  );
}
