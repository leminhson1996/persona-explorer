import { useEffect, useState } from "react";
import { useT } from "../lib/i18n";
import { describeCheckin, describeCosmos, describeDiary, describeNatalCharts, describeProfile, describeRecent, describeSnapshot, type Snapshot } from "../lib/snapshot";
import { guide, useGuide } from "../lib/guideStore";
import ChatThread from "./ChatThread";
import { describeDharma } from "../lib/dharma";
import { describeEnvironment } from "../lib/environment";
import { describeInsights } from "../lib/insights";
import type { ChatMsg, CheckIn, ContextScope, CosmosData, DiaryEntry, EnvNow, Meditation, Profile, Reading } from "../lib/types";

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

/** Added to the chart request when the reading must ignore the person's current life. */
const SCOPE_NOTE: Record<"profile" | "birth", { en: string; vi: string }> = {
  profile: {
    en: "\n\nUse ONLY my profile and my birth charts. You have no check-ins, diary or daily data on purpose; don't guess how I feel or what happened recently.",
    vi: "\n\nChỉ dựa vào Hồ sơ và lá số của mình. Bạn cố ý không có check-in, nhật ký hay dữ liệu hằng ngày; đừng phỏng đoán cảm xúc hay chuyện gần đây của mình.",
  },
  birth: {
    en: "\n\nRead purely from my birth data and charts. You intentionally know nothing about my current work, goals or life; don't assume any. Describe the chart's own potentials.",
    vi: "\n\nLuận giải thuần túy từ ngày giờ sinh và lá số. Bạn cố ý không biết gì về công việc, mục tiêu hay cuộc sống hiện tại của mình; đừng giả định. Hãy mô tả tiềm năng vốn có của lá số.",
  },
};

export const SCOPES: ("full" | "profile" | "birth")[] = ["full", "profile", "birth"];
export const SCOPE_LABEL = { full: "scopeFull", profile: "scopeProfile", birth: "scopeBirth", cards: "scopeCards" } as const;
const SCOPE_HINT = { full: "scopeFullHint", profile: "scopeProfileHint", birth: "scopeBirthHint" } as const;
const SCOPE_KEY = "ue.chartScope";

const LABELS = {
  daily: { title: "guidanceTitle", intro: "guidanceIntro", button: "receive" },
  chart: { title: "chartReadingTitle", intro: "chartReadingIntro", button: "receiveChart" },
  dharma: { title: "dharmaReadingTitle", intro: "dharmaReadingIntro", button: "receiveDharma" },
} as const;

export interface ContextSources {
  diary: DiaryEntry[];
  meditations: Meditation[];
  profile: Profile;
  snapshot: Snapshot;
  cosmos: CosmosData | null | undefined;
  env: EnvNow | null | undefined;
  allCheckins: CheckIn[];
  checkin?: CheckIn;
  recent: CheckIn[];
  today: string;
}

/** Everything Claude may see, trimmed to the chosen scope. */
export function buildContextFor(ctx: ContextScope, x: ContextSources): string {
  if (ctx === "cards") return "(They chose to share only their question and the cards; nothing else is known about them on purpose.)";
  if (ctx === "profile") return [describeProfile(x.profile), describeNatalCharts(x.snapshot)].join("\n\n");
  if (ctx === "birth") return [describeProfile(x.profile, { birthOnly: true }), describeNatalCharts(x.snapshot)].join("\n\n");
  return [
    describeProfile(x.profile), describeSnapshot(x.snapshot),
    describeEnvironment(x.env ?? null, x.snapshot.nature.place.label ?? "their location"),
    describeCosmos(x.cosmos ?? null), describeInsights(x.allCheckins), describeRecent(x.recent),
    describeDiary(x.diary, x.today), describeDharma(x.snapshot.now, x.checkin, x.meditations),
  ].filter(Boolean).join("\n\n");
}

interface Props {
  kind?: "daily" | "chart" | "dharma";
  diary: DiaryEntry[];
  meditations: Meditation[];
  profile: Profile;
  snapshot: Snapshot;
  cosmos: CosmosData | null | undefined;
  env: EnvNow | null | undefined;
  allCheckins: CheckIn[];
  checkin?: CheckIn;
  recent: CheckIn[];
  reading?: Reading;
  today: string;
}

export default function GuidancePanel({ kind = "daily", diary, meditations, profile, snapshot, cosmos, env, allCheckins, checkin, recent, reading, today }: Props) {
  const { t, lang } = useT();
  const session = useGuide(kind);
  const scope = kind === "chart" ? "chart" : today;
  // Which data a new chart reading may use (a per-browser preference).
  const [chartScope, setChartScope] = useState<"full" | "profile" | "birth">(() => {
    try {
      const v = localStorage.getItem(SCOPE_KEY);
      return v === "profile" || v === "birth" ? v : "full";
    } catch {
      return "full";
    }
  });
  const chooseScope = (v: "full" | "profile" | "birth") => {
    setChartScope(v);
    try {
      localStorage.setItem(SCOPE_KEY, v);
    } catch {
      /* ignore */
    }
  };

  // Attach to (or create) this kind's conversation. It lives outside the component, so it
  // survives tab switches; a new day starts a new daily/dharma conversation.
  useEffect(() => {
    guide.ensure(kind, scope, today, reading);
  }, [kind, scope, today, reading]);

  const messages = session?.messages ?? [];
  const busy = (session?.pending ?? null) !== null;

  const buildContext = (ctx: ContextScope) =>
    buildContextFor(ctx, { diary, meditations, profile, snapshot, cosmos, env, allCheckins, checkin, recent, today });

  const send = (history: ChatMsg[], ctx: ContextScope) => void guide.send(kind, history, { lang, context: buildContext(ctx) });

  const requestReading = () => {
    const ctx = kind === "chart" ? chartScope : "full";
    guide.restart(kind, today, ctx);
    if (kind === "chart") {
      send([{ role: "user", content: CHART_REQUEST[lang] + (ctx === "profile" || ctx === "birth" ? SCOPE_NOTE[ctx][lang] : "") }], ctx);
      return;
    }
    if (kind === "dharma") {
      send([{ role: "user", content: `${DHARMA_REQUEST[lang]}\n\nMy check-in today:\n${describeCheckin(checkin)}` }], "full");
      return;
    }
    const ask = lang === "vi" ? "Hãy cho mình lời luận giải hôm nay." : "Please give me today's reading.";
    send([{ role: "user", content: `${ask}\n\nMy check-in today:\n${describeCheckin(checkin)}` }], "full");
  };

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
      {kind === "chart" && (
        <div className="scope-picker">
          <p className="small"><strong>{t("scopeTitle")}</strong></p>
          <div className="chips" role="radiogroup" aria-label={t("scopeTitle")}>
            {SCOPES.map((v) => (
              <button key={v} role="radio" aria-checked={chartScope === v} className={`chip ${chartScope === v ? "on" : ""}`} disabled={busy} onClick={() => chooseScope(v)}>
                {t(SCOPE_LABEL[v])}
              </button>
            ))}
          </div>
          <p className="tiny muted">{t(SCOPE_HINT[chartScope])}</p>
          {messages.length > 0 && session && session.contextScope !== chartScope && (
            <p className="tiny hint">↻ {t("scopeApplyNext")}</p>
          )}
          {messages.length > 0 && session && (
            <p className="tiny muted">{t("scopeThisChat")}: <strong>{t(SCOPE_LABEL[session.contextScope])}</strong></p>
          )}
        </div>
      )}

      <ChatThread kind={kind} reading={reading} contextFor={buildContext} />
    </section>
  );
}
