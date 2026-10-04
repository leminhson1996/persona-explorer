// Acupressure points (huyệt đạo) and the symptoms they are traditionally used for.
// Locations follow the WHO Standard Acupuncture Point Locations (2008); "cun" (thốn) is the
// person's own proportional unit. Symptom → point choices follow common acupressure and
// Vietnamese/Chinese textbook practice. This is self-care support, not a diagnosis.
import type { Bi } from "./i18n";

const bi = (en: string, vi: string): Bi => ({ en, vi });

export type MeridianId = "LU" | "LI" | "ST" | "SP" | "HT" | "SI" | "BL" | "KI" | "PC" | "TE" | "GB" | "LR" | "GV" | "CV" | "EX";

export const MERIDIANS: Record<MeridianId, { name: Bi; color: string }> = {
  LU: { name: bi("Lung (Hand Taiyin)", "Phế – Thủ Thái Âm"), color: "#9ec9ff" },
  LI: { name: bi("Large Intestine (Hand Yangming)", "Đại Trường – Thủ Dương Minh"), color: "#ffd166" },
  ST: { name: bi("Stomach (Foot Yangming)", "Vị – Túc Dương Minh"), color: "#f4a259" },
  SP: { name: bi("Spleen (Foot Taiyin)", "Tỳ – Túc Thái Âm"), color: "#e9c46a" },
  HT: { name: bi("Heart (Hand Shaoyin)", "Tâm – Thủ Thiếu Âm"), color: "#ff6b6b" },
  SI: { name: bi("Small Intestine (Hand Taiyang)", "Tiểu Trường – Thủ Thái Dương"), color: "#ff8fab" },
  BL: { name: bi("Bladder (Foot Taiyang)", "Bàng Quang – Túc Thái Dương"), color: "#4cc9f0" },
  KI: { name: bi("Kidney (Foot Shaoyin)", "Thận – Túc Thiếu Âm"), color: "#5e8bff" },
  PC: { name: bi("Pericardium (Hand Jueyin)", "Tâm Bào – Thủ Quyết Âm"), color: "#ff70a6" },
  TE: { name: bi("Triple Energizer (Hand Shaoyang)", "Tam Tiêu – Thủ Thiếu Dương"), color: "#c77dff" },
  GB: { name: bi("Gallbladder (Foot Shaoyang)", "Đởm – Túc Thiếu Dương"), color: "#80ed99" },
  LR: { name: bi("Liver (Foot Jueyin)", "Can – Túc Quyết Âm"), color: "#2ec4b6" },
  GV: { name: bi("Governor Vessel", "Mạch Đốc"), color: "#f15bb5" },
  CV: { name: bi("Conception Vessel", "Mạch Nhâm"), color: "#fee440" },
  EX: { name: bi("Extra points", "Kỳ huyệt (ngoài kinh)"), color: "#e0e0e0" },
};

export type Region = "head" | "neck" | "chest" | "abdomen" | "back" | "arm" | "hand" | "leg" | "foot";

export const REGIONS: Record<Region, Bi> = {
  head: bi("Head & face", "Đầu – mặt"),
  neck: bi("Neck & shoulders", "Cổ – vai"),
  chest: bi("Chest", "Ngực"),
  abdomen: bi("Abdomen", "Bụng"),
  back: bi("Back", "Lưng"),
  arm: bi("Arm", "Tay"),
  hand: bi("Hand", "Bàn tay"),
  leg: bi("Leg", "Chân"),
  foot: bi("Foot", "Bàn chân"),
};

export interface Acupoint {
  id: string;
  code: string; // WHO code, or the extra-point code
  vi: string; // Hán-Việt name
  zh: string; // pinyin + characters
  en: string; // English translation of the name
  meridian: MeridianId;
  region: Region;
  bilateral: boolean;
  location: Bi; // standard location
  tip?: Bi; // an easy way to find or press it
  uses: Bi; // what it's traditionally used for
  caution?: Bi;
  pregnancy?: boolean; // traditionally avoided in pregnancy
}

const P = (
  id: string, code: string, vi: string, zh: string, en: string, meridian: MeridianId, region: Region, bilateral: boolean,
  location: Bi, uses: Bi, extra: Partial<Pick<Acupoint, "tip" | "caution" | "pregnancy">> = {},
): Acupoint => ({ id, code, vi, zh, en, meridian, region, bilateral, location, uses, ...extra });

const PREGNANCY = bi("Not during pregnancy.", "Không bấm khi đang mang thai.");
const GENTLE = bi("Press gently; don't press deep.", "Ấn nhẹ, không ấn sâu.");

