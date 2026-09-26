import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useT } from "../lib/i18n";
import { describeCheckin, describeCosmos, describeDiary, describeProfile, describeRecent, describeSnapshot, type Snapshot } from "../lib/snapshot";
import { uid } from "../lib/storage";
import type { ChatMsg, CheckIn, CosmosData, DiaryEntry, Profile, Reading } from "../lib/types";

const CHART_REQUEST = {
  en: `Please give me a deep reading of my Tử Vi and Bát Tự charts together (about 700–900 words, Markdown), with these sections:
### 🌟 Core nature (Mệnh palace, Day Master)
### 💪 Gifts and life lessons
### 💼 Career and money (Quan Lộc, Tài Bạch, wealth/officer stars)
### ❤️ Love and relationships (Phu Thê, relevant ten gods)
### ⏳ The period I'm in now (current đại hạn, đại vận, this year)
### 🌱 How to grow (elements to nourish, habits, a practice)`,
  vi: `Hãy luận giải sâu lá số Tử Vi và Bát Tự của mình (khoảng 700–900 chữ, Markdown), gồm các phần:
### 🌟 Bản chất cốt lõi (cung Mệnh, Nhật chủ)
### 💪 Thiên phú và bài học cuộc đời
### 💼 Sự nghiệp và tài chính (Quan Lộc, Tài Bạch, sao tài/quan)
### ❤️ Tình cảm và các mối quan hệ (Phu Thê, thập thần liên quan)
### ⏳ Giai đoạn hiện tại (đại hạn, đại vận, lưu niên năm nay)
### 🌱 Hướng phát triển (ngũ hành nên bồi bổ, thói quen, một thực hành)`,
};

interface Props {
  kind?: "daily" | "chart";
  diary: DiaryEntry[];
  profile: Profile;
  snapshot: Snapshot;
  cosmos: CosmosData | null | undefined;
  checkin?: CheckIn;
  recent: CheckIn[];
  reading?: Reading;
  today: string;
  onSave: (r: Reading) => void;
}

export default function GuidancePanel({ kind = "daily", diary, profile, snapshot, cosmos, checkin, recent, reading, today, onSave }: Props) {
  const { t, lang } = useT();
  const [messages, setMessages] = useState<ChatMsg[]>(reading?.messages ?? []);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const readingId = useRef(reading?.id ?? uid());
  const endRef = useRef<HTMLDivElement>(null);

  // A new day brings a new reading.
  useEffect(() => {
    setMessages(reading?.messages ?? []);
    readingId.current = reading?.id ?? uid();
  }, [today]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (pending !== null) endRef.current?.scrollIntoView({ block: "nearest" });
  }, [pending]);

  const buildContext = () =>
    [describeProfile(profile), describeSnapshot(snapshot), describeCosmos(cosmos ?? null), describeRecent(recent), describeDiary(diary, today)]
      .filter(Boolean)
      .join("\n\n");

  async function send(history: ChatMsg[]) {
    setError(null);
    setPending("");
    setMessages(history);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let text = "";
    try {
      const res = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, context: buildContext(), messages: history }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setPending(text);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError((err as Error).message);
    } finally {
      abortRef.current = null;
      setPending(null);
      if (text.trim()) {
        const next = [...history, { role: "assistant" as const, content: text }];
        setMessages(next);
        onSave({ id: readingId.current, date: today, kind, createdAt: reading?.createdAt ?? new Date().toISOString(), messages: next });
      } else {
        // Nothing came back: roll back the unanswered message so it can be retried.
        setMessages(history.slice(0, -1));
        if (history.length > 1) setInput(history[history.length - 1].content);
      }
    }
  }

  const requestReading = () => {
    readingId.current = uid();
    if (kind === "chart") {
      send([{ role: "user", content: CHART_REQUEST[lang] }]);
      return;
    }
    const ask = lang === "vi" ? "Hãy cho mình lời luận giải hôm nay." : "Please give me today's reading.";
    send([{ role: "user", content: `${ask}\n\nMy check-in today:\n${describeCheckin(checkin)}` }]);
  };

  const followUp = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || pending !== null) return;
    setInput("");
    send([...messages, { role: "user", content: q }]);
  };

  const visible = messages.slice(1);
  const busy = pending !== null;

  return (
    <section className="card guidance">
      <div className="guidance-head">
        <div>
          <h2>✦ {t(kind === "chart" ? "chartReadingTitle" : "guidanceTitle")}</h2>
          <p className="muted small">{t(kind === "chart" ? "chartReadingIntro" : "guidanceIntro")}</p>
        </div>
        {busy ? (
          <button className="ghost" onClick={() => abortRef.current?.abort()}>■ {t("stop")}</button>
        ) : (
          <button className="primary" onClick={requestReading}>{messages.length ? t("regenerate") : t(kind === "chart" ? "receiveChart" : "receive")}</button>
        )}
      </div>
      {kind === "daily" && !checkin && !messages.length && <p className="hint">💡 {t("checkinFirst")}</p>}

      <div className="thread">
        {visible.map((m, i) =>
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
        {error && <p className="error">⚠️ {t("errorPrefix")}: {error}</p>}
        <div ref={endRef} />
      </div>

      {messages.length > 0 && (
        <form className="ask" onSubmit={followUp}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("askFollowUp")} disabled={busy} />
          <button className="primary" disabled={busy || !input.trim()}>{t("send")}</button>
        </form>
      )}
    </section>
  );
}
