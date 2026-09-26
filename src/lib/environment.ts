// Interpreting local weather & air for a person: categories, advice, circadian light.
import type { Bi } from "./i18n";
import type { EnvNow } from "./types";

export type Level = "good" | "ok" | "warn" | "bad" | "severe";

/** US EPA AQI bands. */
export function aqiInfo(aqi: number): { level: Level; label: Bi; advice: Bi } {
  if (aqi <= 50) return { level: "good", label: { en: "Good", vi: "Tốt" }, advice: { en: "Great air, a good day to be outside.", vi: "Không khí trong lành, rất hợp để ra ngoài." } };
  if (aqi <= 100) return { level: "ok", label: { en: "Moderate", vi: "Trung bình" }, advice: { en: "Fine for most people; sensitive people can limit long outdoor exertion.", vi: "Ổn với đa số; người nhạy cảm nên hạn chế vận động mạnh ngoài trời lâu." } };
  if (aqi <= 150) return { level: "warn", label: { en: "Unhealthy for sensitive groups", vi: "Kém với người nhạy cảm" }, advice: { en: "Exercise indoors if you can; wear a mask in traffic.", vi: "Nên tập trong nhà; đeo khẩu trang khi đi đường." } };
  if (aqi <= 200) return { level: "bad", label: { en: "Unhealthy", vi: "Kém" }, advice: { en: "Keep windows closed, use a purifier, mask outdoors.", vi: "Đóng cửa sổ, dùng máy lọc không khí, đeo khẩu trang khi ra ngoài." } };
  return { level: "severe", label: { en: "Very unhealthy", vi: "Rất kém" }, advice: { en: "Stay indoors as much as possible.", vi: "Hạn chế ra ngoài tối đa." } };
}

export function uvInfo(uv: number): { level: Level; label: Bi } {
  if (uv < 3) return { level: "good", label: { en: "Low", vi: "Thấp" } };
  if (uv < 6) return { level: "ok", label: { en: "Moderate", vi: "Trung bình" } };
  if (uv < 8) return { level: "warn", label: { en: "High", vi: "Cao" } };
  if (uv < 11) return { level: "bad", label: { en: "Very high", vi: "Rất cao" } };
  return { level: "severe", label: { en: "Extreme", vi: "Cực cao" } };
}

/** Heat stress from the "feels like" temperature (NOAA heat index bands). */
export function heatInfo(feelsLike: number): { level: Level; label: Bi; advice: Bi | null } {
  if (feelsLike < 27) return { level: "good", label: { en: "Comfortable", vi: "Dễ chịu" }, advice: null };
  if (feelsLike < 32) return { level: "ok", label: { en: "Warm", vi: "Hơi nóng" }, advice: { en: "Drink water regularly.", vi: "Uống nước đều đặn." } };
  if (feelsLike < 41) return { level: "warn", label: { en: "Hot: take care", vi: "Nóng: cần lưu ý" }, advice: { en: "Heat drains focus and energy: hydrate, take breaks, do deep work in the cooler morning.", vi: "Nóng làm giảm tập trung và năng lượng: uống đủ nước, nghỉ giải lao, làm việc cần tập trung vào buổi sáng mát." } };
  return { level: "bad", label: { en: "Dangerous heat", vi: "Nóng nguy hiểm" }, advice: { en: "Avoid the midday sun and heavy exertion.", vi: "Tránh nắng trưa và vận động nặng." } };
}

export function pressureNote(delta: number | null): Bi | null {
  if (delta === null) return null;
  if (delta <= -4) return { en: `Pressure fell ${Math.abs(delta).toFixed(0)} hPa in 24h: rain likely; some people get headaches or feel sluggish.`, vi: `Áp suất giảm ${Math.abs(delta).toFixed(0)} hPa trong 24 giờ: dễ mưa; một số người bị đau đầu hoặc uể oải.` };
  if (delta >= 4) return { en: `Pressure rose ${delta.toFixed(0)} hPa in 24h: usually clearer, steadier weather.`, vi: `Áp suất tăng ${delta.toFixed(0)} hPa trong 24 giờ: thường trời quang, ổn định hơn.` };
  return null;
}