export const ACUPOINTS: Acupoint[] = [
  // ---------- Lung ----------
  P("LU1", "LU1", "Trung Phủ", "Zhōngfǔ 中府", "Central Treasury", "LU", "chest", true,
    bi("On the chest, level with the 1st intercostal space, 6 cun lateral to the midline, in the hollow below the outer end of the collarbone.",
      "Ở ngực, ngang khe liên sườn 1, cách đường giữa ngực 6 thốn, ở phía ngoài hõm dưới đầu ngoài xương đòn."),
    bi("Cough, wheezing, chest fullness, shoulder and upper back pain.", "Ho, khò khè, tức ngực, đau vai và lưng trên."),
    { tip: bi("Find the hollow under the outer end of the collarbone, then go about one thumb-width down.", "Tìm hõm dưới đầu ngoài xương đòn, rồi xuống khoảng một khoát ngón cái."), caution: GENTLE }),
  P("LU5", "LU5", "Xích Trạch", "Chǐzé 尺泽", "Cubit Marsh", "LU", "arm", true,
    bi("On the elbow crease, in the hollow on the thumb side of the biceps tendon.", "Trên nếp gấp khuỷu tay, chỗ lõm phía ngón cái của gân cơ nhị đầu."),
    bi("Cough with phlegm, sore throat, fever, elbow pain.", "Ho có đờm, đau họng, sốt, đau khuỷu tay."),
    { tip: bi("Bend the elbow a little so the biceps tendon stands out; the point is in the hollow just beside it, toward the thumb.", "Gập nhẹ khuỷu cho gân nhị đầu nổi lên; huyệt ở chỗ lõm ngay cạnh gân, phía ngón cái.") }),
  P("LU6", "LU6", "Khổng Tối", "Kǒngzuì 孔最", "Collection Hole", "LU", "arm", true,
    bi("On the front of the forearm, thumb side, 7 cun above the wrist crease, on the line from LU5 to LU9.", "Mặt trước cẳng tay phía ngón cái, trên lằn chỉ cổ tay 7 thốn, trên đường nối Xích Trạch – Thái Uyên."),
    bi("Acute cough, sore throat, loss of voice.", "Ho cấp, đau họng, mất tiếng."),
    { tip: bi("Just above the midpoint between the wrist crease and the elbow crease.", "Ngay trên điểm giữa lằn chỉ cổ tay và nếp gấp khuỷu một chút.") }),
  P("LU7", "LU7", "Liệt Khuyết", "Lièquē 列缺", "Broken Sequence", "LU", "arm", true,
    bi("On the thumb side of the forearm, 1.5 cun above the wrist crease, in the groove above the bony bump of the radius (radial styloid).",
      "Bờ ngoài cẳng tay (phía ngón cái), trên lằn chỉ cổ tay 1,5 thốn, trong rãnh trên mỏm trâm xương quay."),
    bi("Cough, sore throat, colds, headache and stiff neck. \"For head and neck, seek Liệt Khuyết.\"", "Ho, đau họng, cảm lạnh, đau đầu, cứng gáy. \"Đầu gáy tìm Liệt Khuyết.\""),
    { tip: bi("Interlock both hands at the thumb webs; the tip of the upper index finger lands in a small groove on the other wrist: that's the point.", "Đan hai hổ khẩu vào nhau, ngón trỏ tay trên đặt lên cổ tay kia: đầu ngón trỏ rơi vào một rãnh nhỏ, đó là huyệt.") }),
  P("LU9", "LU9", "Thái Uyên", "Tàiyuān 太渊", "Great Abyss", "LU", "arm", true,
    bi("On the wrist crease, thumb side, in the hollow where the radial pulse is felt.", "Trên lằn chỉ cổ tay phía ngón cái, chỗ lõm nơi bắt mạch quay."),
    bi("Chronic cough, shortness of breath, weak voice, wrist pain.", "Ho lâu ngày, hụt hơi, tiếng nói yếu, đau cổ tay."),
    { caution: bi("Press lightly beside the pulse, not hard on the artery.", "Ấn nhẹ cạnh mạch, không đè mạnh lên động mạch.") }),
  P("LU10", "LU10", "Ngư Tế", "Yújì 鱼际", "Fish Border", "LU", "hand", true,
    bi("On the fleshy pad of the thumb, at the middle of the 1st metacarpal bone, where the palm skin meets the back-of-hand skin.", "Ở ụ ngón cái, điểm giữa xương bàn tay 1, chỗ giáp ranh da lòng bàn tay và da mu tay."),
    bi("Sore, dry throat, hoarse voice, cough.", "Họng đau rát, khô họng, khàn tiếng, ho.")),
  P("LU11", "LU11", "Thiếu Thương", "Shàoshāng 少商", "Lesser Shang", "LU", "hand", true,
    bi("On the thumb, outer (radial) side, about 0.1 cun from the corner of the nail.", "Ở ngón cái, phía ngoài (phía xương quay), cách góc móng tay khoảng 0,1 thốn."),
    bi("Acute sore throat, cough, nosebleed.", "Đau họng cấp, ho, chảy máu cam."),
    { tip: bi("Press firmly with the tip of a fingernail for 30–60 seconds. Don't prick it yourself.", "Bấm bằng đầu móng tay 30–60 giây. Không tự chích nặn máu.") }),

  // ---------- Large intestine ----------
  P("LI4", "LI4", "Hợp Cốc", "Hégǔ 合谷", "Union Valley", "LI", "hand", true,
    bi("On the back of the hand, between the 1st and 2nd metacarpal bones, at the middle of the 2nd metacarpal on its thumb side.", "Mu bàn tay, giữa xương bàn tay 1 và 2, ở điểm giữa bờ ngoài (phía ngón cái) xương bàn tay 2."),
    bi("Headache, toothache, sore throat, colds, facial pain, menstrual pain, constipation. \"For face and mouth, Hợp Cốc.\"", "Đau đầu, đau răng, đau họng, cảm, đau vùng mặt, đau bụng kinh, táo bón. \"Mặt miệng thu Hợp Cốc.\""),
    { tip: bi("Press the thumb against the index finger: the point is at the top of the bulging muscle. Then relax the hand and press toward the index bone.", "Khép ngón cái sát ngón trỏ: huyệt ở đỉnh chỗ cơ nổi cao nhất. Thả lỏng tay rồi ấn chếch về phía xương ngón trỏ."), caution: PREGNANCY, pregnancy: true }),
  P("LI10", "LI10", "Thủ Tam Lý", "Shǒusānlǐ 手三里", "Arm Three Miles", "LI", "arm", true,
    bi("On the back-outer forearm, 2 cun below LI11, on the line from LI11 to the wrist (LI5).", "Mặt sau-ngoài cẳng tay, dưới Khúc Trì 2 thốn, trên đường nối Khúc Trì với cổ tay (Dương Khê)."),
    bi("Elbow and forearm pain, tennis elbow, arm numbness, stomach upset.", "Đau khuỷu và cẳng tay, viêm điểm bám gân khuỷu, tê tay, đau bụng."),
    { tip: bi("Three finger-widths below the outer end of the elbow crease; it's usually tender.", "Dưới đầu ngoài nếp khuỷu ba khoát ngón tay; thường ấn thấy ê.") }),
  P("LI11", "LI11", "Khúc Trì", "Qūchí 曲池", "Pool at the Bend", "LI", "arm", true,
    bi("With the elbow bent, at the outer end of the elbow crease, midway between LU5 and the bony bump on the outside of the elbow (lateral epicondyle).", "Gập khuỷu tay: huyệt ở đầu ngoài nếp gấp khuỷu, giữa Xích Trạch và lồi cầu ngoài xương cánh tay."),
    bi("Fever, sore throat, itchy skin and hives, elbow pain, high blood pressure (as support).", "Sốt, đau họng, ngứa và mề đay, đau khuỷu tay, hỗ trợ tăng huyết áp.")),
  P("LI15", "LI15", "Kiên Ngung", "Jiānyú 肩髃", "Shoulder Bone", "LI", "arm", true,
    bi("On the shoulder, in the hollow at the front of the acromion, which appears when the arm is raised to the side.", "Ở vai, chỗ lõm phía trước mỏm cùng vai, hiện rõ khi giơ ngang cánh tay."),
    bi("Shoulder pain and stiffness, difficulty raising the arm.", "Đau, cứng khớp vai, khó giơ tay."),
    { tip: bi("Raise the arm sideways: two hollows appear on the shoulder; the point is in the front one.", "Giơ ngang tay sẽ thấy hai hõm ở đầu vai; huyệt ở hõm phía trước.") }),
  P("LI20", "LI20", "Nghênh Hương", "Yíngxiāng 迎香", "Welcome Fragrance", "LI", "head", true,
    bi("Beside the nose, in the smile line (nasolabial groove), level with the middle of the outer edge of the nostril.", "Cạnh mũi, trong rãnh mũi – má, ngang điểm giữa bờ ngoài cánh mũi."),
    bi("Blocked or runny nose, sinus congestion, loss of smell.", "Nghẹt mũi, sổ mũi, viêm xoang, giảm khứu giác."),
    { tip: bi("Use both index fingers at once and rub in small circles or up and down along the side of the nose.", "Dùng hai ngón trỏ day tròn hoặc xát lên xuống dọc hai bên cánh mũi.") }),

  // ---------- Stomach ----------
  P("ST2", "ST2", "Tứ Bạch", "Sìbái 四白", "Four Whites", "ST", "head", true,
    bi("Below the eye, in the small hollow of the cheekbone (infraorbital foramen), straight below the pupil.", "Dưới mắt, ở chỗ lõm nhỏ trên xương gò má (lỗ dưới ổ mắt), thẳng dưới đồng tử."),
    bi("Tired or dry eyes, twitching eyelid, sinus pressure.", "Mỏi mắt, khô mắt, giật mí mắt, nặng xoang."),
    { caution: bi("Press the bone gently, never the eyeball.", "Ấn nhẹ lên xương, tuyệt đối không ấn vào nhãn cầu.") }),
  P("ST6", "ST6", "Giáp Xa", "Jiáchē 颊车", "Jaw Bone", "ST", "head", true,
    bi("One finger-width forward and up from the angle of the jaw, on the muscle that bulges when you clench your teeth.", "Trên và trước góc hàm dưới một khoát ngón tay, chỗ cơ cắn nổi lên khi nghiến răng."),
    bi("Toothache (lower teeth), jaw pain, clenching.", "Đau răng (hàm dưới), đau hàm, nghiến răng.")),
  P("ST7", "ST7", "Hạ Quan", "Xiàguān 下关", "Below the Joint", "ST", "head", true,
    bi("In front of the ear, in the hollow below the cheekbone arch; it's open with the mouth closed and fills when the mouth opens.", "Trước tai, chỗ lõm dưới cung gò má; ngậm miệng thấy lõm, há miệng thì lõm mất."),
    bi("Jaw joint pain, toothache (upper teeth), earache.", "Đau khớp hàm, đau răng (hàm trên), đau tai.")),
  P("ST25", "ST25", "Thiên Khu", "Tiānshū 天枢", "Celestial Pivot", "ST", "abdomen", true,
    bi("On the abdomen, level with the navel, 2 cun to the side of its centre.", "Ở bụng, ngang rốn, cách giữa rốn 2 thốn."),
    bi("Constipation, diarrhoea, bloating, abdominal pain.", "Táo bón, tiêu chảy, đầy hơi, đau bụng."),
    { tip: bi("About three finger-widths beside the navel. Press slowly while breathing out.", "Cách rốn khoảng ba khoát ngón tay. Ấn từ từ khi thở ra."), caution: bi("Not on a full stomach, and not during pregnancy.", "Không bấm khi vừa ăn no hoặc khi mang thai."), pregnancy: true }),
  P("ST35", "ST35", "Độc Tỵ", "Dúbí 犊鼻", "Calf's Nose", "ST", "leg", true,
    bi("Knee slightly bent: in the hollow below the kneecap, on the outer side of the patellar tendon (the outer \"eye\" of the knee).", "Gối hơi co: chỗ lõm dưới xương bánh chè, phía ngoài gân bánh chè (mắt gối ngoài)."),
    bi("Knee pain, stiffness and swelling.", "Đau, cứng, sưng khớp gối.")),
  P("ST36", "ST36", "Túc Tam Lý", "Zúsānlǐ 足三里", "Leg Three Miles", "ST", "leg", true,
    bi("On the front of the leg, 3 cun below ST35, one finger-width (middle finger) outside the front crest of the shinbone.", "Mặt trước cẳng chân, dưới Độc Tỵ 3 thốn, cách mào xương chày một khoát ngón tay (ngón giữa) ra phía ngoài."),
    bi("Indigestion, bloating, nausea, fatigue, low immunity, knee pain. \"For the belly, keep to Tam Lý.\"", "Ăn khó tiêu, đầy bụng, buồn nôn, mệt mỏi, sức đề kháng kém, đau gối. \"Bụng dạ Tam Lý lưu.\""),
    { tip: bi("Put four fingers together (3 cun) below the outer eye of the knee; the point is under the little finger, one finger-width outside the shinbone.", "Đặt bốn ngón tay khép (3 thốn) dưới mắt gối ngoài; huyệt ở ngay dưới ngón út, lệch ra ngoài xương ống chân một khoát ngón.") }),
  P("ST40", "ST40", "Phong Long", "Fēnglóng 丰隆", "Abundant Bulge", "ST", "leg", true,
    bi("On the outer front of the leg, 8 cun above the outer ankle bone (level with the middle of the shin), two finger-widths outside the shinbone crest.", "Mặt trước-ngoài cẳng chân, trên đỉnh mắt cá ngoài 8 thốn (ngang giữa cẳng chân), cách mào xương chày hai khoát ngón tay."),
    bi("Cough with lots of phlegm, chest tightness, dizziness with heaviness.", "Ho nhiều đờm, tức ngực, chóng mặt kèm nặng đầu.")),
  P("ST41", "ST41", "Giải Khê", "Jiěxī 解溪", "Ravine Divide", "ST", "foot", true,
    bi("On the front of the ankle, level with the tips of the ankle bones, in the hollow between the two big tendons.", "Ở giữa nếp gấp trước cổ chân, ngang đỉnh mắt cá, chỗ lõm giữa hai gân lớn (gân duỗi dài ngón cái và gân duỗi chung các ngón)."),
    bi("Ankle pain, frontal headache, dizziness, constipation.", "Đau cổ chân, đau đầu vùng trán, chóng mặt, táo bón.")),
  P("ST44", "ST44", "Nội Đình", "Nèitíng 内庭", "Inner Courtyard", "ST", "foot", true,
    bi("On top of the foot, between the 2nd and 3rd toes, just behind the web.", "Mu bàn chân, giữa ngón 2 và ngón 3, ngay sau mép da nối hai ngón."),
    bi("Toothache, gum pain, frontal headache, acid stomach, nosebleed.", "Đau răng, sưng lợi, đau đầu vùng trán, ợ chua, chảy máu cam.")),

  // ---------- Spleen ----------
  P("SP4", "SP4", "Công Tôn", "Gōngsūn 公孙", "Grandfather Grandson", "SP", "foot", true,
    bi("On the inner edge of the foot, in the hollow in front of and below the base of the 1st metatarsal, where the sole skin meets the top skin.", "Bờ trong bàn chân, chỗ lõm phía trước – dưới nền xương bàn chân 1, nơi tiếp giáp da gan chân và da mu chân."),
    bi("Stomach pain, nausea, bloating, diarrhoea.", "Đau dạ dày, buồn nôn, đầy bụng, tiêu chảy."),
    { tip: bi("Slide your thumb along the inner edge of the foot from the big toe toward the heel; it stops in a hollow at the first bump.", "Vuốt ngón cái dọc bờ trong bàn chân từ ngón cái về gót; ngón tay dừng ở chỗ lõm trước chỗ xương nhô lên.") }),
  P("SP6", "SP6", "Tam Âm Giao", "Sānyīnjiāo 三阴交", "Three Yin Intersection", "SP", "leg", true,
    bi("On the inner leg, 3 cun above the tip of the inner ankle bone, just behind the edge of the shinbone.", "Mặt trong cẳng chân, trên đỉnh mắt cá trong 3 thốn, sát bờ sau xương chày."),
    bi("Menstrual pain and irregular periods, insomnia, indigestion, leg heaviness.", "Đau bụng kinh, kinh nguyệt không đều, mất ngủ, ăn khó tiêu, nặng chân."),
    { tip: bi("Place four fingers together just above the inner ankle bone; the point is above the top finger, behind the shinbone.", "Đặt bốn ngón tay khép ngay trên mắt cá trong; huyệt ở trên ngón trên cùng, sát sau xương ống chân."), caution: PREGNANCY, pregnancy: true }),
  P("SP8", "SP8", "Địa Cơ", "Dìjī 地机", "Earth Pivot", "SP", "leg", true,
    bi("On the inner leg, 3 cun below SP9, just behind the edge of the shinbone.", "Mặt trong cẳng chân, dưới Âm Lăng Tuyền 3 thốn, sát bờ sau xương chày."),
    bi("Acute menstrual cramps, abdominal pain, swelling.", "Đau bụng kinh cấp, đau bụng, phù."), { caution: PREGNANCY, pregnancy: true }),
  P("SP9", "SP9", "Âm Lăng Tuyền", "Yīnlíngquán 阴陵泉", "Yin Mound Spring", "SP", "leg", true,
    bi("On the inner leg, in the hollow below the inner knob of the shinbone (medial tibial condyle).", "Mặt trong cẳng chân, chỗ lõm dưới lồi cầu trong xương chày."),
    bi("Water retention and swollen legs, bloating, diarrhoea, inner knee pain.", "Phù nề, nặng chân, đầy bụng, tiêu chảy, đau mặt trong gối."),
    { tip: bi("Run your thumb up the inner edge of the shinbone; it stops in a hollow just below the knee.", "Vuốt ngón cái dọc bờ trong xương ống chân từ dưới lên; ngón tay dừng lại ở chỗ lõm ngay dưới gối.") }),
  P("SP10", "SP10", "Huyết Hải", "Xuèhǎi 血海", "Sea of Blood", "SP", "leg", true,
    bi("On the inner front of the thigh, 2 cun above the inner upper corner of the kneecap, on the bulge of the inner thigh muscle.", "Mặt trước-trong đùi, trên góc trên-trong xương bánh chè 2 thốn, chỗ nổi cao của cơ rộng trong."),
    bi("Menstrual problems, itchy skin, hives, eczema, knee pain.", "Rối loạn kinh nguyệt, ngứa, mề đay, chàm, đau gối."),
    { tip: bi("Sitting with the knee bent, cup the opposite palm over the kneecap (thumb inward): the tip of the thumb lands on the point.", "Ngồi co gối, úp lòng bàn tay bên kia lên xương bánh chè (ngón cái hướng vào trong): đầu ngón cái chạm đâu là huyệt."), caution: bi("Use gently during pregnancy.", "Thận trọng, chỉ ấn nhẹ khi mang thai.") }),
  P("SP15", "SP15", "Đại Hoành", "Dàhéng 大横", "Great Horizontal", "SP", "abdomen", true,
    bi("Level with the navel, 4 cun to the side of its centre.", "Ngang rốn, cách giữa rốn 4 thốn."),
    bi("Constipation, bloating, lower abdominal pain.", "Táo bón, đầy hơi, đau bụng dưới."), { caution: PREGNANCY, pregnancy: true }),

  // ---------- Heart, small intestine ----------
  P("HT7", "HT7", "Thần Môn", "Shénmén 神门", "Spirit Gate", "HT", "arm", true,
    bi("On the wrist crease at the little-finger side, in the hollow on the thumb side of the tendon there (flexor carpi ulnaris).", "Trên lằn chỉ cổ tay phía ngón út, chỗ lõm sát bờ ngoài (phía ngón cái) gân cơ gấp cổ tay trụ."),
    bi("Insomnia, anxiety, palpitations, poor memory.", "Mất ngủ, lo âu, hồi hộp, hay quên.")),
  P("SI3", "SI3", "Hậu Khê", "Hòuxī 后溪", "Back Ravine", "SI", "hand", true,
    bi("On the little-finger edge of the hand, in the hollow just behind the knuckle of the little finger, at the end of the crease when you make a loose fist.", "Bờ trong bàn tay (phía ngón út), chỗ lõm sau khớp bàn – ngón 5, ở đầu lằn chỉ tâm đạo khi nắm hờ tay."),
    bi("Stiff neck, upper back and low back pain, occipital headache.", "Cứng gáy, đau lưng trên và thắt lưng, đau đầu vùng gáy."),
    { tip: bi("Rub it back and forth against the edge of a table, or press while gently turning your head.", "Có thể lăn mép bàn tay vào cạnh bàn, hoặc vừa ấn vừa xoay cổ nhẹ nhàng.") }),
  P("SI11", "SI11", "Thiên Tông", "Tiānzōng 天宗", "Celestial Gathering", "SI", "back", true,
    bi("In the middle of the shoulder blade: one third of the way down from the middle of its spine to its lower tip, in a hollow.", "Giữa xương bả vai, chỗ lõm tại điểm nối 1/3 trên và 2/3 dưới của đường từ điểm giữa gai vai đến góc dưới xương bả vai."),
    bi("Shoulder blade pain, shoulder and upper arm pain.", "Đau bả vai, đau vai và cánh tay."),
    { tip: bi("Usually very tender. Ask someone to press with the thumb, or lean on a massage ball against a wall.", "Thường rất ê khi ấn. Nhờ người khác ấn bằng ngón cái, hoặc tựa lưng vào bóng massage áp tường.") }),
  P("SI19", "SI19", "Thính Cung", "Tīnggōng 听宫", "Palace of Hearing", "SI", "head", true,
    bi("In front of the small flap of the ear (tragus), in the hollow that deepens when the mouth opens.", "Trước bình tai, chỗ lõm giữa bình tai và lồi cầu xương hàm dưới; há miệng thấy lõm rõ."),
    bi("Ringing in the ears, earache, reduced hearing, jaw pain.", "Ù tai, đau tai, nghe kém, đau khớp hàm."),
    { tip: bi("Open the mouth slightly and press the hollow in front of the ear.", "Hơi há miệng rồi ấn vào chỗ lõm ngay trước tai.") }),

  // ---------- Bladder ----------
  P("BL2", "BL2", "Toản Trúc", "Cuánzhú 攒竹", "Gathered Bamboo", "BL", "head", true,
    bi("In the hollow at the inner end of the eyebrow.", "Chỗ lõm ở đầu trong lông mày."),
    bi("Frontal headache, tired eyes, blurred vision, sinus congestion.", "Đau đầu vùng trán, mỏi mắt, nhìn mờ, nghẹt xoang."),
    { tip: bi("Press upward into the brow ridge with the thumbs, elbows on the table.", "Chống khuỷu lên bàn, dùng hai ngón cái ấn chếch lên vào cung lông mày.") }),
  P("BL12", "BL12", "Phong Môn", "Fēngmén 风门", "Wind Gate", "BL", "back", true,
    bi("On the upper back, 1.5 cun to the side of the lower edge of the 2nd thoracic vertebra (T2).", "Ở lưng trên, dưới mỏm gai đốt sống ngực 2, đo ngang ra 1,5 thốn."),
    bi("Early colds, cough, stiff neck and upper back.", "Cảm mới mắc, ho, cứng cổ và lưng trên."),
    { tip: bi("Keep this area warm; a warm towel or hair-dryer warmth at the onset of a cold helps.", "Giữ ấm vùng này; chườm khăn ấm khi vừa bị cảm.") }),
  P("BL13", "BL13", "Phế Du", "Fèishū 肺俞", "Lung Shu", "BL", "back", true,
    bi("On the upper back, 1.5 cun to the side of the lower edge of the 3rd thoracic vertebra (T3).", "Ở lưng trên, dưới mỏm gai đốt sống ngực 3, đo ngang ra 1,5 thốn."),
    bi("Cough, asthma, chest tightness, recurring colds.", "Ho, hen, tức ngực, hay bị cảm."),
    { tip: bi("Roughly level with the top inner corner of the shoulder blade.", "Khoảng ngang góc trên – trong của xương bả vai."), caution: GENTLE }),
  P("BL15", "BL15", "Tâm Du", "Xīnshū 心俞", "Heart Shu", "BL", "back", true,
    bi("On the back, 1.5 cun to the side of the lower edge of the 5th thoracic vertebra (T5).", "Ở lưng, dưới mỏm gai đốt sống ngực 5, đo ngang ra 1,5 thốn."),
    bi("Palpitations, anxiety, insomnia.", "Hồi hộp, lo âu, mất ngủ."), { caution: GENTLE }),
  P("BL17", "BL17", "Cách Du", "Géshū 膈俞", "Diaphragm Shu", "BL", "back", true,
    bi("On the back, 1.5 cun to the side of the lower edge of the 7th thoracic vertebra (T7), level with the lower tips of the shoulder blades.", "Ở lưng, dưới mỏm gai đốt sống ngực 7 (ngang góc dưới xương bả vai), đo ngang ra 1,5 thốn."),
    bi("Hiccups, acid reflux, itchy skin.", "Nấc cụt, ợ chua, ngứa da."), { caution: GENTLE }),
  P("BL20", "BL20", "Tỳ Du", "Píshū 脾俞", "Spleen Shu", "BL", "back", true,
    bi("On the back, 1.5 cun to the side of the lower edge of the 11th thoracic vertebra (T11).", "Ở lưng, dưới mỏm gai đốt sống ngực 11, đo ngang ra 1,5 thốn."),
    bi("Poor appetite, bloating, loose stools, fatigue.", "Ăn kém, đầy bụng, phân lỏng, mệt mỏi.")),
  P("BL21", "BL21", "Vị Du", "Wèishū 胃俞", "Stomach Shu", "BL", "back", true,
    bi("On the back, 1.5 cun to the side of the lower edge of the 12th thoracic vertebra (T12).", "Ở lưng, dưới mỏm gai đốt sống ngực 12, đo ngang ra 1,5 thốn."),
    bi("Stomach pain, nausea, indigestion.", "Đau dạ dày, buồn nôn, ăn khó tiêu.")),
  P("BL23", "BL23", "Thận Du", "Shènshū 肾俞", "Kidney Shu", "BL", "back", true,
    bi("On the lower back, 1.5 cun to the side of the lower edge of the 2nd lumbar vertebra (L2), roughly level with the navel.", "Ở thắt lưng, dưới mỏm gai đốt sống thắt lưng 2 (ngang rốn phía sau), đo ngang ra 1,5 thốn."),
    bi("Low back pain, tiredness, cold lower back, frequent urination, ringing ears.", "Đau thắt lưng, mệt mỏi, lạnh lưng, tiểu nhiều, ù tai."),
    { tip: bi("Rub both palms together until warm, then rub up and down over the lower back.", "Xoa hai lòng bàn tay cho ấm rồi xát lên xuống vùng thắt lưng.") }),
  P("BL25", "BL25", "Đại Trường Du", "Dàchángshū 大肠俞", "Large Intestine Shu", "BL", "back", true,
    bi("On the lower back, 1.5 cun to the side of the lower edge of the 4th lumbar vertebra (L4), level with the top of the hip bones (iliac crests).", "Ở thắt lưng, dưới mỏm gai đốt sống thắt lưng 4 (ngang mào chậu), đo ngang ra 1,5 thốn."),
    bi("Low back pain, sciatica, constipation, bloating.", "Đau thắt lưng, đau thần kinh tọa, táo bón, đầy hơi.")),
  P("BL40", "BL40", "Ủy Trung", "Wěizhōng 委中", "Bend Middle", "BL", "leg", true,
    bi("At the midpoint of the crease behind the knee.", "Điểm giữa nếp lằn khoeo chân."),
    bi("Low back pain, sciatica, knee pain, calf cramps. \"For the back, seek Ủy Trung.\"", "Đau lưng, đau thần kinh tọa, đau gối, chuột rút. \"Lưng gù Ủy Trung cầu.\""),
    { caution: bi("Press gently; avoid it if there are varicose veins.", "Ấn nhẹ; tránh nếu có giãn tĩnh mạch ở khoeo.") }),
  P("BL57", "BL57", "Thừa Sơn", "Chéngshān 承山", "Support the Mountain", "BL", "leg", true,
    bi("On the back of the calf, where the two bellies of the calf muscle meet the Achilles tendon; a \"人\"-shaped hollow appears when you stand on tiptoe.", "Mặt sau cẳng chân, nơi hai bắp cơ sinh đôi gặp gân gót, tạo chỗ lõm hình chữ \"人\" khi kiễng chân."),
    bi("Calf cramps, low back pain, sciatica, haemorrhoids.", "Chuột rút bắp chân, đau lưng, đau thần kinh tọa, trĩ.")),
  P("BL60", "BL60", "Côn Lôn", "Kūnlún 昆仑", "Kunlun Mountains", "BL", "foot", true,
    bi("Behind the ankle, in the hollow between the tip of the outer ankle bone and the Achilles tendon.", "Sau mắt cá ngoài, chỗ lõm giữa đỉnh mắt cá ngoài và gân gót."),
    bi("Low back pain, sciatica, neck pain, occipital headache, heel and ankle pain.", "Đau lưng, đau thần kinh tọa, đau gáy, đau đầu vùng chẩm, đau gót và cổ chân."),
    { caution: PREGNANCY, pregnancy: true }),
  P("BL62", "BL62", "Thân Mạch", "Shēnmài 申脉", "Extending Vessel", "BL", "foot", true,
    bi("In the hollow directly below the tip of the outer ankle bone.", "Chỗ lõm ngay dưới đỉnh mắt cá ngoài."),
    bi("Insomnia (with KI6), dizziness, back and ankle pain.", "Mất ngủ (phối hợp Chiếu Hải), chóng mặt, đau lưng, đau cổ chân.")),

  // ---------- Kidney ----------
  P("KI1", "KI1", "Dũng Tuyền", "Yǒngquán 涌泉", "Gushing Spring", "KI", "foot", true,
    bi("On the sole, in the deepest hollow when the toes are curled, about one third of the way from the base of the 2nd–3rd toes to the back of the heel.", "Ở gan bàn chân, chỗ lõm sâu nhất khi co các ngón chân, khoảng 1/3 trước của đường từ kẽ ngón 2–3 đến gót chân."),
    bi("Insomnia, restlessness, headache at the top of the head, dizziness, fatigue; brings energy down.", "Mất ngủ, bứt rứt, đau đỉnh đầu, chóng mặt, mệt mỏi; giúp \"dẫn hỏa quy nguyên\"."),
    { tip: bi("Before bed, soak the feet in warm water and rub the point with the opposite palm 50–100 times.", "Trước khi ngủ, ngâm chân nước ấm rồi xát huyệt bằng lòng bàn tay bên kia 50–100 lần.") }),
  P("KI3", "KI3", "Thái Khê", "Tàixī 太溪", "Great Ravine", "KI", "foot", true,
    bi("Behind the ankle, in the hollow between the tip of the inner ankle bone and the Achilles tendon.", "Sau mắt cá trong, chỗ lõm giữa đỉnh mắt cá trong và gân gót."),
    bi("Ringing ears, dry throat, low back pain, insomnia, heel pain.", "Ù tai, khô họng, đau lưng, mất ngủ, đau gót chân.")),
  P("KI6", "KI6", "Chiếu Hải", "Zhàohǎi 照海", "Shining Sea", "KI", "foot", true,
    bi("1 cun below the tip of the inner ankle bone, in the hollow beneath it.", "Dưới đỉnh mắt cá trong 1 thốn, chỗ lõm dưới mắt cá trong."),
    bi("Dry, sore throat, dry cough, hoarse voice, insomnia.", "Khô, đau họng, ho khan, khàn tiếng, mất ngủ."),
    { tip: bi("Paired with LU7 (Liệt Khuyết) it is the classic combination for a dry throat.", "Phối với Liệt Khuyết là cặp huyệt kinh điển cho chứng họng khô.") }),
  P("KI27", "KI27", "Du Phủ", "Shūfǔ 俞府", "Shu Mansion", "KI", "chest", true,
    bi("On the chest, just below the collarbone, 2 cun to the side of the midline.", "Ở ngực, chỗ lõm sát bờ dưới xương đòn, cách đường giữa ngực 2 thốn."),
    bi("Cough, wheezing, chest tightness.", "Ho, khò khè, tức ngực."), { caution: GENTLE }),

  // ---------- Pericardium, triple energizer ----------
  P("PC6", "PC6", "Nội Quan", "Nèiguān 内关", "Inner Pass", "PC", "arm", true,
    bi("On the inside of the forearm, 2 cun above the wrist crease, between the two central tendons.", "Mặt trước cẳng tay, trên lằn chỉ cổ tay 2 thốn, giữa hai gân (gân cơ gan tay dài và gân cơ gấp cổ tay quay)."),
    bi("Nausea, motion sickness, stomach upset, palpitations, anxiety, chest tightness, insomnia. \"For heart and chest, consult Nội Quan.\"", "Buồn nôn, say xe, đau dạ dày, hồi hộp, lo âu, tức ngực, mất ngủ. \"Tâm ngực Nội Quan mưu.\""),
    { tip: bi("Lay three fingers (index, middle, ring) across the wrist from the crease; the point is just past the index finger, between the tendons.", "Đặt ba ngón tay (trỏ, giữa, nhẫn) khép ngang cổ tay tính từ lằn chỉ; huyệt ở ngay mép ngón trỏ, giữa hai gân.") }),
  P("PC7", "PC7", "Đại Lăng", "Dàlíng 大陵", "Great Mound", "PC", "arm", true,
    bi("At the middle of the wrist crease, between the two central tendons.", "Ở điểm giữa lằn chỉ cổ tay, giữa hai gân."),
    bi("Wrist pain, carpal tunnel discomfort, palpitations, insomnia.", "Đau cổ tay, tê do hội chứng ống cổ tay, hồi hộp, mất ngủ.")),
  P("PC8", "PC8", "Lao Cung", "Láogōng 劳宫", "Palace of Toil", "PC", "hand", true,
    bi("In the centre of the palm, between the 2nd and 3rd metacarpal bones, where the tip of the middle finger touches when you make a fist.", "Giữa lòng bàn tay, giữa xương bàn tay 2 và 3, chỗ đầu ngón giữa chạm vào khi nắm tay."),
    bi("Anxiety, restlessness, mouth ulcers, hot sweaty palms.", "Lo âu, bứt rứt, nhiệt miệng, lòng bàn tay nóng, ra mồ hôi tay.")),
  P("TE3", "TE3", "Trung Chử", "Zhōngzhǔ 中渚", "Central Islet", "TE", "hand", true,
    bi("On the back of the hand, between the 4th and 5th metacarpal bones, in the hollow just behind the knuckle of the ring finger.", "Mu bàn tay, giữa xương bàn tay 4 và 5, chỗ lõm sau khớp bàn – ngón 4."),
    bi("Ringing ears, temple headache, shoulder and neck pain.", "Ù tai, đau đầu vùng thái dương, đau vai gáy.")),
  P("TE5", "TE5", "Ngoại Quan", "Wàiguān 外关", "Outer Pass", "TE", "arm", true,
    bi("On the back of the forearm, 2 cun above the wrist crease, between the two forearm bones (opposite PC6).", "Mặt sau cẳng tay, trên lằn chỉ cổ tay 2 thốn, giữa xương quay và xương trụ (đối diện Nội Quan)."),
    bi("Colds and fever, temple headache, ear problems, wrist and arm pain.", "Cảm sốt, đau đầu vùng thái dương, bệnh ở tai, đau cổ tay và cánh tay.")),
  P("TE6", "TE6", "Chi Câu", "Zhīgōu 支沟", "Branch Ditch", "TE", "arm", true,
    bi("On the back of the forearm, 3 cun above the wrist crease, between the two forearm bones.", "Mặt sau cẳng tay, trên lằn chỉ cổ tay 3 thốn, giữa xương quay và xương trụ."),
    bi("Constipation, pain along the ribs, shoulder pain.", "Táo bón, đau mạn sườn, đau vai.")),
  P("TE17", "TE17", "Ế Phong", "Yìfēng 翳风", "Wind Screen", "TE", "head", true,
    bi("Behind the earlobe, in the hollow between the bone behind the ear (mastoid) and the angle of the jaw.", "Sau dái tai, chỗ lõm giữa mỏm chũm và góc hàm dưới."),
    bi("Ringing ears, earache, jaw pain, facial tension.", "Ù tai, đau tai, đau hàm, căng cơ mặt."), { caution: GENTLE }),

  // ---------- Gallbladder ----------
  P("GB14", "GB14", "Dương Bạch", "Yángbái 阳白", "Yang White", "GB", "head", true,
    bi("On the forehead, 1 cun above the eyebrow, straight above the pupil.", "Trên trán, trên lông mày 1 thốn, thẳng đồng tử."),
    bi("Frontal headache, tired eyes, twitching eyelid.", "Đau đầu vùng trán, mỏi mắt, giật mí mắt.")),
  P("GB20", "GB20", "Phong Trì", "Fēngchí 风池", "Wind Pool", "GB", "neck", true,
    bi("At the back of the neck, below the skull, in the hollow between the two big neck muscles (sternocleidomastoid and trapezius), level with the earlobes.", "Sau gáy, dưới xương chẩm, chỗ lõm giữa đầu trên cơ ức đòn chũm và cơ thang, ngang dái tai."),
    bi("Headache, stiff neck, dizziness, colds, tired eyes, high blood pressure (as support).", "Đau đầu, cứng gáy, chóng mặt, cảm, mỏi mắt, hỗ trợ tăng huyết áp."),
    { tip: bi("Hold the head with both hands and place the thumbs in the two hollows under the skull; press slightly upward and inward.", "Hai tay ôm đầu, đặt hai ngón cái vào hai hõm dưới xương chẩm; ấn hơi chếch lên trên và vào trong.") }),
  P("GB21", "GB21", "Kiên Tỉnh", "Jiānjǐng 肩井", "Shoulder Well", "GB", "neck", true,
    bi("On top of the shoulder, halfway between the bony bump at the base of the neck (C7) and the outer tip of the shoulder (acromion).", "Ở đỉnh vai, điểm giữa đường nối mỏm gai đốt sống cổ 7 và đầu ngoài mỏm cùng vai."),
    bi("Neck and shoulder tension, stiff neck, headache from tension.", "Căng cứng vai gáy, vẹo cổ, đau đầu do căng thẳng."),
    { tip: bi("Squeeze the muscle on top of the shoulder between the thumb and fingers, or press down with the middle finger.", "Bóp khối cơ trên vai giữa ngón cái và các ngón còn lại, hoặc dùng ngón giữa ấn xuống."), caution: bi("Not during pregnancy; don't press hard in frail or elderly people.", "Không bấm khi mang thai; không ấn mạnh ở người yếu, người cao tuổi."), pregnancy: true }),
  P("GB30", "GB30", "Hoàn Khiêu", "Huántiào 环跳", "Jumping Round", "GB", "back", true,
    bi("On the buttock, one third of the way from the top of the thigh bone (greater trochanter) toward the base of the spine (sacral hiatus).", "Ở mông, điểm nối 1/3 ngoài và 2/3 trong của đường từ mấu chuyển lớn xương đùi đến khe xương cùng."),
    bi("Sciatica, hip and buttock pain, leg pain.", "Đau thần kinh tọa, đau hông và mông, đau chân."),
    { tip: bi("Lie on your side; press deeply with the thumb or elbow, or sit on a tennis ball.", "Nằm nghiêng; ấn sâu bằng ngón cái hoặc khuỷu tay, hoặc ngồi lên một quả bóng tennis.") }),
  P("GB31", "GB31", "Phong Thị", "Fēngshì 风市", "Wind Market", "GB", "leg", true,
    bi("On the outer thigh, where the tip of the middle finger rests when standing with the arms by the sides (7 cun above the knee crease).", "Mặt ngoài đùi, đứng thẳng thả tay xuôi, đầu ngón giữa chạm đâu là huyệt (trên nếp khoeo 7 thốn)."),
    bi("Itching all over, thigh numbness, sciatica along the outer leg.", "Ngứa toàn thân, tê bì đùi, đau dọc mặt ngoài chân.")),
  P("GB34", "GB34", "Dương Lăng Tuyền", "Yánglíngquán 阳陵泉", "Yang Mound Spring", "GB", "leg", true,
    bi("On the outer leg, in the hollow in front of and below the head of the fibula (the small knob below the outside of the knee).", "Mặt ngoài cẳng chân, chỗ lõm phía trước – dưới đầu xương mác."),
    bi("Muscle cramps and stiffness, knee pain, sciatica, rib-side pain; the meeting point of the sinews.", "Chuột rút, co cứng cơ, đau gối, đau thần kinh tọa, đau mạn sườn; là \"cân hội\".")),
  P("GB39", "GB39", "Huyền Chung", "Xuánzhōng 悬钟", "Suspended Bell", "GB", "leg", true,
    bi("On the outer leg, 3 cun above the tip of the outer ankle bone, in front of the fibula.", "Mặt ngoài cẳng chân, trên đỉnh mắt cá ngoài 3 thốn, sát bờ trước xương mác."),
    bi("Stiff neck, neck that can't turn, leg pain.", "Vẹo cổ, cổ khó xoay, đau chân.")),

  // ---------- Liver ----------
  P("LR2", "LR2", "Hành Gian", "Xíngjiān 行间", "Moving Between", "LR", "foot", true,
    bi("On top of the foot, between the 1st and 2nd toes, just behind the web.", "Mu bàn chân, giữa ngón 1 và ngón 2, ngay sau mép da nối hai ngón."),
    bi("Irritability, red eyes, headache from tension, insomnia.", "Cáu gắt, đỏ mắt, đau đầu do căng thẳng, mất ngủ.")),
  P("LR3", "LR3", "Thái Xung", "Tàichōng 太冲", "Great Surge", "LR", "foot", true,
    bi("On top of the foot, between the 1st and 2nd metatarsal bones, in the hollow just in front of where the two bones meet.", "Mu bàn chân, giữa xương bàn chân 1 và 2, chỗ lõm phía trước nơi hai nền xương gặp nhau."),
    bi("Stress, irritability, headache, dizziness, menstrual pain, high blood pressure (as support). With LI4 it forms the \"Four Gates\".", "Căng thẳng, cáu gắt, đau đầu, chóng mặt, đau bụng kinh, hỗ trợ tăng huyết áp. Cùng Hợp Cốc tạo thành \"Tứ Quan\"."),
    { tip: bi("Slide a finger up from the web between the big and second toe; it stops in a hollow before the bones meet.", "Vuốt ngón tay từ kẽ ngón chân 1–2 ngược lên mu bàn chân; ngón tay dừng ở chỗ lõm trước khi chạm chỗ hai xương gặp nhau.") }),

  // ---------- Governor vessel ----------
  P("GV4", "GV4", "Mệnh Môn", "Mìngmén 命门", "Life Gate", "GV", "back", false,
    bi("On the lower back midline, in the hollow below the 2nd lumbar vertebra (opposite the navel).", "Đường giữa lưng, chỗ lõm dưới mỏm gai đốt sống thắt lưng 2 (đối diện rốn)."),
    bi("Low back pain and coldness, fatigue, frequent urination.", "Đau và lạnh thắt lưng, mệt mỏi, tiểu nhiều.")),
  P("GV14", "GV14", "Đại Chùy", "Dàzhuī 大椎", "Great Vertebra", "GV", "neck", false,
    bi("On the back midline, in the hollow below the 7th cervical vertebra (the most prominent bone at the base of the neck when you bend the head).", "Đường giữa sau gáy, chỗ lõm dưới mỏm gai đốt sống cổ 7 (đốt nổi cao nhất khi cúi đầu)."),
    bi("Fever, colds, stiff neck, cough.", "Sốt, cảm, cứng gáy, ho.")),
  P("GV20", "GV20", "Bách Hội", "Bǎihuì 百会", "Hundred Meetings", "GV", "head", false,
    bi("On the top of the head, on the midline, 5 cun behind the front hairline, where the line joining the tops of the two ears crosses the midline.", "Trên đỉnh đầu, đường giữa, sau chân tóc trán 5 thốn, nơi đường nối hai đỉnh vành tai cắt đường giữa."),
    bi("Headache at the top of the head, dizziness, low mood, poor memory, insomnia.", "Đau đỉnh đầu, chóng mặt, tâm trạng sa sút, hay quên, mất ngủ."),
    { tip: bi("Put both thumbs on the tops of the ears and reach the middle fingers to the top of the head: they meet at the point.", "Đặt hai ngón cái lên đỉnh vành tai, vươn hai ngón giữa lên đỉnh đầu: chỗ hai ngón gặp nhau là huyệt.") }),
  P("GV26", "GV26", "Nhân Trung", "Shuǐgōu 水沟 (Rénzhōng 人中)", "Water Trough", "GV", "head", false,
    bi("Under the nose, one third of the way down the groove of the upper lip (philtrum).", "Dưới mũi, điểm nối 1/3 trên và 2/3 dưới của rãnh nhân trung."),
    bi("First aid for fainting or feeling faint while waiting for help.", "Sơ cứu khi ngất hoặc choáng sắp ngất, trong lúc chờ hỗ trợ y tế."),
    { tip: bi("Press firmly with a fingernail, pointing slightly upward.", "Bấm mạnh bằng đầu móng tay, hơi chếch lên trên."), caution: bi("If the person doesn't wake up quickly, call emergency services (115 in Vietnam).", "Nếu người bệnh không tỉnh nhanh, gọi cấp cứu 115 ngay.") }),

  // ---------- Conception vessel ----------
  P("CV4", "CV4", "Quan Nguyên", "Guānyuán 关元", "Gate of Origin", "CV", "abdomen", false,
    bi("On the lower abdomen midline, 3 cun below the navel.", "Đường giữa bụng dưới, dưới rốn 3 thốn."),
    bi("Menstrual pain, fatigue, frequent urination, cold lower abdomen.", "Đau bụng kinh, mệt mỏi, tiểu nhiều, lạnh bụng dưới."),
    { tip: bi("Four finger-widths below the navel. Warm palms or a warm pack work well here.", "Dưới rốn bốn khoát ngón tay. Có thể úp lòng bàn tay ấm hoặc chườm ấm."), caution: bi("Empty the bladder first. Not during pregnancy.", "Đi tiểu trước khi bấm. Không bấm khi mang thai."), pregnancy: true }),
  P("CV6", "CV6", "Khí Hải", "Qìhǎi 气海", "Sea of Qi", "CV", "abdomen", false,
    bi("On the lower abdomen midline, 1.5 cun below the navel.", "Đường giữa bụng dưới, dưới rốn 1,5 thốn."),
    bi("Fatigue, weakness, bloating, menstrual pain.", "Mệt mỏi, suy nhược, đầy bụng, đau bụng kinh."),
    { tip: bi("Two finger-widths below the navel. Rest the palm here and breathe slowly into the belly.", "Dưới rốn hai khoát ngón tay. Úp lòng bàn tay lên và thở chậm xuống bụng."), caution: PREGNANCY, pregnancy: true }),
  P("CV12", "CV12", "Trung Quản", "Zhōngwǎn 中脘", "Middle Cavity", "CV", "abdomen", false,
    bi("On the upper abdomen midline, 4 cun above the navel, halfway between the navel and the lower end of the breastbone.", "Đường giữa bụng trên, trên rốn 4 thốn, điểm giữa rốn và mũi ức."),
    bi("Stomach pain, indigestion, bloating, nausea, acid reflux, hiccups.", "Đau dạ dày, ăn khó tiêu, đầy bụng, buồn nôn, ợ chua, nấc."),
    { caution: bi("Not right after a meal.", "Không bấm ngay sau khi ăn no.") }),
  P("CV17", "CV17", "Đản Trung", "Dànzhōng 膻中", "Chest Centre", "CV", "chest", false,
    bi("On the breastbone, level with the 4th intercostal space (between the nipples in men).", "Trên xương ức, ngang khe liên sườn 4 (giữa hai núm vú ở nam giới)."),
    bi("Chest tightness, shortness of breath, cough, anxiety, palpitations, hiccups.", "Tức ngực, khó thở, ho, lo âu, hồi hộp, nấc."),
    { tip: bi("Rub gently up and down along the breastbone with the palm, breathing slowly.", "Dùng lòng bàn tay xoa nhẹ lên xuống dọc xương ức, thở chậm.") }),
  P("CV22", "CV22", "Thiên Đột", "Tiāntū 天突", "Celestial Chimney", "CV", "neck", false,
    bi("At the base of the throat, in the centre of the hollow above the breastbone (suprasternal notch).", "Ở chân cổ, giữa hõm trên xương ức."),
    bi("Cough, tickly or tight throat, hoarse voice, hiccups.", "Ho, ngứa hoặc vướng họng, khàn tiếng, nấc."),
    { tip: bi("Hook a fingertip into the notch and press gently downward, behind the breastbone, never straight into the windpipe.", "Móc nhẹ đầu ngón tay vào hõm, ấn hướng xuống dưới về phía sau xương ức, không ấn thẳng vào khí quản."), caution: GENTLE }),

  // ---------- Extra points ----------
  P("YINTANG", "EX-HN3", "Ấn Đường", "Yìntáng 印堂", "Hall of Impression", "EX", "head", false,
    bi("On the forehead, midway between the inner ends of the eyebrows.", "Trên trán, điểm giữa hai đầu trong lông mày."),
    bi("Stress, insomnia, frontal headache, blocked nose, sinus congestion.", "Căng thẳng, mất ngủ, đau đầu vùng trán, nghẹt mũi, viêm xoang."),
    { tip: bi("Press with the middle finger and make slow small circles; close the eyes and breathe out.", "Dùng ngón giữa ấn và day tròn chậm; nhắm mắt, thở ra dài.") }),
  P("TAIYANG", "EX-HN5", "Thái Dương", "Tàiyáng 太阳", "Sun", "EX", "head", true,
    bi("At the temple, in the hollow about one finger-width behind the midpoint between the outer end of the eyebrow and the outer corner of the eye.", "Ở thái dương, chỗ lõm sau điểm giữa đuôi lông mày và đuôi mắt khoảng một khoát ngón tay."),
    bi("Headache at the temples, migraine, tired eyes.", "Đau đầu vùng thái dương, đau nửa đầu, mỏi mắt.")),
  P("ANMIAN", "Extra", "An Miên", "Ānmián 安眠", "Peaceful Sleep", "EX", "head", true,
    bi("Behind the ear, midway between TE17 (behind the earlobe) and GB20 (under the skull).", "Sau tai, điểm giữa Ế Phong (sau dái tai) và Phong Trì (dưới xương chẩm)."),
    bi("Insomnia, restlessness, dizziness.", "Mất ngủ, bứt rứt, chóng mặt.")),
  P("DINGCHUAN", "EX-B1", "Định Suyễn", "Dìngchuǎn 定喘", "Calm Wheezing", "EX", "back", true,
    bi("0.5 cun to the side of the hollow below the 7th cervical vertebra (beside GV14).", "Cách chỗ lõm dưới mỏm gai đốt sống cổ 7 (Đại Chùy) 0,5 thốn ra hai bên."),
    bi("Wheezing, asthma, cough.", "Khò khè, hen, ho.")),
  P("YAOTONGDIAN", "EX-UE7", "Yêu Thống Điểm", "Yāotòngdiǎn 腰痛点", "Low Back Pain Points", "EX", "hand", true,
    bi("Two points on the back of each hand: between the 2nd and 3rd and between the 4th and 5th metacarpal bones, where the bases of the bones meet their shafts.", "Hai huyệt trên mu mỗi bàn tay: giữa xương bàn tay 2 và 3, và giữa xương bàn tay 4 và 5, ở chỗ nối nền với thân xương."),
    bi("Sudden low back pain or strain.", "Đau lưng cấp, sái lưng."),
    { tip: bi("Press firmly while slowly bending and turning the low back.", "Ấn mạnh đồng thời từ từ cúi, ngửa, xoay thắt lưng.") }),
  P("WAILAOGONG", "EX-UE8", "Lạc Chẩm (Ngoại Lao Cung)", "Wàiláogōng 外劳宫 (Luòzhěn 落枕)", "Stiff Neck Point", "EX", "hand", true,
    bi("On the back of the hand, between the 2nd and 3rd metacarpal bones, 0.5 cun behind the knuckles.", "Mu bàn tay, giữa xương bàn tay 2 và 3, sau khớp bàn – ngón 0,5 thốn."),
    bi("Stiff neck after sleeping awkwardly.", "Vẹo cổ, cứng cổ do nằm sai tư thế (lạc chẩm)."),
    { tip: bi("Press firmly for 1–2 minutes while slowly turning the head side to side.", "Ấn mạnh 1–2 phút, đồng thời từ từ xoay cổ sang hai bên.") }),
  P("NEIXIYAN", "EX-LE4", "Nội Tất Nhãn", "Nèixīyǎn 内膝眼", "Inner Knee Eye", "EX", "leg", true,
    bi("Knee slightly bent: in the hollow below the kneecap, on the inner side of the patellar tendon (the inner \"eye\" of the knee).", "Gối hơi co: chỗ lõm dưới xương bánh chè, phía trong gân bánh chè (mắt gối trong)."),
    bi("Knee pain and stiffness.", "Đau, cứng khớp gối.")),
];

