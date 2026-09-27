// A full 78-card Rider–Waite–Smith tarot deck, spreads, and a fair shuffle.
import type { Bi } from "./i18n";

export type Suit = "major" | "wands" | "cups" | "swords" | "pentacles";

export interface TarotCard {
  id: string;
  suit: Suit;
  rank: string; // roman numeral for majors, A/2…10/Page/Knight/Queen/King for minors
  name: Bi;
  symbol: string;
  up: Bi;
  rev: Bi;
}

const b = (en: string, vi: string): Bi => ({ en, vi });

type Row = [string, string, string, string, string, string, string]; // en name, vi name, symbol, up en, up vi, rev en, rev vi

const MAJORS: Row[] = [
  ["The Fool", "Kẻ Khờ", "🎒", "new beginnings, spontaneity, a leap of faith", "khởi đầu mới, tự do, dám bước", "recklessness, hesitation, naivety", "liều lĩnh, do dự, ngây thơ"],
  ["The Magician", "Nhà Ảo Thuật", "🪄", "willpower, skill, manifestation", "ý chí, kỹ năng, hiện thực hóa", "manipulation, scattered energy, untapped talent", "thao túng, phân tán, tài năng bị bỏ phí"],
  ["The High Priestess", "Nữ Tư Tế", "🌙", "intuition, inner knowing, mystery", "trực giác, hiểu biết nội tâm, bí ẩn", "ignored intuition, secrets, disconnection", "bỏ qua trực giác, bí mật, mất kết nối"],
  ["The Empress", "Hoàng Hậu", "🌾", "abundance, nurturing, creativity", "sung túc, nuôi dưỡng, sáng tạo", "dependence, smothering, creative block", "phụ thuộc, bao bọc quá mức, bế tắc sáng tạo"],
  ["The Emperor", "Hoàng Đế", "👑", "structure, authority, stability", "kỷ cương, quyền lực, ổn định", "rigidity, control, domination", "cứng nhắc, kiểm soát, áp đặt"],
  ["The Hierophant", "Giáo Hoàng", "🔑", "tradition, guidance, shared values", "truyền thống, người dẫn dắt, giá trị chung", "rebellion, dogma, finding your own way", "nổi loạn, giáo điều, tự tìm lối riêng"],
  ["The Lovers", "Tình Nhân", "💞", "love, union, meaningful choices", "tình yêu, hòa hợp, lựa chọn quan trọng", "imbalance, misalignment, indecision", "mất cân bằng, lệch giá trị, phân vân"],
  ["The Chariot", "Cỗ Xe", "🏇", "determination, victory, control", "quyết tâm, chiến thắng, làm chủ", "lack of direction, aggression, obstacles", "mất phương hướng, nóng vội, trở ngại"],
  ["Strength", "Sức Mạnh", "🦁", "courage, patience, gentle power", "can đảm, kiên nhẫn, sức mạnh dịu dàng", "self-doubt, weakness, raw emotion", "tự nghi ngờ, yếu lòng, cảm xúc bùng phát"],
  ["The Hermit", "Ẩn Sĩ", "🏮", "introspection, solitude, inner guidance", "chiêm nghiệm, tĩnh lặng, ánh sáng bên trong", "isolation, loneliness, withdrawal", "cô lập, cô đơn, thu mình"],
  ["Wheel of Fortune", "Bánh Xe Số Phận", "🎡", "cycles, change, turning point", "chu kỳ, thay đổi, bước ngoặt", "resistance to change, bad timing, setbacks", "cưỡng lại thay đổi, sai thời điểm, trắc trở"],
  ["Justice", "Công Lý", "⚖️", "fairness, truth, cause and effect", "công bằng, sự thật, nhân quả", "unfairness, dishonesty, avoiding accountability", "bất công, thiếu trung thực, né trách nhiệm"],
  ["The Hanged Man", "Người Treo Ngược", "🙃", "pause, surrender, new perspective", "tạm dừng, buông, góc nhìn mới", "stalling, resistance, indecision", "trì hoãn, kháng cự, lưỡng lự"],
  ["Death", "Cái Chết", "🦋", "endings, transformation, letting go", "kết thúc, chuyển hóa, buông bỏ", "fear of change, stagnation, clinging", "sợ thay đổi, trì trệ, níu kéo"],
  ["Temperance", "Tiết Chế", "🏺", "balance, moderation, patience", "cân bằng, điều độ, kiên nhẫn", "excess, imbalance, haste", "thái quá, mất cân bằng, vội vàng"],
  ["The Devil", "Ác Quỷ", "⛓️", "attachment, temptation, shadow self", "ràng buộc, cám dỗ, mặt tối", "release, breaking free, awareness", "giải thoát, phá xiềng, tỉnh thức"],
  ["The Tower", "Tòa Tháp", "🗼", "sudden upheaval, revelation, breakthrough", "biến động bất ngờ, vỡ lẽ, đột phá", "averted disaster, fear of change, delayed collapse", "tránh được đổ vỡ, sợ thay đổi, sụp đổ bị trì hoãn"],
  ["The Star", "Ngôi Sao", "⭐", "hope, renewal, inspiration", "hy vọng, hồi phục, cảm hứng", "discouragement, lost faith, disconnection", "nản lòng, mất niềm tin, xa rời bản thân"],
  ["The Moon", "Mặt Trăng", "🌕", "illusion, intuition, the unconscious", "ảo ảnh, trực giác, vô thức", "clarity returning, released fear, confusion lifting", "dần sáng tỏ, buông nỗi sợ, hết mơ hồ"],
  ["The Sun", "Mặt Trời", "☀️", "joy, success, vitality", "niềm vui, thành công, sức sống", "temporary gloom, overconfidence, delayed joy", "u ám tạm thời, tự tin thái quá, niềm vui đến chậm"],
  ["Judgement", "Phán Xét", "📯", "awakening, reckoning, a calling", "thức tỉnh, nhìn lại, tiếng gọi", "self-doubt, ignoring the call, harsh self-judgement", "hoài nghi bản thân, lờ đi tiếng gọi, tự phán xét khắt khe"],
  ["The World", "Thế Giới", "🌍", "completion, wholeness, achievement", "hoàn thành, trọn vẹn, thành tựu", "unfinished business, lack of closure, shortcuts", "việc dang dở, chưa khép lại, đi đường tắt"],
];

