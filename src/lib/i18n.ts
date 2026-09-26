import { createContext, useContext } from "react";

export type Lang = "en" | "vi";
/** A bilingual string. */
export type Bi = { en: string; vi: string };

export const LangContext = createContext<Lang>("en");

export function useT() {
  const lang = useContext(LangContext);
  const t = (key: keyof typeof UI) => UI[key][lang];
  const tr = (b: Bi) => b[lang];
  return { lang, t, tr };
}

const bi = (en: string, vi: string): Bi => ({ en, vi });

export const UI = {
  appName: bi("Universal Explorer", "Khám Phá Vũ Trụ"),
  tagline: bi("Read the energy of today, grow in your own direction.", "Đọc năng lượng hôm nay, lớn lên theo hướng của riêng bạn."),
  tabToday: bi("Today", "Hôm nay"),
  tabProfile: bi("Profile", "Hồ sơ"),
  tabJournal: bi("Journal", "Nhật ký"),

  // Profile
  profileTitle: bi("Your profile", "Hồ sơ của bạn"),
  profileIntro: bi(
    "This stays in your browser. The more you share, the more personal your guidance becomes.",
    "Thông tin chỉ lưu trong trình duyệt của bạn. Bạn chia sẻ càng nhiều, lời khuyên càng sát với bạn.",
  ),
  welcomeTitle: bi("Welcome, traveler", "Chào mừng bạn"),
  welcomeIntro: bi(
    "Let's start with who you are. Your birth details anchor every reading.",
    "Hãy bắt đầu với chính bạn. Thông tin ngày sinh là nền tảng cho mọi lần luận giải.",
  ),
  fullName: bi("Full name", "Họ và tên"),
  fullNameHint: bi("Used for your numerology Expression number", "Dùng để tính con số Sứ mệnh (thần số học)"),
  birthDate: bi("Date of birth", "Ngày sinh"),
  birthTime: bi("Time of birth (optional)", "Giờ sinh (không bắt buộc)"),
  birthTimeHint: bi("Unlocks your Moon sign precisely and your Rising sign", "Giúp xác định chính xác cung Mặt Trăng và cung Mọc"),
  birthPlace: bi("Place of birth", "Nơi sinh"),
  currentPlace: bi("Where you live now", "Nơi bạn đang sống"),
  pickCity: bi("Choose a city…", "Chọn thành phố…"),
  customPlace: bi("Custom coordinates", "Tọa độ tùy chỉnh"),
  latitude: bi("Latitude", "Vĩ độ"),
  longitude: bi("Longitude", "Kinh độ"),
  utcOffset: bi("UTC offset (h)", "Múi giờ (UTC, giờ)"),
  useMyLocation: bi("Use my location", "Dùng vị trí hiện tại"),
  gender: bi("Gender (optional)", "Giới tính (không bắt buộc)"),
  occupation: bi("What are you doing in life right now?", "Hiện tại bạn đang làm gì?"),
  occupationHint: bi("Work, study, projects, life stage…", "Công việc, học tập, dự án, giai đoạn cuộc sống…"),
  goals: bi("What do you want to grow toward?", "Bạn muốn phát triển theo hướng nào?"),
  goalsHint: bi("Your intentions for the next months or years", "Ý định của bạn trong vài tháng hoặc vài năm tới"),
  challenges: bi("What feels hard or stuck?", "Điều gì đang khó khăn hoặc bế tắc?"),
  values: bi("What matters most to you?", "Điều gì quan trọng nhất với bạn?"),
  language: bi("Language", "Ngôn ngữ"),
  save: bi("Save", "Lưu"),
  saved: bi("Saved ✓", "Đã lưu ✓"),
  saveAndBegin: bi("Save and begin", "Lưu và bắt đầu"),
  dataTitle: bi("Your data", "Dữ liệu của bạn"),
  exportData: bi("Export backup", "Xuất bản sao lưu"),
  importData: bi("Import backup", "Nhập bản sao lưu"),
  resetData: bi("Erase everything", "Xóa toàn bộ"),
  resetConfirm: bi("Erase your profile, journal and readings from this browser?", "Xóa hồ sơ, nhật ký và các lần luận giải khỏi trình duyệt này?"),
  importFailed: bi("That file doesn't look like a Universal Explorer backup.", "Tệp này không phải bản sao lưu của Khám Phá Vũ Trụ."),

  // Check-in
  checkinTitle: bi("How are you, really?", "Hôm nay bạn thực sự thế nào?"),
  mood: bi("Mood", "Tâm trạng"),
  energy: bi("Energy", "Năng lượng"),
  feelings: bi("Feelings", "Cảm xúc"),
  onMind: bi("What's on your mind?", "Bạn đang nghĩ gì?"),
  onMindHint: bi("A worry, a hope, something that happened…", "Một nỗi lo, một hy vọng, điều vừa xảy ra…"),
  focus: bi("Today I'm working on…", "Hôm nay mình đang làm…"),
  saveCheckin: bi("Save check-in", "Lưu cảm nhận"),
  checkinSaved: bi("Check-in saved", "Đã lưu cảm nhận"),

  // Dashboard
  skyTitle: bi("The sky today", "Bầu trời hôm nay"),
  numbersTitle: bi("Your numbers", "Con số của bạn"),
  easternTitle: bi("Eastern energies", "Năng lượng phương Đông"),
  natureTitle: bi("Moon & season", "Trăng & mùa"),
  youTitle: bi("Your cosmic signature", "Dấu ấn vũ trụ của bạn"),
  sun: bi("Sun", "Mặt Trời"),
  moon: bi("Moon", "Mặt Trăng"),
  rising: bi("Rising", "Cung Mọc"),
  retrograde: bi("Retrograde", "Nghịch hành"),
  noRetrograde: bi("No planets retrograde", "Không có hành tinh nghịch hành"),
  transitsToYou: bi("Touching your chart", "Tác động lên lá số của bạn"),
  noTransits: bi("A quiet sky for you today", "Bầu trời yên ả với bạn hôm nay"),
  lifePath: bi("Life Path", "Số Chủ Đạo"),
  expression: bi("Expression", "Số Sứ Mệnh"),
  birthdayNum: bi("Birthday", "Số Ngày Sinh"),
  personalYear: bi("Personal Year", "Năm Cá Nhân"),
  personalMonth: bi("Personal Month", "Tháng Cá Nhân"),
  personalDay: bi("Personal Day", "Ngày Cá Nhân"),
  universalDay: bi("Universal Day", "Ngày Vũ Trụ"),
  lunarDate: bi("Lunar date", "Âm lịch"),
  leapMonth: bi("leap", "nhuận"),
  dayPillar: bi("Day", "Ngày"),
  monthPillar: bi("Month", "Tháng"),
  yearPillar: bi("Year", "Năm"),
  yourElement: bi("Your element (bản mệnh)", "Bản mệnh"),
  yourAnimal: bi("Your animal (con giáp)", "Con giáp"),
  todayVsYou: bi("Today's element & you", "Ngũ hành hôm nay & bạn"),
  solarTerm: bi("Solar term", "Tiết khí"),
  season: bi("Season", "Mùa"),
  daylight: bi("Daylight", "Thời gian ban ngày"),
  sunrise: bi("Sunrise", "Mặt trời mọc"),
  sunset: bi("Sunset", "Mặt trời lặn"),
  nextFull: bi("Next full moon", "Trăng tròn tới"),
  nextNew: bi("Next new moon", "Trăng non tới"),
  illuminated: bi("illuminated", "được chiếu sáng"),
  inDays: bi("in {n} days", "{n} ngày nữa"),
  today: bi("today", "hôm nay"),
  approx: bi("approx.", "ước tính"),
  needsBirthTime: bi("add birth time & place", "cần giờ & nơi sinh"),

  // Guidance
  guidanceTitle: bi("Today's guidance", "Lời dẫn đường hôm nay"),
  guidanceIntro: bi(
    "Claude weaves the sky, your numbers, the Eastern calendar and how you feel into a reading for you.",
    "Claude kết nối bầu trời, con số, lịch phương Đông và cảm xúc của bạn thành một lời luận giải riêng.",
  ),
  checkinFirst: bi("Tip: save a check-in first so the reading can meet you where you are.", "Gợi ý: hãy lưu cảm nhận trước để lời luận giải hiểu bạn hơn."),
  receive: bi("Receive today's guidance", "Nhận lời dẫn đường"),
  regenerate: bi("Read again", "Luận giải lại"),
  askFollowUp: bi("Ask a follow-up question…", "Đặt câu hỏi thêm…"),
  send: bi("Send", "Gửi"),
  stop: bi("Stop", "Dừng"),
  thinking: bi("Listening to the stars…", "Đang lắng nghe các vì sao…"),
  errorPrefix: bi("Something went wrong", "Đã xảy ra lỗi"),
  you: bi("You", "Bạn"),

  // Journal
  journalTitle: bi("Your journey", "Hành trình của bạn"),
  journalEmpty: bi("No entries yet. Your check-ins and readings will appear here.", "Chưa có gì. Các lần ghi cảm nhận và luận giải sẽ xuất hiện ở đây."),
  readingLabel: bi("Reading", "Luận giải"),
  checkinLabel: bi("Check-in", "Cảm nhận"),
  delete: bi("Delete", "Xóa"),
  streak: bi("{n}-day check-in streak", "Chuỗi {n} ngày ghi cảm nhận"),
  avgEnergy: bi("Average energy (last 7 entries)", "Năng lượng trung bình (7 lần gần nhất)"),
} satisfies Record<string, Bi>;