export const pointById = (id: string) => ACUPOINTS.find((p) => p.id === id);

// ---------- Symptoms ----------

export type SymptomGroup = "resp" | "head" | "digest" | "mind" | "pain" | "women" | "other";

export const SYMPTOM_GROUPS: Record<SymptomGroup, { icon: string; label: Bi }> = {
  resp: { icon: "🫁", label: bi("Breathing, nose & throat", "Hô hấp – tai mũi họng") },
  head: { icon: "🧠", label: bi("Head, eyes, ears & teeth", "Đầu – mắt – tai – răng") },
  digest: { icon: "🍵", label: bi("Digestion", "Tiêu hoá") },
  mind: { icon: "🌙", label: bi("Sleep, mood & energy", "Giấc ngủ – tinh thần") },
  pain: { icon: "🦴", label: bi("Muscles & joints", "Cơ – xương – khớp") },
  women: { icon: "🌸", label: bi("Women's health", "Sức khoẻ phụ nữ") },
  other: { icon: "✳️", label: bi("Other", "Khác") },
};

export interface Symptom {
  id: string;
  group: SymptomGroup;
  name: Bi;
  aliases: string[]; // extra search terms, any language, accents optional
  about: Bi; // short traditional view
  points: string[]; // in order of priority
  notes?: Record<string, Bi>; // why a point is here, when it's not obvious
  selfCare: Bi;
  seeDoctor: Bi;
}