const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];

export const SUITS: Record<Exclude<Suit, "major">, { name: Bi; symbol: string; element: Bi; domain: Bi }> = {
  wands: { name: b("Wands", "Gậy"), symbol: "🔥", element: b("Fire", "Lửa"), domain: b("passion, action, career", "đam mê, hành động, sự nghiệp") },
  cups: { name: b("Cups", "Cốc"), symbol: "💧", element: b("Water", "Nước"), domain: b("emotions, love, relationships", "cảm xúc, tình yêu, các mối quan hệ") },
  swords: { name: b("Swords", "Kiếm"), symbol: "🗡️", element: b("Air", "Khí"), domain: b("mind, truth, conflict", "tư duy, sự thật, xung đột") },
  pentacles: { name: b("Pentacles", "Tiền"), symbol: "🪙", element: b("Earth", "Đất"), domain: b("money, work, body", "tiền bạc, công việc, sức khỏe") },
};

const RANKS: { code: string; en: string; vi: string }[] = [
  { code: "A", en: "Ace", vi: "Át" }, { code: "2", en: "Two", vi: "2" }, { code: "3", en: "Three", vi: "3" },
  { code: "4", en: "Four", vi: "4" }, { code: "5", en: "Five", vi: "5" }, { code: "6", en: "Six", vi: "6" },
  { code: "7", en: "Seven", vi: "7" }, { code: "8", en: "Eight", vi: "8" }, { code: "9", en: "Nine", vi: "9" },
  { code: "10", en: "Ten", vi: "10" }, { code: "Page", en: "Page", vi: "Tiểu Đồng" }, { code: "Knight", en: "Knight", vi: "Hiệp Sĩ" },
  { code: "Queen", en: "Queen", vi: "Nữ Hoàng" }, { code: "King", en: "King", vi: "Vua" },
];

