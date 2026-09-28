import { useEffect, useMemo, useState } from "react";
import { useT, type Bi } from "../lib/i18n";
import { QUOTES, THEMES, quoteById, quoted, suggestQuote, type BuddhaQuote, type QuoteState, type QuoteTheme } from "../lib/buddhaQuotes";

const L = {
  title: { en: "Words of the Buddha", vi: "Lời Phật dạy" },
  intro: {
    en: "Teachings from the Pali Canon and the sūtras chanted in Vietnam, each with its source. Choose one to carry through your day.",
    vi: "Lời dạy từ kinh điển Pali và các bộ kinh quen thuộc ở Việt Nam, câu nào cũng ghi rõ xuất xứ. Mỗi ngày, hãy tự chọn một câu để mang theo.",
  },
  todayAsk: { en: "Which teaching will you carry today?", vi: "Hôm nay bạn muốn mang theo lời dạy nào?" },
  draw: { en: "Draw a teaching", vi: "Gieo một câu" },
  drawAgain: { en: "Draw again", vi: "Gieo lại" },
  choose: { en: "Carry this today", vi: "Chọn câu này cho hôm nay" },
  change: { en: "Choose another", vi: "Đổi câu khác" },
  yourToday: { en: "Your teaching for today", vi: "Lời dạy bạn chọn cho hôm nay" },
  reflect: { en: "Sit with this", vi: "Quán chiếu" },
  practice: { en: "Practice", vi: "Thực tập" },
  note: { en: "What does it stir in you today?", vi: "Hôm nay câu này gợi lên điều gì trong bạn?" },
  saveNote: { en: "Save reflection", vi: "Lưu cảm nhận" },
  saved: { en: "Saved", vi: "Đã lưu" },
  browse: { en: "All teachings", vi: "Tất cả lời dạy" },
  all: { en: "All", vi: "Tất cả" },
  favorites: { en: "Favorites", vi: "Yêu thích" },
  search: { en: "Search the teachings…", vi: "Tìm trong lời dạy…" },
  none: { en: "Nothing matches.", vi: "Không tìm thấy." },
  history: { en: "Your recent days", vi: "Những ngày gần đây" },
  translation: {
    en: "Translations render the meaning faithfully from the Pali or Chinese; they are not quotations of a published translation.",
    vi: "Lời dịch là dịch ý bám sát bản Pali hoặc Hán văn, không phải trích nguyên văn một bản dịch đã xuất bản.",
  },
  count: { en: "{n} teachings", vi: "{n} lời dạy" },
} satisfies Record<string, Bi>;

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();

function QuoteText({ x, large }: { x: BuddhaQuote; large?: boolean }) {
  const { tr } = useT();
  return (
    <figure className={`bquote ${large ? "large" : ""}`}>
      <blockquote>{quoted(tr(x.text))}</blockquote>
      <figcaption>
        <span className="bsource">— {tr(x.source)}</span>
        {x.original && <span className="boriginal">{x.original}</span>}
      </figcaption>
    </figure>
  );
}

interface Props {
  state: QuoteState;
  today: string;
  onChange: (s: QuoteState) => void;
}