const S = (s: Symptom) => s;

export const SYMPTOMS: Symptom[] = [
  // ---------- Breathing, nose & throat ----------
  S({
    id: "dry-cough", group: "resp", name: bi("Dry cough", "Ho khan"),
    aliases: ["ho khan", "ho khang", "ho kho", "ho khong dom", "ho ngua hong", "ho dai dang", "ho", "cough", "tickly cough", "ho về đêm"],
    about: bi("Eastern medicine sees a dry cough as dryness or wind disturbing the Lung. These points calm the cough and moisten the throat.",
      "Theo Đông y, ho khan thường do phong táo hoặc phế âm hư làm phổi mất nhuận. Nhóm huyệt này giúp tuyên phế, nhuận họng, chỉ khái."),
    points: ["LU7", "KI6", "LU5", "CV22", "LU1", "BL13", "LU9"],
    notes: {
      LU7: bi("Pair with KI6: the classic combination for a dry, tickly throat.", "Phối với Chiếu Hải: cặp huyệt kinh điển cho họng khô, ngứa."),
      CV22: bi("Calms the urge to cough; press gently.", "Làm dịu cơn ho, cảm giác vướng họng; chỉ ấn nhẹ."),
      BL13: bi("Back-shu point of the Lung; ask someone to press or keep it warm.", "Bối du huyệt của Phế; nhờ người ấn hoặc chườm ấm."),
    },
    selfCare: bi("Sip warm water often, keep the neck warm, avoid smoke and cold air blowing on you. Warm honey water helps (not for babies under 1).",
      "Uống nước ấm từng ngụm, giữ ấm cổ, tránh khói thuốc và điều hoà thổi thẳng. Mật ong pha nước ấm giúp dịu họng (không dùng cho trẻ dưới 1 tuổi)."),
    seeDoctor: bi("A cough lasting more than 3 weeks, coughing blood, high fever, shortness of breath, chest pain or unexplained weight loss.",
      "Ho kéo dài trên 3 tuần, ho ra máu, sốt cao, khó thở, đau ngực hoặc sụt cân không rõ lý do."),
  }),
  S({
    id: "wet-cough", group: "resp", name: bi("Cough with phlegm", "Ho có đờm"),
    aliases: ["ho dom", "ho co dom", "dom nhieu", "khac dom", "ho ra dom", "phlegm", "productive cough", "chesty cough", "mucus"],
    about: bi("Phlegm is linked to the Spleen and Lung. These points help clear phlegm and ease the chest.",
      "Đông y cho rằng \"Tỳ là nguồn sinh đờm, Phế là nơi chứa đờm\". Nhóm huyệt giúp hoá đờm, thông khí ngực."),
    points: ["ST40", "LU5", "CV17", "BL13", "LU1", "ST36"],
    notes: { ST40: bi("The key point for phlegm in Eastern medicine.", "Huyệt chủ yếu để hoá đờm.") },
    selfCare: bi("Drink warm fluids, try steam inhalation, and sleep with your head slightly raised.", "Uống nhiều nước ấm, xông hơi nước nóng, ngủ kê cao đầu."),
    seeDoctor: bi("Green/yellow phlegm with fever over 3 days, blood in the phlegm, breathlessness or chest pain.", "Đờm xanh/vàng kèm sốt trên 3 ngày, đờm lẫn máu, khó thở hoặc đau ngực."),
  }),
  S({
    id: "sore-throat", group: "resp", name: bi("Sore throat", "Đau họng"),
    aliases: ["dau hong", "rat hong", "viem hong", "nuot dau", "sung hong", "sore throat", "throat pain"],
    about: bi("Usually heat or wind in the Lung channel. These points clear the throat.", "Thường do phong nhiệt ở kinh Phế. Nhóm huyệt giúp thanh nhiệt, lợi họng."),
    points: ["LU11", "LI4", "LU10", "KI6", "LU7", "LI11"],
    selfCare: bi("Gargle warm salt water, rest the voice and drink warm fluids.", "Súc miệng nước muối ấm, hạn chế nói to, uống nước ấm."),
    seeDoctor: bi("Difficulty swallowing or breathing, drooling, high fever, a very swollen throat, or pain lasting more than a week.", "Khó nuốt hoặc khó thở, chảy nước dãi, sốt cao, sưng họng nhiều, hoặc đau trên 1 tuần."),
  }),
  S({
    id: "hoarse", group: "resp", name: bi("Hoarse voice", "Khàn tiếng"),
    aliases: ["khan tieng", "mat tieng", "khan giong", "hoarse", "lost voice", "laryngitis"],
    about: bi("Linked to dryness of the throat (Lung and Kidney yin).", "Liên quan đến phế âm, thận âm không đủ nhuận họng."),
    points: ["KI6", "LU7", "LU10", "CV22", "LU6"],
    selfCare: bi("Rest the voice (whispering strains it too), humidify the air, sip warm water.", "Cho giọng nghỉ ngơi (nói thì thầm cũng gây căng), giữ không khí ẩm, uống nước ấm."),
    seeDoctor: bi("Hoarseness lasting more than 2–3 weeks, especially in smokers.", "Khàn tiếng kéo dài trên 2–3 tuần, nhất là ở người hút thuốc."),
  }),
  S({
    id: "cold", group: "resp", name: bi("Common cold", "Cảm lạnh, sổ mũi"),
    aliases: ["cam lanh", "cam cum", "so mui", "chay nuoc mui", "hat hoi", "cam", "cold", "flu", "runny nose", "sneezing", "trung gio"],
    about: bi("Wind invading from outside. These points release the exterior and clear the head.", "Do ngoại cảm phong hàn hoặc phong nhiệt. Nhóm huyệt giúp giải biểu, khu phong."),
    points: ["GB20", "LI4", "LU7", "LI20", "BL12", "GV14", "TE5"],
    selfCare: bi("Rest, keep warm, drink warm ginger tea or hot rice soup with green onion and ginger.", "Nghỉ ngơi, giữ ấm, uống trà gừng ấm hoặc ăn cháo hành gừng nóng."),
    seeDoctor: bi("Fever above 39 °C or for more than 3 days, shortness of breath, severe headache with stiff neck, or symptoms that get worse after a week.", "Sốt trên 39 °C hoặc quá 3 ngày, khó thở, đau đầu dữ dội kèm cứng gáy, hoặc nặng dần sau 1 tuần."),
  }),
  S({
    id: "nose", group: "resp", name: bi("Blocked nose & sinuses", "Nghẹt mũi, viêm xoang"),
    aliases: ["nghet mui", "tac mui", "viem xoang", "xoang", "viem mui", "di ung mui", "blocked nose", "stuffy nose", "sinus", "sinusitis"],
    about: bi("Points around the nose open the nasal passages; LI4 helps from a distance.", "Các huyệt quanh mũi giúp thông mũi tại chỗ; Hợp Cốc hỗ trợ từ xa."),
    points: ["LI20", "YINTANG", "BL2", "ST2", "LI4", "GB20"],
    selfCare: bi("Rinse with saline, breathe steam, and keep the bedroom air not too dry or cold.", "Rửa mũi bằng nước muối sinh lý, xông hơi, giữ phòng ngủ không quá khô lạnh."),
    seeDoctor: bi("Swelling around the eyes, high fever, severe facial pain, or symptoms lasting more than 10 days.", "Sưng quanh mắt, sốt cao, đau nhức mặt dữ dội, hoặc kéo dài trên 10 ngày."),
  }),
  S({
    id: "wheeze", group: "resp", name: bi("Mild wheezing, chest tightness", "Khò khè, tức ngực nhẹ"),
    aliases: ["kho khe", "hen", "hen suyen", "suyen", "tuc nguc", "nang nguc", "wheezing", "asthma", "chest tightness"],
    about: bi("Supportive points to calm the breath. Never a substitute for asthma medication.", "Huyệt hỗ trợ bình suyễn, làm dịu hơi thở. Không thay thế thuốc hen."),
    points: ["DINGCHUAN", "CV17", "BL13", "LU1", "KI27", "LU9", "PC6"],
    selfCare: bi("Sit upright, breathe out slowly through pursed lips, and use your prescribed inhaler first.", "Ngồi thẳng, thở ra chậm qua môi chúm, và dùng thuốc xịt đã được kê trước tiên."),
    seeDoctor: bi("If breathing is hard, lips turn blue, you can't speak in full sentences, or your inhaler doesn't help: emergency care now (115).", "Nếu thở rất khó, môi tím, không nói được trọn câu, hoặc thuốc xịt không đỡ: đi cấp cứu ngay (115)."),
  }),
  S({
    id: "fever", group: "resp", name: bi("Fever (supportive)", "Sốt (hỗ trợ)"),
    aliases: ["sot", "sot nhe", "nong sot", "fever", "temperature"],
    about: bi("Points traditionally used to clear heat, alongside rest, fluids and fever medicine if needed.", "Các huyệt thanh nhiệt truyền thống, dùng kèm nghỉ ngơi, bù nước và thuốc hạ sốt khi cần."),
    points: ["LI11", "GV14", "LI4", "TE5"],
    selfCare: bi("Drink plenty, rest, wear light clothes and sponge with lukewarm water.", "Uống nhiều nước, nghỉ ngơi, mặc thoáng, lau người bằng nước ấm."),
    seeDoctor: bi("Fever above 39 °C, lasting over 3 days, with rash, stiff neck, confusion or difficulty breathing; any fever in a baby under 3 months. Dengue season: watch for bleeding or abdominal pain.",
      "Sốt trên 39 °C, kéo dài quá 3 ngày, kèm phát ban, cứng gáy, lơ mơ hoặc khó thở; trẻ dưới 3 tháng bị sốt. Mùa sốt xuất huyết: chú ý chảy máu chân răng, đau bụng."),
  }),

  // ---------- Head, eyes, ears, teeth ----------
  S({
    id: "headache-front", group: "head", name: bi("Headache at the forehead", "Đau đầu vùng trán"),
    aliases: ["dau dau", "nhuc dau", "dau tran", "dau dau vung tran", "headache", "forehead pain", "nhức đầu"],
    about: bi("The forehead belongs to the Yangming channels (Stomach, Large Intestine).", "Vùng trán thuộc kinh Dương Minh (Vị, Đại Trường)."),
    points: ["YINTANG", "BL2", "GB14", "LI4", "ST44"],
    selfCare: bi("Drink water, rest the eyes from screens, and get some fresh air.", "Uống nước, cho mắt nghỉ khỏi màn hình, ra chỗ thoáng khí."),
    seeDoctor: bi("A sudden \"worst-ever\" headache, headache with fever and stiff neck, weakness, confusion, vision loss, or after a head injury: emergency.",
      "Đau đầu đột ngột dữ dội nhất từng có, kèm sốt và cứng gáy, yếu liệt, lơ mơ, mất thị lực, hoặc sau chấn thương đầu: đi cấp cứu."),
  }),
  S({
    id: "headache-side", group: "head", name: bi("Temple headache, migraine", "Đau nửa đầu, thái dương"),
    aliases: ["dau nua dau", "dau thai duong", "migraine", "dau mot ben dau", "temple headache"],
    about: bi("The sides of the head belong to the Shaoyang channels (Gallbladder, Triple Energizer).", "Hai bên đầu thuộc kinh Thiếu Dương (Đởm, Tam Tiêu)."),
    points: ["TAIYANG", "GB20", "TE5", "LR3", "TE3", "GB34"],
    selfCare: bi("Rest in a dark, quiet room; a cool cloth on the forehead; regular sleep and meals.", "Nghỉ trong phòng tối, yên tĩnh; khăn mát trên trán; ngủ và ăn đúng giờ."),
    seeDoctor: bi("A new kind of headache after 50, headache with numbness, weakness or speech trouble, or headaches that are getting more frequent.", "Kiểu đau đầu mới xuất hiện sau tuổi 50, đau đầu kèm tê, yếu, nói khó, hoặc cơn ngày càng dày."),
  }),
  S({
    id: "headache-back", group: "head", name: bi("Headache at the back of the head", "Đau đầu vùng gáy"),
    aliases: ["dau gay", "dau sau dau", "dau vung cham", "nhuc gay", "occipital headache", "tension headache", "căng thẳng đau đầu"],
    about: bi("The back of the head belongs to the Taiyang channels (Bladder, Small Intestine); often tension from the neck.", "Vùng gáy thuộc kinh Thái Dương (Bàng Quang, Tiểu Trường); thường do căng cơ cổ."),
    points: ["GB20", "GB21", "SI3", "BL60", "LU7"],
    selfCare: bi("Check your screen height and posture; gentle neck stretches and warmth.", "Chỉnh màn hình ngang tầm mắt, ngồi thẳng; giãn cơ cổ nhẹ nhàng và chườm ấm."),
    seeDoctor: bi("With fever and a stiff neck, after a fall, or with very high blood pressure.", "Kèm sốt và cứng gáy, sau té ngã, hoặc khi huyết áp rất cao."),
  }),
  S({
    id: "headache-top", group: "head", name: bi("Headache at the top of the head", "Đau đỉnh đầu"),
    aliases: ["dau dinh dau", "nang dinh dau", "vertex headache", "top of head"],
    about: bi("The vertex is where the Liver channel meets the Governor Vessel.", "Đỉnh đầu là nơi kinh Can hội với mạch Đốc."),
    points: ["GV20", "LR3", "KI1"],
    selfCare: bi("Rest, calm breathing, and avoid stress and alcohol.", "Nghỉ ngơi, thở chậm, tránh căng thẳng và rượu bia."),
    seeDoctor: bi("Sudden severe pain, or pain with high blood pressure, vomiting or weakness.", "Đau đột ngột dữ dội, hoặc kèm huyết áp cao, nôn, yếu liệt."),
  }),
  S({
    id: "dizzy", group: "head", name: bi("Dizziness", "Chóng mặt, hoa mắt"),
    aliases: ["chong mat", "hoa mat", "choang vang", "xay xam", "roi loan tien dinh", "tien dinh", "dizzy", "dizziness", "vertigo", "lightheaded"],
    about: bi("Eastern medicine links dizziness to wind, phlegm or weakness; these points steady the head.", "Đông y cho rằng chóng mặt do phong, đờm hoặc hư; nhóm huyệt giúp định huyễn, thanh não."),
    points: ["GV20", "GB20", "PC6", "ST36", "ST40", "LR3"],
    selfCare: bi("Sit or lie down at once; get up slowly; drink water and eat regularly.", "Ngồi hoặc nằm xuống ngay; đứng dậy từ từ; uống đủ nước, ăn đúng bữa."),
    seeDoctor: bi("With a severe headache, slurred speech, face drooping, weakness, double vision, chest pain or fainting: call 115.", "Kèm đau đầu dữ dội, nói ngọng, méo miệng, yếu tay chân, nhìn đôi, đau ngực hoặc ngất: gọi 115."),
  }),
  S({
    id: "eyes", group: "head", name: bi("Tired eyes", "Mỏi mắt"),
    aliases: ["moi mat", "kho mat", "nhuc mat", "mat moi", "nhin mo", "eye strain", "tired eyes", "dry eyes", "screen"],
    about: bi("Points around the eye socket relax the eyes; LR3 supports the Liver, which \"opens into the eyes\".", "Các huyệt quanh hốc mắt giúp thư giãn mắt; Thái Xung hỗ trợ tạng Can (\"Can khai khiếu ra mắt\")."),
    points: ["BL2", "TAIYANG", "ST2", "GB14", "GB20", "LR3"],
    selfCare: bi("20-20-20 rule: every 20 minutes look 6 m away for 20 seconds. Blink often; rub warm palms and cup them over the eyes.", "Quy tắc 20-20-20: cứ 20 phút nhìn xa 6 m trong 20 giây. Chớp mắt thường xuyên; xoa ấm lòng bàn tay rồi úp lên mắt."),
    seeDoctor: bi("Sudden vision loss, a painful red eye, flashes or a curtain across vision.", "Mất thị lực đột ngột, mắt đỏ đau nhức, thấy chớp sáng hoặc như có màn che."),
  }),
  S({
    id: "tooth", group: "head", name: bi("Toothache", "Đau răng"),
    aliases: ["dau rang", "nhuc rang", "sung loi", "dau loi", "toothache", "gum pain"],
    about: bi("Supportive relief while you get to a dentist. LI4 for both jaws; ST7 for the upper and ST6 for the lower teeth.", "Giảm đau tạm thời trong lúc chờ đi nha sĩ. Hợp Cốc cho cả hai hàm; Hạ Quan cho hàm trên, Giáp Xa cho hàm dưới."),
    points: ["LI4", "ST6", "ST7", "ST44"],
    selfCare: bi("Rinse with warm salt water; avoid very hot, cold or sweet food.", "Súc miệng nước muối ấm; tránh đồ quá nóng, lạnh, ngọt."),
    seeDoctor: bi("See a dentist. Urgently if the face or jaw is swelling, with fever, or if swallowing or breathing becomes hard.", "Nên đi nha sĩ. Đi gấp nếu sưng mặt/hàm, sốt, hoặc khó nuốt, khó thở."),
  }),
  S({
    id: "ears", group: "head", name: bi("Ringing ears", "Ù tai"),
    aliases: ["u tai", "dau tai", "nghe kem", "tai keu", "tinnitus", "ringing ears", "ear ache", "earache"],
    about: bi("Points around the ear plus TE3 and KI3, since \"the Kidney opens into the ears\".", "Huyệt quanh tai phối hợp Trung Chử và Thái Khê (\"Thận khai khiếu ra tai\")."),
    points: ["SI19", "TE17", "TE3", "KI3", "GB20"],
    selfCare: bi("Avoid loud noise, limit caffeine, and keep a regular sleep.", "Tránh tiếng ồn lớn, hạn chế cà phê, ngủ đúng giờ."),
    seeDoctor: bi("Sudden hearing loss (within 72 hours is urgent), ringing in one ear only, ear discharge or dizziness.", "Mất thính lực đột ngột (cần khám trong 72 giờ), ù một bên tai, chảy dịch tai hoặc kèm chóng mặt."),
  }),
  S({
    id: "jaw", group: "head", name: bi("Jaw pain, clenching", "Đau khớp hàm, nghiến răng"),
    aliases: ["dau ham", "kho ha mieng", "nghien rang", "khop thai duong ham", "jaw pain", "tmj", "clenching", "bruxism"],
    about: bi("Local points relax the chewing muscles; LI4 works from a distance.", "Huyệt tại chỗ làm mềm cơ nhai; Hợp Cốc hỗ trợ từ xa."),
    points: ["ST7", "ST6", "SI19", "LI4", "TAIYANG"],
    selfCare: bi("Keep the teeth apart and the tongue resting on the palate; warm compresses; soft food for a while.", "Để hai hàm răng hơi tách, lưỡi chạm vòm miệng; chườm ấm; ăn đồ mềm một thời gian."),
    seeDoctor: bi("Jaw locking, or pain lasting more than 2 weeks.", "Hàm bị kẹt, hoặc đau trên 2 tuần."),
  }),

  // ---------- Digestion ----------
  S({
    id: "nausea", group: "digest", name: bi("Nausea, motion sickness", "Buồn nôn, say xe"),
    aliases: ["buon non", "say xe", "say tau", "say song", "non", "oe", "nausea", "motion sickness", "car sick", "vomiting", "ốm nghén"],
    about: bi("PC6 is the best-studied acupressure point; it's what travel wristbands press on.", "Nội Quan là huyệt bấm được nghiên cứu nhiều nhất; vòng đeo tay chống say xe ấn đúng vào huyệt này."),
    points: ["PC6", "CV12", "ST36", "SP4"],
    notes: { PC6: bi("Press both wrists for 2–3 minutes; start before the trip.", "Ấn cả hai cổ tay 2–3 phút; nên bắt đầu trước chuyến đi.") },
    selfCare: bi("Look at the horizon, get fresh air, sip ginger tea, and avoid reading in the car.", "Nhìn ra xa về đường chân trời, mở cửa cho thoáng, nhấp trà gừng, không đọc sách trên xe."),
    seeDoctor: bi("Vomiting for more than a day, signs of dehydration, blood in vomit, severe abdominal pain, or after a head injury.", "Nôn kéo dài trên 1 ngày, có dấu hiệu mất nước, nôn ra máu, đau bụng dữ dội, hoặc sau chấn thương đầu."),
  }),
  S({
    id: "stomach", group: "digest", name: bi("Stomach ache, indigestion, bloating", "Đau dạ dày, đầy bụng, khó tiêu"),
    aliases: ["dau da day", "dau bao tu", "day bung", "kho tieu", "an khong tieu", "o hoi", "o chua", "trao nguoc", "chuong bung", "an kem", "indigestion", "bloating", "stomach ache", "heartburn", "reflux"],
    about: bi("CV12 is the meeting point of the organs; ST36 is the master point of the abdomen.", "Trung Quản là hội huyệt của các phủ; Túc Tam Lý là huyệt chủ của vùng bụng."),
    points: ["CV12", "ST36", "PC6", "SP4", "BL21", "BL20"],
    selfCare: bi("Eat slowly and less at a time, don't lie down for 2 hours after meals, cut back on fried food, coffee and alcohol.", "Ăn chậm, chia nhỏ bữa, không nằm ngay trong 2 giờ sau ăn, hạn chế đồ chiên, cà phê, rượu bia."),
    seeDoctor: bi("Black or bloody stools, vomiting blood, severe or worsening pain, trouble swallowing, weight loss, or pain spreading to the chest or back.", "Phân đen hoặc có máu, nôn ra máu, đau dữ dội hoặc tăng dần, nuốt nghẹn, sụt cân, hoặc đau lan lên ngực, ra sau lưng."),
  }),
  S({
    id: "constipation", group: "digest", name: bi("Constipation", "Táo bón"),
    aliases: ["tao bon", "kho di ngoai", "bi tien", "dai tien kho", "constipation"],
    about: bi("ST25 is the front-mu point of the Large Intestine; TE6 is the classic distal point.", "Thiên Khu là mộ huyệt của Đại Trường; Chi Câu là huyệt xa kinh điển trị táo bón."),
    points: ["TE6", "ST25", "SP15", "ST36", "BL25", "LI4"],
    notes: { ST25: bi("Massage the belly clockwise around the navel as well.", "Kết hợp xoa bụng theo chiều kim đồng hồ quanh rốn.") },
    selfCare: bi("Drink 1.5–2 litres of water a day, eat vegetables and fruit, walk daily, and go at a regular time.", "Uống 1,5–2 lít nước mỗi ngày, ăn nhiều rau, trái cây, đi bộ hằng ngày, đi vệ sinh đúng giờ."),
    seeDoctor: bi("Blood in the stool, severe abdominal pain, vomiting, no gas passing, unexplained weight loss, or a change in habit lasting weeks after age 50.", "Phân có máu, đau bụng dữ dội, nôn, không trung tiện được, sụt cân, hoặc thay đổi thói quen đại tiện kéo dài sau tuổi 50."),
  }),
  S({
    id: "diarrhea", group: "digest", name: bi("Diarrhoea (mild)", "Tiêu chảy nhẹ"),
    aliases: ["tieu chay", "di ngoai nhieu", "phan long", "di long", "roi loan tieu hoa", "diarrhea", "diarrhoea", "loose stools"],
    about: bi("Points that strengthen the Spleen and steady the bowels.", "Nhóm huyệt kiện Tỳ, chỉ tả."),
    points: ["ST25", "ST36", "SP9", "SP4", "CV12", "BL20"],
    selfCare: bi("Replace fluids with oral rehydration salts (Oresol), eat light food (rice porridge), avoid milk and greasy food.", "Bù nước bằng Oresol pha đúng cách, ăn nhẹ (cháo), tránh sữa và đồ dầu mỡ."),
    seeDoctor: bi("Signs of dehydration, blood in stools, high fever, more than 2 days, or in babies and elderly people.", "Dấu hiệu mất nước, phân có máu, sốt cao, kéo dài trên 2 ngày, hoặc ở trẻ nhỏ, người cao tuổi."),
  }),
  S({
    id: "hiccups", group: "digest", name: bi("Hiccups", "Nấc cụt"),
    aliases: ["nac", "nac cut", "hiccup", "hiccups"],
    about: bi("Rising Stomach qi; these points send it down.", "Do vị khí nghịch lên; nhóm huyệt giúp giáng nghịch."),
    points: ["PC6", "CV22", "CV17", "BL17", "CV12"],
    selfCare: bi("Hold your breath for a few seconds, sip cold water slowly, or breathe into cupped hands.", "Nín thở vài giây, uống chậm từng ngụm nước lạnh, hoặc thở vào lòng bàn tay khum."),
    seeDoctor: bi("Hiccups lasting more than 48 hours.", "Nấc kéo dài trên 48 giờ."),
  }),

  // ---------- Sleep, mood, energy ----------
  S({
    id: "insomnia", group: "mind", name: bi("Insomnia", "Mất ngủ"),
    aliases: ["mat ngu", "kho ngu", "ngu khong ngon", "tran troc", "thuc giac", "insomnia", "can't sleep", "sleep"],
    about: bi("These points calm the Heart and Spirit (Thần). Do them in bed, 30 minutes before sleep.", "Nhóm huyệt an thần, dưỡng tâm. Bấm trên giường, khoảng 30 phút trước khi ngủ."),
    points: ["HT7", "ANMIAN", "YINTANG", "SP6", "KI1", "PC6", "KI6", "BL62"],
    notes: { KI6: bi("Pair with BL62 (Thân Mạch): the classic pair for sleep.", "Phối với Thân Mạch: cặp huyệt kinh điển điều hoà giấc ngủ.") },
    selfCare: bi("Regular bedtime, no screens or caffeine in the evening, a warm foot soak, and slow breathing (exhale longer than inhale).", "Ngủ dậy đúng giờ, tránh màn hình và cà phê buổi tối, ngâm chân nước ấm, thở chậm (thở ra dài hơn hít vào)."),
    seeDoctor: bi("Insomnia lasting more than a month, loud snoring with pauses in breathing, or low mood and loss of interest.", "Mất ngủ trên 1 tháng, ngáy to kèm ngưng thở, hoặc buồn chán, mất hứng thú kéo dài."),
  }),
  S({
    id: "stress", group: "mind", name: bi("Stress, anxiety", "Căng thẳng, lo âu"),
    aliases: ["cang thang", "lo au", "stress", "bon chon", "bat an", "cau gat", "ap luc", "anxiety", "tension", "irritable", "nervous"],
    about: bi("LI4 + LR3 (\"Four Gates\") move stuck qi; PC6 and HT7 calm the mind.", "Hợp Cốc + Thái Xung (\"Tứ Quan\") giúp khí lưu thông; Nội Quan, Thần Môn giúp an thần."),
    points: ["PC6", "HT7", "YINTANG", "LR3", "LI4", "CV17", "GV20"],
    selfCare: bi("Slow breathing (4 in, 6 out) while pressing; a short walk outside; talk to someone you trust.", "Thở chậm (hít 4, thở ra 6) trong khi bấm; đi bộ ngắn ngoài trời; trò chuyện với người bạn tin tưởng."),
    seeDoctor: bi("Panic attacks, anxiety that disrupts work or sleep for weeks, or thoughts of harming yourself: please reach out to a doctor or someone you trust now.", "Có cơn hoảng loạn, lo âu ảnh hưởng công việc, giấc ngủ nhiều tuần, hoặc có ý nghĩ tự làm hại bản thân: hãy liên hệ bác sĩ hoặc người thân ngay."),
  }),
  S({
    id: "palpitations", group: "mind", name: bi("Palpitations (mild)", "Hồi hộp, tim đập nhanh"),
    aliases: ["hoi hop", "tim dap nhanh", "danh trong nguc", "lo lang", "palpitations", "racing heart"],
    about: bi("Points of the Heart and Pericardium that calm the heart and mind.", "Huyệt kinh Tâm, Tâm Bào giúp an tâm, định quý."),
    points: ["PC6", "HT7", "CV17", "BL15"],
    selfCare: bi("Sit down, breathe slowly, cut back on coffee, tea, energy drinks and alcohol.", "Ngồi nghỉ, thở chậm, giảm cà phê, trà đặc, nước tăng lực, rượu bia."),
    seeDoctor: bi("With chest pain, fainting, shortness of breath, or a very fast or irregular pulse: emergency (115).", "Kèm đau ngực, ngất, khó thở, hoặc mạch rất nhanh, không đều: đi cấp cứu (115)."),
  }),
  S({
    id: "fatigue", group: "mind", name: bi("Fatigue, low energy", "Mệt mỏi, suy nhược"),
    aliases: ["met moi", "suy nhuoc", "uể oải", "thieu nang luong", "kiet suc", "duoi suc", "fatigue", "tired", "low energy", "exhausted"],
    about: bi("Classic points to build qi: ST36 and the \"sea of qi\" below the navel.", "Các huyệt bổ khí kinh điển: Túc Tam Lý và vùng \"khí hải\" dưới rốn."),
    points: ["ST36", "CV6", "CV4", "BL23", "KI1", "GV20"],
    selfCare: bi("Sleep 7–8 hours, eat regular balanced meals, get morning sunlight and some gentle exercise.", "Ngủ đủ 7–8 giờ, ăn đủ bữa, tắm nắng sáng và vận động nhẹ nhàng."),
    seeDoctor: bi("Tiredness lasting more than a few weeks, or with weight loss, fever, night sweats, breathlessness or pallor.", "Mệt kéo dài vài tuần, hoặc kèm sụt cân, sốt, ra mồ hôi đêm, khó thở, da xanh xao."),
  }),
  S({
    id: "faint", group: "mind", name: bi("Feeling faint (first aid)", "Choáng, ngất (sơ cứu)"),
    aliases: ["ngat", "ngat xiu", "choang", "xiu", "bat tinh", "faint", "fainting", "passed out"],
    about: bi("While help is on the way: lay the person flat, raise their legs, loosen tight clothes and press GV26 firmly.", "Trong lúc chờ hỗ trợ: đặt nằm ngửa, kê cao chân, nới lỏng quần áo và bấm mạnh Nhân Trung."),
    points: ["GV26", "PC6", "LI4"],
    selfCare: bi("After they recover: rest lying down, then sit up slowly and drink some sweet water.", "Khi đã tỉnh: nằm nghỉ, ngồi dậy từ từ, uống chút nước đường."),
    seeDoctor: bi("If they don't wake within a minute, aren't breathing normally, have chest pain, a seizure, or were injured: call 115 at once.", "Nếu không tỉnh trong vòng 1 phút, thở bất thường, đau ngực, co giật hoặc bị chấn thương: gọi 115 ngay."),
  }),

  // ---------- Muscles & joints ----------
  S({
    id: "stiff-neck", group: "pain", name: bi("Stiff neck & shoulders", "Đau mỏi vai gáy, vẹo cổ"),
    aliases: ["dau vai gay", "moi vai gay", "veo co", "cung co", "dau co", "nhuc vai", "lac cham", "stiff neck", "neck pain", "shoulder tension", "trapezius"],
    about: bi("Local points release the muscles; distant points (Lạc Chẩm, SI3, GB39) work while you gently move the neck.", "Huyệt tại chỗ làm mềm cơ; huyệt xa (Lạc Chẩm, Hậu Khê, Huyền Chung) bấm kết hợp xoay cổ nhẹ nhàng."),
    points: ["GB21", "GB20", "WAILAOGONG", "SI3", "GB39", "SI11"],
    notes: { WAILAOGONG: bi("Press it while slowly turning the head; often works within minutes for a stiff neck after sleep.", "Vừa ấn vừa từ từ xoay cổ; thường đỡ nhanh với vẹo cổ sau khi ngủ dậy.") },
    selfCare: bi("Warm compress, screen at eye level, a break every 30–45 minutes, and a pillow that keeps the neck level.", "Chườm ấm, màn hình ngang tầm mắt, nghỉ giải lao mỗi 30–45 phút, gối vừa độ cao."),
    seeDoctor: bi("Pain spreading down the arm with numbness or weakness, after an accident, or with fever and headache.", "Đau lan xuống tay kèm tê, yếu, sau tai nạn, hoặc kèm sốt và đau đầu."),
  }),
  S({
    id: "shoulder", group: "pain", name: bi("Shoulder pain", "Đau vai"),
    aliases: ["dau vai", "dau khop vai", "kho gio tay", "vai dong cung", "frozen shoulder", "shoulder pain"],
    about: bi("Points around the shoulder joint and blade, with LI11 along the channel.", "Huyệt quanh khớp vai và bả vai, phối hợp Khúc Trì trên đường kinh."),
    points: ["LI15", "SI11", "GB21", "LI11", "TE5"],
    selfCare: bi("Gentle pendulum swings and wall-walking with the fingers; warmth before, ice after strain.", "Đánh đu tay nhẹ, tập \"bò tay lên tường\"; chườm ấm trước tập, chườm lạnh nếu vừa bị căng cơ."),
    seeDoctor: bi("After a fall, a shoulder that won't move, or left shoulder/arm pain with chest pressure or breathlessness (possible heart attack: call 115).", "Sau té ngã, vai không cử động được, hoặc đau vai/tay trái kèm tức ngực, khó thở (có thể là nhồi máu cơ tim: gọi 115)."),
  }),
  S({
    id: "low-back", group: "pain", name: bi("Low back pain", "Đau lưng dưới"),
    aliases: ["dau lung", "dau that lung", "moi lung", "sai lung", "dau lung duoi", "low back pain", "back pain", "lumbago"],
    about: bi("\"For the back, seek Ủy Trung.\" Local shu points plus BL40 and the hand points for acute strain.", "\"Lưng gù Ủy Trung cầu.\" Kết hợp huyệt du tại chỗ, Ủy Trung và Yêu Thống Điểm khi sái lưng cấp."),
    points: ["BL23", "BL40", "YAOTONGDIAN", "GV4", "BL25", "BL60"],
    notes: { YAOTONGDIAN: bi("For a sudden strain: press firmly while slowly moving the low back.", "Khi sái lưng cấp: ấn mạnh đồng thời từ từ vận động thắt lưng.") },
    selfCare: bi("Stay gently active (bed rest makes it worse), use warmth, and lift with the knees bent.", "Vận động nhẹ nhàng (nằm bất động lâu làm chậm hồi phục), chườm ấm, khi nâng vật thì co gối."),
    seeDoctor: bi("Numbness in the groin, loss of bladder or bowel control, leg weakness, fever, after a fall, or night pain with weight loss: urgent.", "Tê vùng bẹn – hậu môn, rối loạn tiểu tiện hoặc đại tiện, yếu chân, sốt, sau té ngã, hoặc đau về đêm kèm sụt cân: khám ngay."),
  }),
  S({
    id: "sciatica", group: "pain", name: bi("Sciatica", "Đau thần kinh tọa"),
    aliases: ["than kinh toa", "dau than kinh toa", "dau lan xuong chan", "te chan", "sciatica", "leg pain from back"],
    about: bi("Points along the Bladder and Gallbladder channels, which follow the path of the pain.", "Huyệt trên đường kinh Bàng Quang và Đởm, theo đường lan của cơn đau."),
    points: ["GB30", "BL40", "GB34", "BL25", "BL57", "BL60"],
    selfCare: bi("Keep walking a little, avoid sitting long, and stretch the buttock and hamstrings gently.", "Đi lại nhẹ nhàng, tránh ngồi lâu, giãn cơ mông và mặt sau đùi."),
    seeDoctor: bi("Weakness of the foot or leg, numbness around the groin, bladder/bowel changes, or pain on both sides.", "Yếu bàn chân, yếu chân, tê vùng bẹn, rối loạn tiểu tiện/đại tiện, hoặc đau cả hai chân."),
  }),
  S({
    id: "knee", group: "pain", name: bi("Knee pain", "Đau gối"),
    aliases: ["dau goi", "dau dau goi", "thoai hoa goi", "khop goi", "moi goi", "knee pain", "knee"],
    about: bi("The two \"eyes\" of the knee with points above, below and on both sides of the joint.", "Hai \"mắt gối\" phối hợp các huyệt phía trên, dưới và hai bên khớp."),
    points: ["ST35", "NEIXIYAN", "GB34", "SP9", "SP10", "ST36"],
    selfCare: bi("Strengthen the thigh muscles, keep a healthy weight, avoid deep squatting; warmth for stiffness, cold for new swelling.", "Tập cơ đùi, giữ cân nặng hợp lý, tránh ngồi xổm lâu; chườm ấm khi cứng khớp, chườm lạnh khi mới sưng."),
    seeDoctor: bi("A hot, red, very swollen knee, inability to bear weight, locking, or after an injury.", "Gối sưng nóng đỏ nhiều, không chịu được sức nặng, kẹt khớp, hoặc sau chấn thương."),
  }),
  S({
    id: "elbow", group: "pain", name: bi("Elbow pain (tennis elbow)", "Đau khuỷu tay"),
    aliases: ["dau khuyu tay", "dau khuyu", "tennis elbow", "elbow pain", "viem moi tren loi cau"],
    about: bi("Local points on the outer elbow and forearm.", "Huyệt tại chỗ mặt ngoài khuỷu và cẳng tay."),
    points: ["LI11", "LI10", "LU5", "TE5"],
    selfCare: bi("Rest from gripping and repetitive mouse or tool use; stretch the forearm.", "Hạn chế cầm nắm, thao tác chuột lặp lại; giãn cơ cẳng tay."),
    seeDoctor: bi("Swelling, deformity after a fall, or pain lasting more than a few weeks.", "Sưng, biến dạng sau té, hoặc đau kéo dài vài tuần."),
  }),
  S({
    id: "wrist", group: "pain", name: bi("Wrist pain, numb fingers", "Đau cổ tay, tê tay"),
    aliases: ["dau co tay", "te tay", "te ngon tay", "ong co tay", "hoi chung ong co tay", "te bi tay", "wrist pain", "carpal tunnel", "numb hands"],
    about: bi("Points over and around the wrist, plus LI11 and LI4 along the arm.", "Huyệt quanh cổ tay, phối hợp Khúc Trì và Hợp Cốc trên đường kinh."),
    points: ["PC7", "PC6", "TE5", "LI4", "LI11", "LU9"],
    selfCare: bi("Keep the wrist straight when typing, take breaks, and shake the hands out.", "Giữ cổ tay thẳng khi gõ phím, nghỉ giải lao, vẩy nhẹ bàn tay."),
    seeDoctor: bi("Sudden numbness or weakness on one side of the body (stroke: call 115), weakness in the hand, or numbness that wakes you at night for weeks.", "Tê hoặc yếu đột ngột nửa người (nghi đột quỵ: gọi 115), bàn tay yếu, hoặc tê làm thức giấc ban đêm nhiều tuần."),
  }),
  S({
    id: "cramps", group: "pain", name: bi("Calf cramps", "Chuột rút bắp chân"),
    aliases: ["chuot rut", "vop be", "co rut", "cang bap chan", "cramp", "cramps", "leg cramps", "charley horse"],
    about: bi("BL57 sits right on the calf; GB34 is the meeting point of the sinews.", "Thừa Sơn nằm ngay trên bắp chân; Dương Lăng Tuyền là \"cân hội\"."),
    points: ["BL57", "GB34", "BL40", "KI1"],
    selfCare: bi("During a cramp, pull the toes toward you; drink enough water and stretch the calves before bed.", "Khi bị chuột rút, kéo các ngón chân về phía mình; uống đủ nước, giãn bắp chân trước khi ngủ."),
    seeDoctor: bi("A swollen, warm, painful calf (possible blood clot), or frequent cramps with weakness.", "Bắp chân sưng, nóng, đau (nghi huyết khối), hoặc chuột rút thường xuyên kèm yếu cơ."),
  }),
  S({
    id: "heel", group: "pain", name: bi("Heel & ankle pain", "Đau gót chân, cổ chân"),
    aliases: ["dau got chan", "dau co chan", "gai got", "viem can gan chan", "heel pain", "plantar fasciitis", "ankle pain"],
    about: bi("Points between the ankle bones and the Achilles tendon.", "Huyệt giữa mắt cá và gân gót."),
    points: ["KI3", "BL60", "KI6", "BL62", "ST41"],
    selfCare: bi("Roll the sole over a bottle, stretch the calf, wear cushioned shoes.", "Lăn gan bàn chân trên chai nước, giãn bắp chân, đi giày có đệm êm."),
    seeDoctor: bi("After a twist with swelling and you can't walk 4 steps, or a hot red joint.", "Sau khi trật chân bị sưng và không đi nổi 4 bước, hoặc khớp sưng nóng đỏ."),
  }),

  // ---------- Women's health ----------
  S({
    id: "period-pain", group: "women", name: bi("Menstrual cramps", "Đau bụng kinh"),
    aliases: ["dau bung kinh", "hanh kinh", "kinh nguyet", "dau bung duoi", "thong kinh", "menstrual cramps", "period pain", "dysmenorrhea"],
    about: bi("SP6 is the best-studied point for period pain; SP8 for acute cramps; warmth on CV4/CV6.", "Tam Âm Giao là huyệt được nghiên cứu nhiều nhất cho đau bụng kinh; Địa Cơ khi đau cấp; chườm ấm Quan Nguyên, Khí Hải."),
    points: ["SP6", "SP8", "CV4", "CV6", "LR3", "SP10", "LI4"],
    selfCare: bi("A warm pack on the lower belly, warm drinks (ginger), light movement, enough rest.", "Chườm ấm bụng dưới, uống nước ấm (trà gừng), vận động nhẹ, nghỉ ngơi đủ."),
    seeDoctor: bi("Pain that stops daily life or keeps getting worse, very heavy bleeding, pain outside periods, or if you might be pregnant.", "Đau đến mức không sinh hoạt được hoặc ngày càng tăng, ra máu rất nhiều, đau ngoài kỳ kinh, hoặc nghi có thai."),
  }),
  S({
    id: "pms", group: "women", name: bi("Premenstrual tension", "Căng thẳng trước kỳ kinh"),
    aliases: ["tien kinh nguyet", "cang tuc nguc", "cau gat truoc ky kinh", "pms", "premenstrual"],
    about: bi("Linked to stuck Liver qi; these points ease tension, breast tenderness and mood swings.", "Liên quan can khí uất; nhóm huyệt giúp sơ can, giảm căng tức ngực và thay đổi tâm trạng."),
    points: ["LR3", "PC6", "SP6", "CV17", "LI4"],
    selfCare: bi("Less salt, sugar and caffeine before your period; regular exercise; gentle stretching.", "Giảm muối, đường, cà phê trước kỳ kinh; tập thể dục đều đặn; giãn cơ nhẹ."),
    seeDoctor: bi("Mood changes severe enough to affect work or relationships.", "Thay đổi tâm trạng nặng đến mức ảnh hưởng công việc hoặc các mối quan hệ."),
  }),

  // ---------- Other ----------
  S({
    id: "itch", group: "other", name: bi("Itchy skin, hives", "Ngứa, mề đay"),
    aliases: ["ngua", "me day", "noi me day", "di ung da", "man ngua", "itch", "itchy", "hives", "urticaria", "rash"],
    about: bi("\"To treat wind, first treat the blood\": LI11 and SP10 are the main pair.", "\"Trị phong tiên trị huyết\": Khúc Trì và Huyết Hải là cặp huyệt chính."),
    points: ["LI11", "SP10", "GB31", "SP6", "LI4", "BL17"],
    selfCare: bi("Cool showers, loose cotton clothes, avoid scratching and note what triggers it.", "Tắm nước mát, mặc đồ cotton rộng, tránh gãi và ghi lại yếu tố gây ngứa."),
    seeDoctor: bi("Swelling of the lips, tongue or throat, or trouble breathing (anaphylaxis: call 115). Also hives lasting more than 6 weeks.", "Sưng môi, lưỡi, họng hoặc khó thở (sốc phản vệ: gọi 115). Hoặc mề đay kéo dài trên 6 tuần."),
  }),
  S({
    id: "blood-pressure", group: "other", name: bi("High blood pressure (support only)", "Tăng huyết áp (chỉ hỗ trợ)"),
    aliases: ["huyet ap cao", "tang huyet ap", "cao huyet ap", "high blood pressure", "hypertension"],
    about: bi("Supportive points only; never stop or change blood-pressure medicine on your own.", "Chỉ là biện pháp hỗ trợ; tuyệt đối không tự ngưng hoặc đổi thuốc huyết áp."),
    points: ["LR3", "LI11", "GB20", "KI1", "GV20"],
    selfCare: bi("Less salt, regular exercise, enough sleep, measure your blood pressure regularly.", "Ăn nhạt, tập thể dục đều, ngủ đủ, đo huyết áp thường xuyên."),
    seeDoctor: bi("Readings of 180/120 or higher, or high blood pressure with chest pain, severe headache, blurred vision, confusion or weakness: emergency (115).", "Huyết áp từ 180/120 trở lên, hoặc kèm đau ngực, đau đầu dữ dội, nhìn mờ, lú lẫn, yếu liệt: đi cấp cứu (115)."),
  }),
  S({
    id: "heavy-legs", group: "other", name: bi("Heavy legs, mild swelling", "Nặng chân, phù nhẹ"),
    aliases: ["nang chan", "phu chan", "sung chan", "moi chan", "heavy legs", "swollen legs", "swollen ankles", "edema"],
    about: bi("Points that strengthen the Spleen and move fluids.", "Nhóm huyệt kiện Tỳ, lợi thuỷ."),
    points: ["SP9", "ST36", "SP6", "KI3"],
    selfCare: bi("Raise your legs, walk regularly, avoid standing still for long, less salt.", "Kê cao chân, đi bộ thường xuyên, tránh đứng yên lâu, ăn nhạt."),
    seeDoctor: bi("Swelling in one leg only, with pain or redness, with breathlessness, or sudden swelling.", "Sưng một bên chân, kèm đau hoặc đỏ, kèm khó thở, hoặc sưng đột ngột."),
  }),
];