// [up en, up vi, rev en, rev vi] in rank order A…King.
const MINOR: Record<Exclude<Suit, "major">, [string, string, string, string][]> = {
  wands: [
    ["inspiration, a new venture, a spark", "cảm hứng, khởi sự mới, tia lửa", "delays, lack of motivation", "trì hoãn, thiếu động lực"],
    ["planning, future vision, decisions", "lên kế hoạch, tầm nhìn, quyết định", "fear of the unknown, poor planning", "sợ điều chưa biết, kế hoạch kém"],
    ["expansion, foresight, progress", "mở rộng, nhìn xa, tiến triển", "obstacles, delays in plans", "trở ngại, kế hoạch chậm lại"],
    ["celebration, harmony, homecoming", "ăn mừng, hòa hợp, sum họp", "instability at home, transition", "bất ổn gia đình, giai đoạn chuyển tiếp"],
    ["competition, conflict, tension", "cạnh tranh, xung đột, căng thẳng", "avoiding conflict, resolution", "tránh xung đột, hòa giải"],
    ["victory, recognition, confidence", "chiến thắng, được công nhận, tự tin", "ego, fall from grace, self-doubt", "cái tôi, mất uy tín, tự nghi ngờ"],
    ["defense, perseverance, standing your ground", "phòng thủ, kiên trì, giữ lập trường", "overwhelm, giving up", "quá tải, bỏ cuộc"],
    ["speed, movement, swift news", "nhanh chóng, chuyển động, tin tức đến", "delays, frustration", "chậm trễ, bực bội"],
    ["resilience, persistence, the last stretch", "kiên cường, bền bỉ, chặng cuối", "exhaustion, defensiveness", "kiệt sức, phòng thủ quá mức"],
    ["burden, responsibility, overload", "gánh nặng, trách nhiệm, quá tải", "delegating, letting go", "san sẻ, buông bớt"],
    ["enthusiasm, exploration, curiosity", "nhiệt huyết, khám phá, tò mò", "scattered energy, impatience", "phân tán, thiếu kiên nhẫn"],
    ["action, adventure, passion", "hành động, phiêu lưu, đam mê", "impulsiveness, haste", "bốc đồng, vội vàng"],
    ["confidence, warmth, determination", "tự tin, ấm áp, quyết đoán", "jealousy, insecurity", "ghen tị, bất an"],
    ["vision, leadership, boldness", "tầm nhìn, lãnh đạo, táo bạo", "impulsiveness, overbearing", "bốc đồng, độc đoán"],
  ],
  cups: [
    ["new love, compassion, emotional opening", "tình cảm mới, trắc ẩn, mở lòng", "blocked emotions, emptiness", "cảm xúc bị chặn, trống rỗng"],
    ["partnership, mutual attraction, connection", "gắn kết, đồng điệu, kết nối", "imbalance, broken communication", "lệch pha, đứt gãy giao tiếp"],
    ["friendship, celebration, community", "tình bạn, niềm vui chung, cộng đồng", "overindulgence, gossip", "quá đà, thị phi"],
    ["apathy, contemplation, missed chances", "thờ ơ, trầm ngâm, bỏ lỡ cơ hội", "new awareness, re-engaging", "nhận ra điều mới, mở lòng lại"],
    ["loss, grief, regret", "mất mát, đau buồn, hối tiếc", "acceptance, moving on", "chấp nhận, bước tiếp"],
    ["nostalgia, innocence, happy memories", "hoài niệm, trong trẻo, kỷ niệm đẹp", "living in the past, moving forward", "sống mãi trong quá khứ, hướng về phía trước"],
    ["choices, fantasy, illusion", "nhiều lựa chọn, mơ mộng, ảo tưởng", "clarity, focus", "sáng suốt, tập trung"],
    ["walking away, seeking deeper meaning", "rời đi, tìm ý nghĩa sâu hơn", "fear of leaving, aimlessness", "sợ rời bỏ, lạc lối"],
    ["contentment, wishes fulfilled", "mãn nguyện, ước nguyện thành", "smugness, dissatisfaction", "tự mãn, chưa thỏa"],
    ["harmony, family, emotional fulfillment", "hòa thuận, gia đình, viên mãn", "broken harmony, misaligned values", "rạn nứt, lệch giá trị"],
    ["creative intuition, a tender message", "trực giác sáng tạo, tin nhắn dịu dàng", "emotional immaturity, insecurity", "non nớt cảm xúc, bất an"],
    ["romance, charm, following the heart", "lãng mạn, quyến rũ, theo tiếng gọi trái tim", "moodiness, unrealistic expectations", "thất thường, kỳ vọng thiếu thực tế"],
    ["compassion, emotional security, intuition", "trắc ẩn, vững vàng cảm xúc, trực giác", "codependence, emotional overwhelm", "phụ thuộc, ngập trong cảm xúc"],
    ["emotional balance, diplomacy, calm", "cân bằng cảm xúc, khéo léo, điềm tĩnh", "manipulation, volatility", "thao túng, thất thường"],
  ],
  swords: [
    ["clarity, breakthrough, truth", "sáng suốt, đột phá, sự thật", "confusion, miscommunication", "rối trí, hiểu lầm"],
    ["a difficult choice, stalemate, avoidance", "lựa chọn khó, bế tắc, né tránh", "information overload, a decision made", "quá nhiều thông tin, đã quyết định"],
    ["heartbreak, sorrow, a painful truth", "tổn thương, đau buồn, sự thật đau lòng", "healing, forgiveness", "chữa lành, tha thứ"],
    ["rest, recovery, contemplation", "nghỉ ngơi, hồi phục, tĩnh tâm", "restlessness, burnout", "bồn chồn, kiệt sức"],
    ["conflict, winning at a cost", "xung đột, thắng mà mất", "reconciliation, making amends", "làm lành, sửa sai"],
    ["transition, moving on, calmer waters", "chuyển tiếp, rời đi, bình yên hơn", "resistance, unfinished business", "kháng cự, việc dang dở"],
    ["strategy, deception, getting away with it", "mưu lược, lừa dối, lách luật", "confession, coming clean", "thú nhận, minh bạch"],
    ["feeling trapped, self-limiting beliefs", "cảm thấy mắc kẹt, niềm tin tự giới hạn", "release, a new perspective", "thoát ra, góc nhìn mới"],
    ["anxiety, worry, sleepless nights", "lo âu, trăn trở, mất ngủ", "hope, reaching out", "hy vọng, tìm người chia sẻ"],
    ["a painful ending, rock bottom", "kết thúc đau đớn, chạm đáy", "recovery, regeneration", "hồi phục, tái sinh"],
    ["curiosity, new ideas, vigilance", "tò mò, ý tưởng mới, cảnh giác", "gossip, all talk", "buôn chuyện, nói nhiều làm ít"],
    ["ambition, fast action, directness", "tham vọng, hành động nhanh, thẳng thắn", "recklessness, aggression", "liều lĩnh, hung hăng"],
    ["clear thinking, honesty, independence", "tư duy rõ ràng, thẳng thắn, độc lập", "coldness, harsh words", "lạnh lùng, lời lẽ cay nghiệt"],
    ["intellect, authority, truth", "trí tuệ, uy quyền, chân lý", "manipulation, misuse of power", "thao túng, lạm quyền"],
  ],
  pentacles: [
    ["a new opportunity, prosperity, manifestation", "cơ hội mới, thịnh vượng, hiện thực hóa", "a missed chance, poor planning", "lỡ cơ hội, thiếu kế hoạch"],
    ["balance, adaptability, juggling priorities", "cân bằng, linh hoạt, xoay xở ưu tiên", "overwhelm, disorganization", "quá tải, lộn xộn"],
    ["teamwork, craftsmanship, learning", "làm việc nhóm, tay nghề, học hỏi", "disharmony, poor quality", "thiếu phối hợp, kém chất lượng"],
    ["security, saving, control", "an toàn, tiết kiệm, kiểm soát", "greed, or learning to let go", "keo kiệt, hoặc học cách buông"],
    ["hardship, insecurity, feeling left out", "khó khăn, bất an, cảm giác bị bỏ rơi", "recovery, help arriving", "hồi phục, được giúp đỡ"],
    ["generosity, giving and receiving, fairness", "hào phóng, cho và nhận, công bằng", "strings attached, debt", "cho có điều kiện, nợ nần"],
    ["patience, long-term investment, evaluation", "kiên nhẫn, đầu tư dài hạn, đánh giá", "impatience, poor returns", "nóng vội, kết quả kém"],
    ["diligence, skill-building, mastery", "chăm chỉ, rèn kỹ năng, tinh thông", "perfectionism, lack of focus", "cầu toàn, thiếu tập trung"],
    ["independence, self-sufficiency, reward", "độc lập, tự chủ, thành quả", "overwork, financial setbacks", "làm quá sức, trục trặc tài chính"],
    ["wealth, legacy, family security", "sung túc, di sản, gia đình vững vàng", "family disputes, instability", "bất hòa gia đình, bất ổn"],
    ["ambition, study, a new skill", "chí hướng, học tập, kỹ năng mới", "procrastination, slow progress", "trì hoãn, chậm tiến bộ"],
    ["hard work, routine, reliability", "cần mẫn, nề nếp, đáng tin", "boredom, stagnation", "nhàm chán, trì trệ"],
    ["nurturing, practicality, abundance", "chăm lo, thực tế, sung túc", "work–life imbalance, self-neglect", "mất cân bằng công việc–cuộc sống, bỏ bê bản thân"],
    ["wealth, discipline, security", "giàu có, kỷ luật, vững vàng", "greed, stubbornness", "tham lam, cố chấp"],
  ],
};