export function fmt(s: string, vars: Record<string, string | number>) {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

export const MOODS: { value: number; emoji: string; label: Bi }[] = [
  { value: 1, emoji: "🌧", label: bi("Heavy", "Nặng nề") },
  { value: 2, emoji: "🌫", label: bi("Low", "Chùng xuống") },
  { value: 3, emoji: "⛅", label: bi("Okay", "Bình thường") },
  { value: 4, emoji: "🌤", label: bi("Good", "Khá tốt") },
  { value: 5, emoji: "☀️", label: bi("Radiant", "Rạng rỡ") },
];

export const FEELINGS: { id: string; label: Bi }[] = [
  { id: "calm", label: bi("Calm", "Bình yên") },
  { id: "grateful", label: bi("Grateful", "Biết ơn") },
  { id: "hopeful", label: bi("Hopeful", "Hy vọng") },
  { id: "inspired", label: bi("Inspired", "Hứng khởi") },
  { id: "loved", label: bi("Loved", "Được yêu thương") },
  { id: "focused", label: bi("Focused", "Tập trung") },
  { id: "curious", label: bi("Curious", "Tò mò") },
  { id: "tired", label: bi("Tired", "Mệt mỏi") },
  { id: "anxious", label: bi("Anxious", "Lo âu") },
  { id: "stressed", label: bi("Stressed", "Căng thẳng") },
  { id: "sad", label: bi("Sad", "Buồn") },
  { id: "lonely", label: bi("Lonely", "Cô đơn") },
  { id: "angry", label: bi("Frustrated", "Bực bội") },
  { id: "confused", label: bi("Lost", "Mơ hồ") },
  { id: "restless", label: bi("Restless", "Bồn chồn") },
];