/** Symptoms that need emergency care, not acupressure. */
export const EMERGENCIES: { aliases: string[]; message: Bi }[] = [
  {
    aliases: ["dau nguc", "dau that nguc", "chest pain", "heart attack", "nhoi mau co tim", "tuc nguc du doi"],
    message: bi("Chest pain or pressure, especially spreading to the arm, jaw or back, or with sweating or breathlessness, can be a heart attack. Call 115 (or your local emergency number) now.",
      "Đau hoặc tức ngực, nhất là lan ra tay, hàm, lưng hoặc kèm vã mồ hôi, khó thở, có thể là nhồi máu cơ tim. Gọi 115 ngay."),
  },
  {
    aliases: ["dot quy", "meo mieng", "liet nua nguoi", "yeu nua nguoi", "noi ngong", "stroke", "face drooping", "tai bien"],
    message: bi("Face drooping, arm or leg weakness, or slurred speech can be a stroke. Every minute counts: call 115 now and note the time it started.",
      "Méo miệng, yếu tay chân một bên, nói khó có thể là đột quỵ. Từng phút đều quý: gọi 115 ngay và ghi lại thời điểm bắt đầu."),
  },
  {
    aliases: ["kho tho nang", "khong tho duoc", "ngat tho", "tim tai", "can't breathe", "severe shortness of breath", "choking", "hoc di vat"],
    message: bi("Severe difficulty breathing is an emergency. Call 115 now.", "Khó thở nặng là tình trạng cấp cứu. Gọi 115 ngay."),
  },
  {
    aliases: ["ho ra mau", "non ra mau", "coughing blood", "vomiting blood", "di ngoai ra mau", "phan den"],
    message: bi("Coughing or vomiting blood, or black stools, needs urgent medical care.", "Ho ra máu, nôn ra máu hoặc đi ngoài phân đen cần được khám cấp cứu."),
  },
  {
    aliases: ["co giat", "seizure", "dong kinh", "convulsion"],
    message: bi("During a seizure, don't hold the person down or put anything in their mouth; turn them on their side and call 115.",
      "Khi co giật, không giữ chặt hay nhét gì vào miệng; đặt người bệnh nằm nghiêng và gọi 115."),
  },
  {
    aliases: ["tu tu", "tu sat", "muon chet", "tu lam hai", "suicide", "self harm", "kill myself"],
    message: bi("You don't have to face this alone. Please reach out now to someone you trust or a local crisis line, or call 115 if you are in danger. In Vietnam you can also call the Ngày Mai hotline 096 306 1414.",
      "Bạn không phải một mình đối mặt với điều này. Hãy liên hệ ngay với người bạn tin tưởng hoặc đường dây hỗ trợ, hoặc gọi 115 nếu đang gặp nguy hiểm. Bạn cũng có thể gọi đường dây Ngày Mai: 096 306 1414."),
  },
];