export const DECK: TarotCard[] = [
  ...MAJORS.map(([en, vi, symbol, ue, uv, re, rv], i): TarotCard => ({
    id: `m${i}`, suit: "major", rank: ROMAN[i], name: b(en, vi), symbol, up: b(ue, uv), rev: b(re, rv),
  })),
  ...(Object.keys(MINOR) as Exclude<Suit, "major">[]).flatMap((suit) =>
    MINOR[suit].map(([ue, uv, re, rv], i): TarotCard => ({
      id: `${suit}-${RANKS[i].code}`,
      suit,
      rank: RANKS[i].code,
      name: b(`${RANKS[i].en} of ${SUITS[suit].name.en}`, `${RANKS[i].vi} ${SUITS[suit].name.vi}`),
      symbol: SUITS[suit].symbol,
      up: b(ue, uv),
      rev: b(re, rv),
    })),
  ),
];

export const cardById = (id: string) => DECK.find((c) => c.id === id)!;

// ---------- Spreads ----------

export interface Spread {
  id: string;
  name: Bi;
  description: Bi;
  positions: Bi[];
}

export const SPREADS: Spread[] = [
  {
    id: "daily",
    name: b("Card of the day", "Lá bài hôm nay"),
    description: b("One card: a message to carry through today.", "Một lá: thông điệp để mang theo trong ngày."),
    positions: [b("Today's message", "Thông điệp hôm nay")],
  },
  {
    id: "ppf",
    name: b("Past · Present · Future", "Quá khứ · Hiện tại · Tương lai"),
    description: b("Three cards: where this comes from and where it's heading.", "Ba lá: điều này đến từ đâu và đang hướng về đâu."),
    positions: [b("Past", "Quá khứ"), b("Present", "Hiện tại"), b("Future", "Tương lai")],
  },
  {
    id: "soa",
    name: b("Situation · Challenge · Advice", "Tình huống · Thử thách · Lời khuyên"),
    description: b("Three cards: practical guidance for a decision.", "Ba lá: lời khuyên thực tế cho một quyết định."),
    positions: [b("Situation", "Tình huống"), b("Challenge", "Thử thách"), b("Advice", "Lời khuyên")],
  },
  {
    id: "celtic",
    name: b("Celtic Cross", "Celtic Cross"),
    description: b("Ten cards: the classic, in-depth reading.", "Mười lá: trải bài kinh điển, chi tiết nhất."),
    positions: [
      b("The present", "Hiện tại"), b("The challenge", "Thử thách"), b("Foundation (distant past)", "Nền tảng (quá khứ xa)"),
      b("Recent past", "Quá khứ gần"), b("Conscious goal", "Mục tiêu, điều bạn hướng tới"), b("Near future", "Tương lai gần"),
      b("Yourself", "Bản thân bạn"), b("Environment & others", "Môi trường & người xung quanh"), b("Hopes & fears", "Hy vọng & nỗi sợ"),
      b("Outcome", "Kết quả"),
    ],
  },
];

