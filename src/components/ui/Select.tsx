"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import styles from "./Select.module.css";

export type SelectOption = { value: string; label: string };

export function selectSubmittedValue(options: readonly SelectOption[], value: string) {
  return options.some((option) => option.value === value) ? value : "";
}

export function nextSelectIndex(current: number, key: string, count: number) {
  if (count === 0) return -1;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  if (key === "ArrowDown") return (current + 1 + count) % count;
  if (key === "ArrowUp") return (current - 1 + count) % count;
  return current;
}

export function findTypeaheadOption(options: readonly SelectOption[], query: string, from = -1) {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle || !options.length) return -1;
  for (let offset = 1; offset <= options.length; offset += 1) {
    const index = (from + offset) % options.length;
    if (options[index].label.toLocaleLowerCase().startsWith(needle)) return index;
  }
  return -1;
}

export function Select({
  id, name, label, options, value, onChange, disabled = false,
  describedBy, error, required = false, placeholder = "Choose an option",
}: Readonly<{
  id: string; name: string; label: string; options: readonly SelectOption[];
  value: string; onChange: (value: string) => void; disabled?: boolean;
  describedBy?: string; error?: boolean; required?: boolean; placeholder?: string;
}>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const typeaheadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listId = useId();
  const selectedIndex = options.findIndex((option) => option.value === value);
  const safeValue = selectSubmittedValue(options, value);

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  useEffect(() => () => { if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current); }, []);

  function keyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) { setOpen(true); setActive(selectedIndex >= 0 ? selectedIndex : 0); return; }
      setActive((current) => nextSelectIndex(current, event.key, options.length));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault(); setOpen(true); setActive(nextSelectIndex(active, event.key, options.length));
    } else if (event.key === "Enter" && open && active >= 0) {
      event.preventDefault(); onChange(options[active].value); setOpen(false); setQuery("");
    } else if (event.key === "Escape") {
      setOpen(false); setQuery("");
    } else if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      const nextQuery = query + event.key;
      setQuery(nextQuery);
      const match = findTypeaheadOption(options, nextQuery, active);
      if (match >= 0) { setOpen(true); setActive(match); }
      if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
      typeaheadTimer.current = setTimeout(() => setQuery(""), 700);
    }
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <span className={styles.srOnly} id={`${id}-label`}>{label}</span>
      <input type="hidden" name={name} value={safeValue} disabled={disabled} />
      <button
        id={id} type="button" className={`${styles.field} ${error ? styles.invalid : ""}`}
        role="combobox" aria-labelledby={`${id}-label`} aria-haspopup="listbox"
        aria-expanded={open} aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${listId}-option-${active}` : undefined}
        aria-describedby={describedBy} aria-invalid={error || undefined}
        aria-required={required || undefined} disabled={disabled} onKeyDown={keyDown}
        onClick={() => { setOpen((wasOpen) => !wasOpen); setActive(selectedIndex >= 0 ? selectedIndex : 0); }}
      >
        <span>{selectedIndex >= 0 ? options[selectedIndex].label : placeholder}</span><span aria-hidden="true">▾</span>
      </button>
      <div id={listId} className={styles.panel} role="listbox" aria-label={label} hidden={!open || disabled}>
        {options.map((option, index) => <div
          role="option" aria-selected={option.value === safeValue} tabIndex={-1}
          id={`${listId}-option-${index}`} key={option.value}
          className={`${styles.option} ${active === index ? styles.active : ""}`}
          onMouseEnter={() => setActive(index)} onClick={() => { onChange(option.value); setOpen(false); setQuery(""); }}
        ><span>{option.label}</span><span aria-hidden="true">{option.value === safeValue ? "✓" : ""}</span></div>)}
      </div>
    </div>
  );
}