// ---------- Search ----------

export const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** How well one query word matches one term word: exact, prefix, or a small typo ("khang" → "khan"). */
function wordScore(q: string, w: string): number {
  if (q === w) return 1;
  if (q.length >= 2 && w.startsWith(q)) return 0.85;
  if (q.length >= 4 && w.length >= 4 && editDistance(q, w) <= 1) return 0.7;
  if (q.length >= 3 && w.length >= 3 && editDistance(q, w) <= 1 && q[0] === w[0]) return 0.6;
  return 0;
}

/** Score a query against a list of phrases: the best phrase wins, by the share of query words matched. */
function phraseScore(query: string, phrases: string[]): number {
  const qw = fold(query).split(" ").filter(Boolean);
  if (!qw.length) return 0;
  let best = 0;
  for (const p of phrases) {
    const pw = fold(p).split(" ");
    const per = qw.map((q) => Math.max(0, ...pw.map((w) => wordScore(q, w))));
    if (per.some((s) => s === 0)) continue;
    // Prefer phrases that are fully covered by the query (fewer leftover words).
    const s = per.reduce((a, b) => a + b, 0) / qw.length - 0.03 * Math.max(0, pw.length - qw.length);
    best = Math.max(best, s);
  }
  return best;
}

export function searchSymptoms(query: string): Symptom[] {
  if (!fold(query)) return [];
  return SYMPTOMS.map((s) => ({ s, score: phraseScore(query, [s.name.en, s.name.vi, ...s.aliases]) }))
    .filter((x) => x.score >= 0.55)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.s);
}