export const spreadById = (id: string) => SPREADS.find((s) => s.id === id) ?? SPREADS[0];

// ---------- Shuffle ----------

export interface DrawnCard {
  id: string;
  reversed: boolean;
}

/** Fisher–Yates with the browser's cryptographic RNG; each card gets its own orientation. */
export function shuffleDeck(reversals: boolean): DrawnCard[] {
  const ids = DECK.map((c) => c.id);
  const rand = new Uint32Array(ids.length * 2);
  crypto.getRandomValues(rand);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = rand[i] % (i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.map((id, i) => ({ id, reversed: reversals && rand[ids.length + i] % 2 === 1 }));
}

export interface TarotDraw {
  question: string;
  spread: string;
  cards: DrawnCard[]; // in position order
}

/** The request Claude receives: every position, card, orientation and its core meaning. */
export function describeDraw(d: TarotDraw, lang: "en" | "vi"): string {
  const spread = spreadById(d.spread);
  const lines = d.cards.map((c, i) => {
    const card = cardById(c.id);
    const suit = card.suit === "major" ? "Major Arcana" : `${SUITS[card.suit].name.en} (${SUITS[card.suit].element.en}: ${SUITS[card.suit].domain.en})`;
    return `${i + 1}. ${spread.positions[i].en}: ${card.name.en} (${card.name.vi})${c.reversed ? " REVERSED" : ""}, ${suit}. Core meaning: ${(c.reversed ? card.rev : card.up).en}`;
  });
  const ask = lang === "vi"
    ? "Hãy giải bài Tarot cho mình (Markdown, khoảng 400–700 chữ tùy số lá): ý nghĩa từng lá theo vị trí, câu chuyện xuyên suốt các lá, câu trả lời cho câu hỏi của mình, và một lời khuyên thực tế."
    : "Please read these tarot cards for me (Markdown, about 400–700 words depending on the spread): each card in its position, the story the cards tell together, an answer to my question, and practical advice.";
  return [
    ask,
    "",
    `Question: ${d.question.trim() || (lang === "vi" ? "(không có câu hỏi cụ thể: thông điệp chung cho mình lúc này)" : "(no specific question: a general message for me right now)")}`,
    `Spread: ${spread.name.en}`,
    ...lines,
  ].join("\n");
}