export default function BuddhaWords({ state, today, onChange }: Props) {
  const { tr, lang } = useT();
  const locale = lang === "vi" ? "vi-VN" : "en-US";
  const pick = state.picks.find((p) => p.date === today);
  const current = pick ? quoteById(pick.id) : undefined;
  const [choosing, setChoosing] = useState(!pick);
  const [drawn, setDrawn] = useState<BuddhaQuote | null>(null);
  const [theme, setTheme] = useState<QuoteTheme | "all" | "fav">("all");
  const [query, setQuery] = useState("");
  const [note, setNote] = useState(pick?.note ?? "");
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setNote(pick?.note ?? "");
    setChoosing(!pick);
  }, [pick?.id, today]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (id: string) => {
    onChange({ ...state, picks: [...state.picks.filter((p) => p.date !== today), { date: today, id }] });
    setDrawn(null);
    setChoosing(false);
    setNote("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggleFav = (id: string) =>
    onChange({ ...state, favorites: state.favorites.includes(id) ? state.favorites.filter((f) => f !== id) : [...state.favorites, id] });
  const saveNote = () => {
    onChange({ ...state, picks: state.picks.map((p) => (p.date === today ? { ...p, note: note.trim() || undefined } : p)) });
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  };

  const q = fold(query.trim());
  const list = useMemo(
    () =>
      QUOTES.filter(
        (x) =>
          (theme === "all" || (theme === "fav" ? state.favorites.includes(x.id) : x.themes.includes(theme))) &&
          (!q ||
            fold(
              [x.text.vi, x.text.en, x.source.vi, x.source.en, x.original ?? "", x.reflect.vi, x.reflect.en,
                ...x.themes.flatMap((th) => [THEMES[th].label.vi, THEMES[th].label.en])].join(" "),
            ).includes(q)),
      ),
    [theme, q, state.favorites],
  );
  const history = [...state.picks].filter((p) => p.date !== today).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  const star = (id: string) => (
    <button className={`star ${state.favorites.includes(id) ? "on" : ""}`} aria-pressed={state.favorites.includes(id)} aria-label={tr(L.favorites)} onClick={() => toggleFav(id)}>
      {state.favorites.includes(id) ? "★" : "☆"}
    </button>
  );

  return (
    <section className="card bwords">
      <div className="guidance-head">
        <div>
          <h2>📿 {tr(L.title)}</h2>
          <p className="muted small">{tr(L.intro)}</p>
        </div>
      </div>

      {current && !choosing ? (
        <div className="btoday">
          <div className="row between">
            <p className="eyebrow">🌸 {tr(L.yourToday)}</p>
            {star(current.id)}
          </div>
          <QuoteText x={current} large />
          <div className="chips">{current.themes.map((th) => <span key={th} className="chip on static">{tr(THEMES[th].label)}</span>)}</div>
          <div className="bgrid">
            <div className="relation">
              <p className="eyebrow">🪷 {tr(L.reflect)}</p>
              <p>{tr(current.reflect)}</p>
            </div>
            <div className="relation">
              <p className="eyebrow">🧘 {tr(L.practice)}</p>
              <p>{tr(THEMES[current.themes[0]].practice)}</p>
            </div>
          </div>
          <div className="field">
            <label htmlFor="qnote">{tr(L.note)}</label>
            <textarea id="qnote" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="actions">
            <button className="ghost" onClick={() => setChoosing(true)}>{tr(L.change)}</button>
            <button className="primary" onClick={saveNote}>{flash ? `✓ ${tr(L.saved)}` : tr(L.saveNote)}</button>
          </div>
        </div>
      ) : (
        <div className="bchoose">
          <p><strong>{tr(L.todayAsk)}</strong></p>
          {drawn ? (
            <>
              <QuoteText x={drawn} large />
              <div className="actions">
                <button className="ghost" onClick={() => setDrawn(suggestQuote(state, theme === "all" || theme === "fav" ? undefined : theme))}>🌸 {tr(L.drawAgain)}</button>
                <button className="primary" onClick={() => choose(drawn.id)}>{tr(L.choose)}</button>
              </div>
            </>
          ) : (
            <div className="actions start">
              <button className="primary" onClick={() => setDrawn(suggestQuote(state, theme === "all" || theme === "fav" ? undefined : theme))}>🌸 {tr(L.draw)}</button>
            </div>
          )}
        </div>
      )}

      <details className="bbrowse" open={choosing}>
        <summary className="small"><strong>{tr(L.browse)}</strong> <span className="muted">· {tr(L.count).replace("{n}", String(QUOTES.length))}</span></summary>
        <input className="lib-search" type="search" placeholder={tr(L.search)} value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="chips">
          <button className={`chip ${theme === "all" ? "on" : ""}`} onClick={() => setTheme("all")}>{tr(L.all)}</button>
          <button className={`chip ${theme === "fav" ? "on" : ""}`} onClick={() => setTheme("fav")}>★ {tr(L.favorites)} {state.favorites.length ? state.favorites.length : ""}</button>
          {(Object.keys(THEMES) as QuoteTheme[]).map((th) => (
            <button key={th} className={`chip ${theme === th ? "on" : ""}`} onClick={() => setTheme(th)}>{tr(THEMES[th].label)}</button>
          ))}
        </div>
        {!list.length ? (
          <p className="small muted">{tr(L.none)}</p>
        ) : (
          <ul className="blist">
            {list.map((x) => (
              <li key={x.id} className={current?.id === x.id ? "on" : ""}>
                <QuoteText x={x} />
                <div className="row between">
                  {star(x.id)}
                  <button className="ghost" onClick={() => choose(x.id)} disabled={current?.id === x.id}>{tr(L.choose)}</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="tiny muted">{tr(L.translation)}</p>
      </details>

      {history.length > 0 && (
        <details className="bhistory">
          <summary className="small"><strong>{tr(L.history)}</strong></summary>
          <ul className="blist compact">
            {history.map((p) => {
              const x = quoteById(p.id);
              if (!x) return null;
              return (
                <li key={p.date}>
                  <p className="eyebrow">{new Date(`${p.date}T12:00:00`).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })} · {tr(x.source)}</p>
                  <p className="small">{quoted(tr(x.text))}</p>
                  {p.note && <p className="small note">✍️ {p.note}</p>}
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </section>
  );
}
