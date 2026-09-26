# ✦ Universal Explorer · Khám Phá Vũ Trụ

A personal, bilingual (English / Tiếng Việt) web app that reads the "energy" of each day for you and turns it into grounded guidance for growth.

It combines:

| Lens | What's computed | Source |
|---|---|---|
| Western astrology | Natal Sun/Moon/Rising, today's planets, retrogrades, transits to your chart, moon phase | `astronomy-engine` (real planetary positions) |
| Numerology | Life Path, Expression (from name), Birthday, Personal Year/Month/Day, Universal Day | Pythagorean system |
| Vietnamese / Eastern | Âm lịch, Can Chi (day/month/year), con giáp, bản mệnh (Nạp Âm), Ngũ Hành relation with today, tiết khí | Hồ Ngọc Đức lunar algorithm (UTC+7) |
| Bát Tự (Tứ Trụ) | Four pillars from real solar terms, hidden stems, ten gods, Day Master strength, five-element balance, favorable elements, 10-year luck pillars (start age from solar terms), today's ten god | `src/lib/bazi.ts` |
| Tử Vi Đẩu Số | 12 palaces, Mệnh/Thân, Cục, 14 main stars, key auxiliary stars (Tả Hữu, Xương Khúc, Lộc Tồn, Kình Đà, Khôi Việt, Không Kiếp, Thiên Mã), Tứ Hóa, Mệnh chủ/Thân chủ, đại hạn, lưu niên | `src/lib/tuvi.ts` (Vietnamese school) |
| Buddhist path (Phật pháp) | Phật lịch, Sóc/Vọng and thập trai days, upcoming Buddhist holidays (Phật Đản, Vu Lan, vía Quán Thế Âm…), mind states from your check-in (five hindrances + sorrow, with antidotes), meditation timer with bell and practice log, and Claude guidance structured by the Four Noble Truths | `src/lib/dharma.ts` |
| Nature | Season, sunrise/sunset, daylight, next full/new moon | `astronomy-engine` |
| Live space data | Astronomy Picture of the Day, solar flares, CMEs, geomagnetic storms, near-Earth asteroids, Kp index | NASA Open APIs (APOD, DONKI, NeoWs) + NOAA SWPC |
| **You** | Profile (birth data, life situation, goals, challenges, values), daily check-in (mood, energy, feelings, thoughts) and a free-form **diary** | You |

Claude weaves all of it into a daily reading, can give a deep reading of your Tử Vi + Bát Tự charts, and you can ask follow-up questions.

Tử Vi and Bát Tự need your birth time; gender sets the direction of đại hạn / đại vận. Births from 23:00 count as the next day (giờ Tý).

## Readings library

Every reading and follow-up chat (daily, Tử Vi & Bát Tự, Buddhist path) is saved automatically. Open **Library (Thư viện)** to read them again. You can filter by category, search (accents optional), copy, download as Markdown, delete, or jump back with **Continue this chat**.

Readings keep streaming when you switch tabs; a pulsing dot marks the tab that's still writing. Progress is saved every couple of seconds, so if the page is reloaded mid-reading, what was written stays saved and is marked as interrupted.

## Writing your diary

Open **Journal (Nhật ký)** → write in **Write your diary**, pick a past date to backfill if you like, and press **Save** (or ⌘/Ctrl + Enter). Drafts are kept automatically. You can write several entries a day, and edit or delete them later. The Today tab has a shortcut button. Your guide reads today's entries and short excerpts from the last few days when it writes your reading.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173.

**Claude access:** by default, the server uses your existing **Claude Code login**. It runs the local `claude` CLI in headless mode, with no tools, MCP servers or project settings, so you don't need an API key. If you ever want to use the Anthropic API instead, put `ANTHROPIC_API_KEY=...` in `.env` and it switches automatically. See `.env.example` for all options (model, effort, NASA key).

**NASA:** works out of the box with `DEMO_KEY` (about 30 requests/hour, cached for an hour per day). Get a free key at https://api.nasa.gov and set `NASA_API_KEY` for more.

### Production

```bash
npm run build
npm start        # serves the built app + API on http://localhost:8787
```

## Your data

Everything you enter (profile, check-ins, diary, readings, meditation log, language) is saved as JSON files in **`my_data/`** in this folder, one file per collection. The folder is **gitignored**, so it never gets committed. Set `DATA_DIR` in `.env` to keep it somewhere else, like a synced folder.

The browser also keeps a copy in localStorage. That way the app keeps working if the server is down; the footer then shows "my_data offline" and your changes are written to disk as soon as the server is back. The newer copy of each collection wins. Data from before this feature is moved into `my_data/` automatically the first time you open the app.

The server listens on `127.0.0.1` only, so other devices on your network can't read your diary. Only the day's context is sent to Claude when you ask for a reading. **Profile → Export backup** still gives you a single JSON file (backup files are gitignored too).

## Project layout

```
server/
  index.ts     Express API: /api/data (my_data), /api/cosmos (NASA), /api/guide (streaming Claude)
  data.ts      Atomic JSON storage in my_data/
  claude.ts    Claude backends: Claude Code CLI (default) or Anthropic SDK
  nasa.ts      NASA APOD / DONKI / NeoWs + NOAA Kp, with caching
  prompt.ts    The guide's system prompt
src/
  lib/astro.ts       Planets, aspects, ascendant, moon, sun times, seasons
  lib/lunar.ts       Vietnamese lunar calendar, Can Chi, Nạp Âm, Ngũ Hành, tiết khí
  lib/numerology.ts  Numerology numbers and meanings
  lib/snapshot.ts    Combines everything and renders the context sent to Claude
  lib/i18n.ts        English / Vietnamese strings
  components/        Dashboard, check-in, NASA card, guidance chat, journal, profile
```

> The symbolic systems here are meant as mirrors for reflection, not predictions.