/** WMO weather codes → short description + emoji. */
export function weatherInfo(code: number, isDay: boolean): { emoji: string; label: Bi } {
  const table: [number[], string, string, Bi][] = [
    [[0], "☀️", "🌙", { en: "Clear", vi: "Trời quang" }],
    [[1, 2], "🌤", "🌙", { en: "Partly cloudy", vi: "Ít mây" }],
    [[3], "☁️", "☁️", { en: "Overcast", vi: "Nhiều mây" }],
    [[45, 48], "🌫", "🌫", { en: "Fog", vi: "Sương mù" }],
    [[51, 53, 55, 56, 57], "🌦", "🌧", { en: "Drizzle", vi: "Mưa phùn" }],
    [[61, 63, 65, 66, 67, 80, 81, 82], "🌧", "🌧", { en: "Rain", vi: "Mưa" }],
    [[71, 73, 75, 77, 85, 86], "🌨", "🌨", { en: "Snow", vi: "Tuyết" }],
    [[95, 96, 99], "⛈", "⛈", { en: "Thunderstorm", vi: "Dông" }],
  ];
  const row = table.find(([codes]) => codes.includes(code)) ?? table[2];
  return { emoji: isDay ? row[1] : row[2], label: row[3] };
}

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/** Evidence-based light habits from today's real sunrise and sunset. */
export function circadianTips(rise: Date | null, set: Date | null, env: EnvNow | null): Bi[] {
  const tips: Bi[] = [];
  if (rise) {
    const end = new Date(rise.getTime() + 2 * 3600000);
    tips.push({
      en: `Morning light: 10–20 min outside between ${hhmm(rise)} and ${hhmm(end)} anchors your body clock, lifts mood and helps you sleep tonight.`,
      vi: `Ánh sáng buổi sáng: ra ngoài 10–20 phút trong khoảng ${hhmm(rise)}–${hhmm(end)} giúp ổn định đồng hồ sinh học, nâng tâm trạng và ngủ ngon hơn tối nay.`,
    });
  }
  if (env?.today?.highUvFrom && env.today.highUvTo) {
    tips.push({
      en: `UV is high from ${env.today.highUvFrom} to ${env.today.highUvTo}: shade, hat or sunscreen.`,
      vi: `UV cao từ ${env.today.highUvFrom} đến ${env.today.highUvTo}: tìm bóng râm, đội mũ hoặc bôi kem chống nắng.`,
    });
  }
  if (set) {
    tips.push({
      en: `After sunset (${hhmm(set)}): dim lights and screens 1–2 hours before bed so melatonin can rise.`,
      vi: `Sau khi mặt trời lặn (${hhmm(set)}): giảm đèn và màn hình 1–2 giờ trước khi ngủ để cơ thể tiết melatonin.`,
    });
  }
  return tips;
}

export function describeEnvironment(env: EnvNow | null, placeLabel: string): string {
  if (!env) return "";
  const a = env.air ? aqiInfo(env.air.aqi) : null;
  const w = weatherInfo(env.weatherCode, env.isDay);
  const lines = [
    `### Weather & air where they are (${placeLabel}, Open-Meteo)`,
    `- Now: ${w.label.en}, ${env.tempC.toFixed(0)}°C (feels ${env.feelsLikeC.toFixed(0)}°C), humidity ${env.humidity}%, UV ${env.uvNow.toFixed(0)}`,
    env.today ? `- Today: ${env.today.tempMin.toFixed(0)}–${env.today.tempMax.toFixed(0)}°C, feels up to ${env.today.feelsLikeMax.toFixed(0)}°C (${heatInfo(env.today.feelsLikeMax).label.en}); UV max ${env.today.uvMax.toFixed(0)}${env.today.highUvFrom ? ` (high ${env.today.highUvFrom}–${env.today.highUvTo})` : ""}; rain chance ${env.today.rainChance ?? "?"}%` : "",
    a && env.air ? `- Air quality: US AQI ${env.air.aqi} (${a.label.en}), PM2.5 ${env.air.pm25.toFixed(0)} µg/m³` : "",
    env.pressureDelta24h !== null ? `- Pressure ${env.pressure.toFixed(0)} hPa, ${env.pressureDelta24h >= 0 ? "+" : ""}${env.pressureDelta24h} hPa over 24h` : "",
  ];
  return lines.filter(Boolean).join("\n");
}
