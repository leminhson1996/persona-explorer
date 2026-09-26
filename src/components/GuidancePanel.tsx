import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useT } from "../lib/i18n";
import { describeCheckin, describeCosmos, describeDiary, describeProfile, describeRecent, describeSnapshot, type Snapshot } from "../lib/snapshot";
import { guide, useGuide } from "../lib/guideStore";
import { describeDharma } from "../lib/dharma";
import type { ChatMsg, CheckIn, CosmosData, DiaryEntry, Meditation, Profile, Reading, ReadingKind } from "../lib/types";

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

const DHARMA_REQUEST = {
  en: `Please look at my life today through the Buddha's teaching (about 450–600 words, Markdown), structured by the Four Noble Truths:
### 🪷 Seeing clearly (Dukkha): what is arising in me today
### 🔗 Its roots (Samudaya): the craving, aversion or confusion feeding it, and its conditions
### 🌤 What can cease (Nirodha): impermanence, and what is already well
### 🛤 The path today (Magga): one or two factors of the Noble Eightfold Path and one pāramitā, made concrete for my day
### 🧘 Practice: one specific practice with clear steps
### 🙏 A reminder to carry`,
  vi: `Hãy soi chiếu cuộc sống hôm nay của mình qua lời Phật dạy (khoảng 450–600 chữ, Markdown), theo cấu trúc Tứ Diệu Đế:
### 🪷 Nhìn rõ (Khổ đế): điều gì đang khởi lên trong mình hôm nay
### 🔗 Gốc rễ (Tập đế): tham, sân hay si nào đang nuôi dưỡng nó, và các duyên của nó
### 🌤 Điều có thể chấm dứt (Diệt đế): vô thường, và những điều đang tốt đẹp sẵn có
### 🛤 Con đường hôm nay (Đạo đế): một hai chi của Bát Chánh Đạo và một hạnh Ba-la-mật, cụ thể cho ngày của mình
### 🧘 Thực tập: một pháp thực tập cụ thể, có các bước rõ ràng
### 🙏 Một lời nhắc mang theo`,
};

const LABELS = {
  daily: { title: "guidanceTitle", intro: "guidanceIntro", button: "receive" },
  chart: { title: "chartReadingTitle", intro: "chartReadingIntro", button: "receiveChart" },
  dharma: { title: "dharmaReadingTitle", intro: "dharmaReadingIntro", button: "receiveDharma" },
} as const;

interface Props {
  kind?: ReadingKind;
  diary: DiaryEntry[];
  meditations: Meditation[];
  profile: Profile;
  snapshot: Snapshot;
  cosmos: CosmosData | null | undefined;
  checkin?: CheckIn;
  recent: CheckIn[];
  reading?: Reading;
  today: string;
}

export default function GuidancePanel({ kind = "daily", diary, meditations, profile, snapshot, cosmos, checkin, recent, reading, today }: Props) {
  const { t, lang } = useT();
  const session = useGuide(kind);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const scope = kind === "chart" ? "chart" : today;

  // Attach to (or create) this kind's conversation. It lives outside the component, so it
  // survives tab switches; a new day starts a new daily/dharma conversation.
  useEffect(() => {
    guide.ensure(kind, scope, today, reading);
  }, [kind, scope, today, reading]);

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

  const buildContext = () =>
    [describeProfile(profile), describeSnapshot(snapshot), describeCosmos(cosmos ?? null), describeRecent(recent), describeDiary(diary, today), describeDharma(snapshot.now, checkin, meditations)]
      .filter(Boolean)
      .join("\n\n");

  const send = (history: ChatMsg[]) => void guide.send(kind, history, { lang, context: buildContext() });

  const requestReading = () => {
    guide.restart(kind, today);
    if (kind === "chart") {
      send([{ role: "user", content: CHART_REQUEST[lang] }]);
      return;
    }
    if (kind === "dharma") {
      send([{ role: "user", content: `${DHARMA_REQUEST[lang]}\n\nMy check-in today:\n${describeCheckin(checkin)}` }]);
      return;
    }
    const ask = lang === "vi" ? "Hãy cho mình lời luận giải hôm nay." : "Please give me today's reading.";
    send([{ role: "user", content: `${ask}\n\nMy check-in today:\n${describeCheckin(checkin)}` }]);
  };

  const followUp = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    send([...messages, { role: "user", content: q }]);
  };

  const visible = messages.slice(1);

  return (
    <section className="card guidance">
      <div className="guidance-head">
        <div>
          <h2>{kind === "dharma" ? "☸" : "✦"} {t(LABELS[kind].title)}</h2>
          <p className="muted small">{t(LABELS[kind].intro)}</p>
        </div>
        {busy ? (
          <button className="ghost" onClick={() => guide.stop(kind)}>■ {t("stop")}</button>
        ) : (
          <button className="primary" onClick={requestReading}>{messages.length ? t("regenerate") : t(LABELS[kind].button)}</button>
        )}
      </div>
      {kind !== "chart" && !checkin && !messages.length && <p className="hint">💡 {t("checkinFirst")}</p>}

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
    </section>
  );
}
