import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useT } from "../lib/i18n";
import { guide, useGuide } from "../lib/guideStore";
import type { ContextScope, Reading, ReadingKind } from "../lib/types";

interface Props {
  kind: ReadingKind;
  reading?: Reading;
  /** Builds the context for follow-ups, using the scope fixed for this conversation. */
  contextFor: (scope: ContextScope) => string;
}

/** The conversation for one kind: answers (live while streaming), notes, and the follow-up box. */
export default function ChatThread({ kind, reading, contextFor }: Props) {
  const { t, lang } = useT();
  const session = useGuide(kind);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // A follow-up that got no answer goes back into the input box.
  useEffect(() => {
    if (session?.retry) {
      setInput(session.retry);
      guide.clearRetry(kind);
    }
  }, [session?.retry, kind]);

  const pending = session?.pending ?? null;
  useEffect(() => {
    if (pending !== null) endRef.current?.scrollIntoView({ block: "nearest" });
  }, [pending]);

  const messages = session?.messages ?? [];
  const busy = pending !== null;
  const interrupted = !busy && reading && session?.readingId === reading.id && (reading.status === "streaming" || reading.status === "interrupted");

  const followUp = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || busy || !session) return;
    setInput("");
    void guide.send(kind, [...messages, { role: "user", content: q }], { lang, context: contextFor(session.contextScope) });
  };

  return (
    <>
      <div className="thread">
        {messages.slice(1).map((m, i) =>
          m.role === "assistant" ? (
            <article key={i} className="msg guide"><ReactMarkdown>{m.content}</ReactMarkdown></article>
          ) : (
            <p key={i} className="msg me"><span className="who">{t("you")}</span>{m.content}</p>
          ),
        )}
        {busy && (
          <article className="msg guide">
            {pending ? <ReactMarkdown>{pending}</ReactMarkdown> : <p className="shimmer">{t("thinking")}</p>}
          </article>
        )}
        {interrupted && <p className="hint">⚠️ {t("interruptedNote")}</p>}
        {session?.error && <p className="error">⚠️ {t("errorPrefix")}: {session.error}</p>}
        <div ref={endRef} />
      </div>

      {messages.length > 0 && (
        <form className="ask" onSubmit={followUp}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("askFollowUp")} disabled={busy} />
          <button className="primary" disabled={busy || !input.trim()}>{t("send")}</button>
        </form>
      )}
    </>
  );
}