export function searchPoints(query: string): Acupoint[] {
  const q = fold(query);
  if (!q) return [];
  return ACUPOINTS.map((p) => ({ p, score: fold(p.code) === q || fold(p.id) === q ? 2 : phraseScore(query, [p.vi, p.zh, p.en, p.code]) }))
    .filter((x) => x.score >= 0.7)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}

export function findEmergency(query: string) {
  if (!fold(query)) return undefined;
  return EMERGENCIES.find((e) => phraseScore(query, e.aliases) >= 0.9);
}

/** Symptoms that use a point, for the "used for" list. */
export const symptomsForPoint = (id: string) => SYMPTOMS.filter((s) => s.points.includes(id));

export const PRESS_GUIDE: Bi = bi(
  "Find a slight hollow that feels achy, heavy or tingly when pressed: that's the point. Use the thumb or middle finger, press gradually, and make slow small circles for 1–3 minutes per point while breathing evenly. Do paired points on both sides. Up to 2–3 times a day. Firm but never sharp pain.",
  "Tìm chỗ hơi lõm, khi ấn thấy tức, mỏi hoặc hơi tê lan: đó là đúng huyệt. Dùng đầu ngón cái hoặc ngón giữa, ấn tăng dần rồi day tròn chậm 1–3 phút mỗi huyệt, thở đều. Huyệt đôi thì bấm cả hai bên. Có thể làm 2–3 lần mỗi ngày. Ấn đủ thấy tức, không ấn đến mức đau nhói.",
);

export const CUN_GUIDE: Bi = bi(
  "Cun (thốn) is measured on the person being treated: 1 cun ≈ the width of their thumb at the knuckle; 1.5 cun ≈ index + middle fingers together; 3 cun ≈ four fingers together at the middle knuckle. Body segments have fixed lengths too: elbow crease to wrist crease = 12 cun, below the knee to the ankle bone = 16 cun, navel to pubic bone = 5 cun. The model uses these proportions.",
  "Thốn (đồng thân thốn) đo theo chính cơ thể người được bấm: 1 thốn ≈ bề ngang khớp đốt ngón cái; 1,5 thốn ≈ bề ngang ngón trỏ + ngón giữa khép; 3 thốn ≈ bề ngang bốn ngón khép (ngang khớp giữa ngón giữa). Các đoạn cơ thể cũng có số thốn cố định (cốt độ): nếp khuỷu đến lằn chỉ cổ tay = 12 thốn, nếp khoeo đến mắt cá ngoài = 16 thốn, rốn đến xương mu = 5 thốn. Mô hình 3D dựng vị trí theo đúng các tỷ lệ này.",
);

export const SAFETY: Bi = bi(
  "Acupressure is gentle self-care that can ease symptoms; it doesn't diagnose or replace medical treatment. Don't press on broken skin, bruises, varicose veins, swelling or a recent injury; avoid it right after a big meal, while very hungry or after alcohol. In pregnancy, skip the points marked 🤰. Be gentle with children, older people and anyone on blood thinners.",
  "Bấm huyệt là cách tự chăm sóc nhẹ nhàng giúp giảm triệu chứng, không thay thế chẩn đoán và điều trị y khoa. Không bấm lên vùng da trầy xước, bầm tím, giãn tĩnh mạch, sưng hoặc mới chấn thương; tránh bấm khi vừa ăn no, quá đói hoặc sau khi uống rượu. Khi mang thai, bỏ qua các huyệt có dấu 🤰. Ấn nhẹ với trẻ em, người cao tuổi và người đang dùng thuốc chống đông.",
);
