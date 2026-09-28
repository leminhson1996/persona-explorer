// Teachings of the Buddha from verifiable canonical sources (Pali Canon and two Mahāyāna sūtras
// widely chanted in Vietnam). Popular internet "Buddha quotes" without a canonical source are left out.
// Vietnamese and English are faithful renderings of the meaning, not quotations of a published translation.
import type { Bi } from "./i18n";

export type QuoteTheme = "mind" | "self" | "present" | "compassion" | "impermanence" | "letting-go" | "mindfulness" | "effort" | "wisdom" | "speech" | "anger";

export interface BuddhaQuote {
  id: string;
  source: Bi; // sutta / verse reference
  original?: string; // a short line of the Pali or Sino-Vietnamese, when well known
  text: Bi;
  themes: QuoteTheme[];
  reflect: Bi; // a question to sit with
}

export const THEMES: Record<QuoteTheme, { label: Bi; practice: Bi }> = {
  mind: { label: { en: "The mind", vi: "Tâm" }, practice: { en: "Three times today, pause and name the state of your mind (calm, restless, irritated…) without judging it.", vi: "Ba lần trong ngày, dừng lại và gọi tên trạng thái tâm mình (an, bồn chồn, bực bội…) mà không phán xét." } },
  self: { label: { en: "Returning to yourself", vi: "Quay về chính mình" }, practice: { en: "Before asking anyone for an answer today, sit for three breaths and ask yourself first.", vi: "Hôm nay, trước khi hỏi ai đó lời giải, hãy ngồi yên ba hơi thở và hỏi chính mình trước." } },
  present: { label: { en: "The present moment", vi: "Giây phút hiện tại" }, practice: { en: "Choose one routine task (washing up, walking) and do it with full attention, from start to end.", vi: "Chọn một việc quen thuộc (rửa bát, đi bộ) và làm trọn vẹn với sự chú tâm, từ đầu đến cuối." } },
  compassion: { label: { en: "Loving-kindness", vi: "Từ bi" }, practice: { en: "Silently wish three people well today: someone you love, someone neutral, someone difficult.", vi: "Hôm nay thầm chúc an lành cho ba người: một người thương, một người không thân không sơ, một người khó chịu với mình." } },
  impermanence: { label: { en: "Impermanence", vi: "Vô thường" }, practice: { en: "Notice one thing that has changed since yesterday, in you or around you, and let it be.", vi: "Nhận ra một điều đã thay đổi so với hôm qua, trong mình hay quanh mình, và để nó như vậy." } },
  "letting-go": { label: { en: "Letting go", vi: "Buông bỏ" }, practice: { en: "Write down one thing you're gripping. Breathe out slowly while reading it, three times.", vi: "Viết ra một điều mình đang nắm chặt. Đọc nó và thở ra thật chậm, ba lần." } },
  mindfulness: { label: { en: "Mindfulness", vi: "Chánh niệm" }, practice: { en: "Ten mindful breaths before each meal today.", vi: "Mười hơi thở chánh niệm trước mỗi bữa ăn hôm nay." } },
  effort: { label: { en: "Right effort", vi: "Tinh tấn" }, practice: { en: "Do one small wholesome thing you've been postponing, today, without waiting to feel ready.", vi: "Làm một việc thiện nhỏ mình vẫn trì hoãn, ngay hôm nay, không đợi đến lúc thấy sẵn sàng." } },
  wisdom: { label: { en: "Wisdom", vi: "Trí tuệ" }, practice: { en: "Take one belief you hold strongly and ask: have I seen this for myself, or only heard it?", vi: "Lấy một niềm tin mình giữ chặt và tự hỏi: mình đã tự thấy điều này, hay chỉ nghe người khác nói?" } },
  speech: { label: { en: "Right speech", vi: "Chánh ngữ" }, practice: { en: "Before speaking today, ask: is it true, is it kind, is it helpful, is it the right time?", vi: "Trước khi nói hôm nay, tự hỏi: có thật không, có tử tế không, có ích không, có đúng lúc không?" } },
  anger: { label: { en: "Meeting anger", vi: "Chuyển hóa sân hận" }, practice: { en: "When irritation arises, feel your feet on the ground and take three slow out-breaths before answering.", vi: "Khi bực bội khởi lên, cảm nhận bàn chân trên mặt đất và thở ra chậm ba hơi trước khi đáp lời." } },
};

const q = (id: string, source: Bi, text: Bi, themes: QuoteTheme[], reflect: Bi, original?: string): BuddhaQuote => ({ id, source, text, themes, reflect, original });
const pc = (n: string): Bi => ({ en: `Dhammapada, verse ${n}`, vi: `Kinh Pháp Cú, kệ ${n}` });

export const QUOTES: BuddhaQuote[] = [
  // --- Returning to yourself ---
  q("dn16-island",
    { en: "Mahāparinibbāna Sutta (DN 16)", vi: "Kinh Đại Bát Niết Bàn (Trường Bộ 16)" },
    { en: "Be islands unto yourselves, be a refuge unto yourselves, with no other refuge. Let the Dhamma be your island, the Dhamma your refuge, with no other refuge.", vi: "Hãy tự mình thắp đuốc lên mà đi, hãy nương tựa nơi chính mình, đừng nương tựa nơi nào khác. Hãy lấy Chánh pháp làm ngọn đuốc, lấy Chánh pháp làm nơi nương tựa." },
    ["self", "wisdom"],
    { en: "Where have I been looking for a refuge outside myself lately?", vi: "Dạo này mình đang tìm chỗ dựa ở bên ngoài, ở đâu?" },
    "Attadīpā viharatha attasaraṇā anaññasaraṇā"),
  q("dn16-last",
    { en: "Mahāparinibbāna Sutta (DN 16), the Buddha's last words", vi: "Kinh Đại Bát Niết Bàn (Trường Bộ 16), lời dạy cuối cùng" },
    { en: "All conditioned things are subject to decay. Strive on with heedfulness.", vi: "Các pháp hữu vi đều vô thường. Hãy tinh tấn, chớ có buông lung." },
    ["impermanence", "effort"],
    { en: "If this season of my life is passing, what is worth my full effort now?", vi: "Nếu giai đoạn này của đời mình rồi cũng qua đi, điều gì đáng để mình dốc lòng lúc này?" },
    "Vayadhammā saṅkhārā, appamādena sampādetha"),
  q("dhp160", pc("160"),
    { en: "You are your own protector; who else could be your protector? With yourself well trained, you find a protector hard to find.", vi: "Chính ta là nơi nương tựa của ta, ai khác có thể làm nơi nương tựa? Khi tự mình khéo điều phục, ta có được chỗ nương tựa khó tìm." },
    ["self"],
    { en: "In what situation today can I be my own support instead of waiting to be rescued?", vi: "Hôm nay, ở tình huống nào mình có thể tự làm chỗ dựa cho mình thay vì chờ người khác cứu?" }),
  q("dhp165", pc("165"),
    { en: "By yourself is evil done, by yourself are you defiled. By yourself is evil left undone, by yourself are you purified. Purity and impurity depend on yourself; no one can purify another.", vi: "Tự mình làm điều ác, tự mình làm nhơ bẩn mình. Tự mình tránh điều ác, tự mình làm thanh tịnh mình. Tịnh hay không tịnh là do tự mình, không ai có thể làm cho người khác thanh tịnh." },
    ["self", "mind"],
    { en: "What am I blaming on others that is really mine to change?", vi: "Điều gì mình đang đổ cho người khác, mà thật ra là phần mình có thể thay đổi?" }),
  q("dhp276", pc("276"),
    { en: "You yourselves must make the effort; the Buddhas only point the way. Those who practise and meditate are freed from the bonds of Māra.", vi: "Các người phải tự mình nỗ lực, các Đức Như Lai chỉ là người chỉ đường. Ai tu tập thiền định sẽ thoát khỏi sự trói buộc của ma." },
    ["self", "effort"],
    { en: "What have I understood but not yet practised?", vi: "Điều gì mình đã hiểu mà chưa thực hành?" }),
  q("dhp103", pc("103"),
    { en: "Though one conquer a thousand times a thousand men in battle, the one who conquers himself is the greatest of victors.", vi: "Dù chiến thắng ngàn quân trên trận địa ngàn lần, không bằng tự thắng chính mình; tự thắng mình mới là chiến công oanh liệt nhất." },
    ["self", "effort"],
    { en: "Which habit of mine would be the real victory to overcome?", vi: "Thói quen nào của mình, nếu vượt qua được, mới là chiến thắng thật sự?" }),
  q("dhp50", pc("50"),
    { en: "Do not look at the faults of others, at what they have done or left undone. Look instead at what you yourself have done and left undone.", vi: "Đừng nhìn lỗi người, người làm hay không làm. Hãy nhìn lại chính mình, việc gì đã làm, việc gì chưa làm." },
    ["self", "speech"],
    { en: "Whose faults have I been counting lately, and what would I see if I looked at my own?", vi: "Dạo này mình hay đếm lỗi của ai, và nếu nhìn lại chính mình thì mình sẽ thấy gì?" }),
  q("dhp380", pc("380"),
    { en: "You are your own master, you are your own refuge. Therefore train yourself, as a merchant trains a fine horse.", vi: "Chính ta là chủ của ta, chính ta là nơi nương tựa của ta. Vậy hãy tự điều phục mình, như người lái buôn khéo điều khiển con ngựa quý." },
    ["self", "effort"],
    { en: "What would gentle, patient self-training look like for me this week?", vi: "Tuần này, tự rèn mình một cách nhẹ nhàng và kiên nhẫn sẽ trông như thế nào?" }),

  // --- The mind ---
  q("dhp1", pc("1"),
    { en: "Mind is the forerunner of all things; mind is their chief, they are mind-made. If one speaks or acts with a corrupted mind, suffering follows as the wheel follows the foot of the ox.", vi: "Tâm dẫn đầu các pháp, tâm làm chủ, tâm tạo tác. Nếu nói năng hay hành động với tâm ô nhiễm, khổ đau sẽ theo sau như bánh xe lăn theo chân con bò kéo xe." },
    ["mind"],
    { en: "What state of mind was I in when I made my last hard decision?", vi: "Khi đưa ra quyết định khó gần đây nhất, tâm mình đang ở trạng thái nào?" },
    "Manopubbaṅgamā dhammā"),
  q("dhp2", pc("2"),
    { en: "Mind is the forerunner of all things. If one speaks or acts with a pure mind, happiness follows like a shadow that never leaves.", vi: "Tâm dẫn đầu các pháp. Nếu nói năng hay hành động với tâm thanh tịnh, an lạc sẽ theo sau như bóng không rời hình." },
    ["mind", "compassion"],
    { en: "What small action could I do today from a clear, kind heart?", vi: "Hôm nay mình có thể làm một việc nhỏ nào từ một tâm trong sáng, tử tế?" }),
  q("dhp35", pc("35"),
    { en: "Hard to restrain, swift, landing wherever it wishes, is the mind. To tame it is good; a tamed mind brings happiness.", vi: "Tâm khó nắm giữ, nhẹ và nhanh, thích đậu nơi nào nó muốn. Điều phục được tâm là điều lành; tâm được điều phục đem lại an lạc." },
    ["mind", "mindfulness"],
    { en: "Where does my mind keep landing when I'm not paying attention?", vi: "Khi mình không để ý, tâm mình hay bay đến đậu ở đâu?" }),
  q("dhp33", pc("33"),
    { en: "The restless, fickle mind, hard to guard, hard to hold back: the wise straighten it as a fletcher straightens an arrow.", vi: "Tâm dao động, bất định, khó giữ, khó ngăn: người trí làm cho nó ngay thẳng, như người thợ làm tên uốn thẳng mũi tên." },
    ["mind", "effort"],
    { en: "What one practice straightens my mind when it is scattered?", vi: "Khi tâm tán loạn, một pháp thực tập nào giúp mình làm tâm ngay thẳng trở lại?" }),
  q("dhp42-43", pc("42–43"),
    { en: "Whatever an enemy may do to an enemy, a wrongly directed mind does greater harm to oneself. Neither mother nor father nor any relative can do one greater good than one's own well-directed mind.", vi: "Kẻ thù hại kẻ thù, oan gia hại oan gia, không bằng tâm hướng tà gây hại cho chính mình. Cha mẹ hay họ hàng làm lợi cho ta, không bằng tâm hướng chánh đem lại lợi ích cho chính mình." },
    ["mind", "self"],
    { en: "Which thought pattern of mine harms me more than any person could?", vi: "Lối suy nghĩ nào của mình gây hại cho mình nhiều hơn bất kỳ ai?" }),
  q("an1-luminous",
    { en: "Aṅguttara Nikāya 1.49–52 (Pabhassara)", vi: "Tăng Chi Bộ 1.49–52 (Kinh Tâm Sáng Chói)" },
    { en: "Luminous is this mind, but it is defiled by passing defilements.", vi: "Tâm này vốn sáng chói, nhưng bị ô nhiễm bởi những phiền não từ bên ngoài đến." },
    ["mind", "wisdom"],
    { en: "If my true mind is clear, which 'visitor' is clouding it today?", vi: "Nếu tâm mình vốn trong sáng, thì hôm nay 'vị khách' nào đang làm nó vẩn đục?" },
    "Pabhassaramidaṃ cittaṃ"),
  q("mn19-inclination",
    { en: "Dvedhāvitakka Sutta (MN 19)", vi: "Kinh Song Tầm (Trung Bộ 19)" },
    { en: "Whatever one frequently thinks and ponders upon, that becomes the inclination of one's mind.", vi: "Điều gì mình thường xuyên suy nghĩ và tư duy đến, tâm mình sẽ nghiêng về điều ấy." },
    ["mind", "mindfulness"],
    { en: "What have I been thinking about most this week, and where is it bending my mind?", vi: "Tuần này mình nghĩ về điều gì nhiều nhất, và nó đang uốn tâm mình về phía nào?" }),

  // --- The present moment ---
  q("mn131-present",
    { en: "Bhaddekaratta Sutta (MN 131)", vi: "Kinh Nhất Dạ Hiền Giả (Trung Bộ 131)" },
    { en: "Do not chase after the past, nor build hopes on the future. The past is left behind; the future has not yet come. See clearly whatever arises right here, now.", vi: "Đừng tìm về quá khứ, đừng tưởng tới tương lai. Quá khứ đã qua rồi, tương lai thì chưa tới. Hãy quán chiếu rõ ràng những gì đang có mặt ngay bây giờ, tại đây." },
    ["present", "mindfulness"],
    { en: "Where does my mind go most: to yesterday or to tomorrow?", vi: "Tâm mình hay chạy về đâu nhất: về hôm qua hay về ngày mai?" }),
  q("ud1-10-bahiya",
    { en: "Bāhiya Sutta (Udāna 1.10)", vi: "Kinh Bāhiya (Phật Tự Thuyết 1.10)" },
    { en: "In the seen, there will be only the seen; in the heard, only the heard; in the sensed, only the sensed; in the known, only the known.", vi: "Trong cái thấy chỉ là cái thấy, trong cái nghe chỉ là cái nghe, trong cái cảm nhận chỉ là cái cảm nhận, trong cái biết chỉ là cái biết." },
    ["present", "wisdom"],
    { en: "What story did I add on top of something I simply saw or heard today?", vi: "Hôm nay, mình đã thêm câu chuyện gì lên trên một điều mình chỉ đơn giản thấy hoặc nghe?" }),
  q("mn10-direct-path",
    { en: "Satipaṭṭhāna Sutta (MN 10)", vi: "Kinh Niệm Xứ (Trung Bộ 10)" },
    { en: "This is the direct path for the purification of beings, for surmounting sorrow and lamentation, for the ending of pain and grief: the four foundations of mindfulness.", vi: "Đây là con đường độc nhất đưa đến thanh tịnh cho chúng sanh, vượt qua sầu bi, diệt trừ khổ ưu: đó là Bốn niệm xứ." },
    ["mindfulness", "present"],
    { en: "Body, feelings, mind, phenomena: which one do I rarely notice?", vi: "Thân, thọ, tâm, pháp: điều nào mình ít khi để ý tới nhất?" }),
  q("dhp21", pc("21"),
    { en: "Heedfulness is the path to the Deathless; heedlessness is the path to death. The heedful do not die; the heedless are as if already dead.", vi: "Không buông lung là con đường đến bất tử, buông lung là con đường dẫn đến chết. Người không buông lung thì không chết, kẻ buông lung dù sống cũng như chết." },
    ["mindfulness", "effort"],
    { en: "In which part of my day am I most on autopilot?", vi: "Phần nào trong ngày mình sống như cái máy nhiều nhất?" }),

  // --- Loving-kindness & anger ---
  q("dhp5", pc("5"),
    { en: "Hatred is never appeased by hatred in this world. By non-hatred alone is hatred appeased. This is an eternal law.", vi: "Hận thù không bao giờ diệt được hận thù ở thế gian này. Chỉ có từ bi mới dập tắt được hận thù. Đó là định luật ngàn đời." },
    ["anger", "compassion"],
    { en: "Is there a resentment I keep feeding? What would non-hatred look like there?", vi: "Có mối oán giận nào mình vẫn đang nuôi? Ở đó, không hận thù sẽ trông như thế nào?" },
    "Na hi verena verāni"),
  q("dhp3-4", pc("3–4"),
    { en: "'He abused me, he struck me, he defeated me, he robbed me': in those who harbour such thoughts, hatred does not cease. In those who do not harbour them, hatred ceases.", vi: "“Nó mắng tôi, đánh tôi, thắng tôi, cướp của tôi”: ai còn ôm ấp ý niệm ấy thì hận thù không dứt. Ai không ôm ấp ý niệm ấy thì hận thù được dứt." },
    ["anger", "letting-go"],
    { en: "Which old story of being wronged do I keep replaying?", vi: "Câu chuyện bị đối xử bất công nào mình vẫn cứ tua đi tua lại?" }),
  q("dhp223", pc("223"),
    { en: "Conquer anger with non-anger, conquer evil with good, conquer stinginess with giving, conquer the liar with truth.", vi: "Lấy không giận thắng giận, lấy thiện thắng ác, lấy bố thí thắng keo kiệt, lấy chân thật thắng lời nói dối." },
    ["anger", "compassion", "speech"],
    { en: "Where can I answer something unkind with its opposite this week?", vi: "Tuần này, ở đâu mình có thể đáp lại điều không tử tế bằng điều ngược lại?" }),
  q("sn1-8-metta",
    { en: "Karaṇīya Mettā Sutta (Sutta Nipāta 1.8)", vi: "Kinh Từ Bi (Kinh Tập 1.8)" },
    { en: "Just as a mother would protect her only child with her own life, so should one cultivate a boundless heart towards all beings.", vi: "Như người mẹ hết lòng che chở đứa con một của mình, dù phải hy sinh tính mạng, cũng vậy, hãy phát triển tâm từ vô lượng đối với tất cả chúng sanh." },
    ["compassion"],
    { en: "Who in my life needs this kind of protecting love, perhaps myself?", vi: "Trong đời mình, ai đang cần tình thương che chở như thế, có khi nào là chính mình?" }),
  q("sn36-6-arrows",
    { en: "Sallatha Sutta (SN 36.6)", vi: "Kinh Mũi Tên (Tương Ưng 36.6)" },
    { en: "When touched by a painful feeling, the untaught person sorrows and laments, and so feels two pains, bodily and mental, as if shot by an arrow and then by a second arrow.", vi: "Khi bị cảm thọ khổ chạm đến, người không học hỏi sầu muộn, than van, nên chịu hai cảm thọ, thân và tâm, như người bị bắn một mũi tên rồi lại bị bắn thêm mũi tên thứ hai." },
    ["mind", "letting-go"],
    { en: "What is the first arrow in my life right now, and what second arrow am I adding?", vi: "Mũi tên thứ nhất trong đời mình lúc này là gì, và mình đang tự bắn thêm mũi tên thứ hai nào?" }),

  // --- Impermanence & letting go ---
  q("dhp277-279", pc("277–279"),
    { en: "All conditioned things are impermanent; all conditioned things are suffering; all things are not-self. Seeing this with wisdom, one turns away from suffering: this is the path to purity.", vi: "Các hành là vô thường, các hành là khổ, các pháp là vô ngã. Khi lấy trí tuệ quán chiếu như vậy, người ta nhàm chán khổ đau: đó là con đường thanh tịnh." },
    ["impermanence", "wisdom", "letting-go"],
    { en: "What am I treating as permanent that isn't?", vi: "Điều gì mình đang đối xử như thể nó trường tồn, trong khi không phải vậy?" },
    "Sabbe saṅkhārā aniccā"),
  q("diamond-dream",
    { en: "Diamond Sūtra (Kim Cang), closing verse", vi: "Kinh Kim Cang, kệ kết" },
    { en: "All conditioned dharmas are like a dream, an illusion, a bubble, a shadow, like dew and like lightning. Thus should you contemplate them.", vi: "Tất cả pháp hữu vi như mộng, huyễn, bọt nước, bóng hình, như sương mai, như ánh chớp. Hãy quán chiếu như vậy." },
    ["impermanence", "letting-go"],
    { en: "What worry of today will I remember a year from now?", vi: "Nỗi lo nào hôm nay mình sẽ còn nhớ tới sau một năm nữa?" },
    "Nhất thiết hữu vi pháp, như mộng huyễn bào ảnh, như lộ diệc như điện, ưng tác như thị quán"),
  q("diamond-abide",
    { en: "Diamond Sūtra (Kim Cang)", vi: "Kinh Kim Cang" },
    { en: "One should give rise to a mind that abides nowhere.", vi: "Hãy để tâm sinh khởi mà không trụ vào đâu cả." },
    ["letting-go", "wisdom"],
    { en: "What is my mind stuck on right now, and can I let it move on?", vi: "Lúc này tâm mình đang dính mắc vào điều gì, và mình có thể để nó trôi đi không?" },
    "Ưng vô sở trụ nhi sanh kỳ tâm"),
  q("heart-emptiness",
    { en: "Heart Sūtra, spoken by Bodhisattva Avalokiteśvara to Śāriputra", vi: "Bát Nhã Tâm Kinh, lời Bồ Tát Quán Tự Tại dạy ngài Xá Lợi Phất" },
    { en: "Form is not different from emptiness, emptiness is not different from form; form is emptiness, emptiness is form.", vi: "Sắc chẳng khác không, không chẳng khác sắc; sắc tức là không, không tức là sắc." },
    ["wisdom", "impermanence"],
    { en: "What label am I holding about myself that is less solid than it seems?", vi: "Nhãn mác nào mình đang dán cho bản thân mà thật ra không vững chắc như mình nghĩ?" },
    "Sắc bất dị không, không bất dị sắc"),
  q("mn22-raft",
    { en: "Alagaddūpama Sutta (MN 22), the simile of the raft", vi: "Kinh Ví Dụ Con Rắn (Trung Bộ 22), ẩn dụ chiếc bè" },
    { en: "I have taught the Dhamma as a raft, for crossing over, not for holding on to. Having crossed, you should let go even of the teachings, how much more of what is not the teaching.", vi: "Ta dạy pháp như chiếc bè, để vượt qua, không phải để nắm giữ. Qua sông rồi, đến pháp còn phải buông, huống gì là phi pháp." },
    ["letting-go", "wisdom"],
    { en: "Which rule or method once helped me but now only weighs me down?", vi: "Nguyên tắc hay phương pháp nào từng giúp mình, nhưng giờ chỉ còn là gánh nặng?" }),
  q("dhp81", pc("81"),
    { en: "As a solid rock is not shaken by the wind, so the wise are not moved by praise or blame.", vi: "Như tảng đá kiên cố không bị gió lay động, người trí không dao động trước lời khen hay tiếng chê." },
    ["letting-go", "mind"],
    { en: "Whose praise or blame has too much power over me?", vi: "Lời khen hay tiếng chê của ai đang có quá nhiều sức mạnh với mình?" }),

  // --- Effort, speech, wisdom ---
  q("dhp121-122", pc("121–122"),
    { en: "Do not think lightly of evil, saying 'it will not come to me'; drop by drop the water pot is filled. Do not think lightly of good, saying 'it will not come to me'; drop by drop the wise fill themselves with good.", vi: "Chớ xem thường điều ác nhỏ mà nghĩ “chẳng đến với ta”; giọt nước nhỏ mãi cũng đầy bình. Chớ xem thường điều thiện nhỏ mà nghĩ “chẳng đến với ta”; người trí tích dần từng chút mà đầy điều lành." },
    ["effort"],
    { en: "What small drop, good or bad, am I adding to my life every day?", vi: "Giọt nước nhỏ nào, tốt hay xấu, mình đang thêm vào đời mình mỗi ngày?" }),
  q("dhp183", pc("183"),
    { en: "To avoid all evil, to cultivate the good, and to purify one's mind: this is the teaching of the Buddhas.", vi: "Không làm các điều ác, siêng làm các việc lành, giữ tâm ý trong sạch: đó là lời chư Phật dạy." },
    ["effort", "mind"],
    { en: "Of these three, which one needs my attention most this week?", vi: "Trong ba điều này, điều nào cần mình chú tâm nhất trong tuần này?" },
    "Sabbapāpassa akaraṇaṃ"),
  q("dhp25", pc("25"),
    { en: "Through effort, heedfulness, discipline and self-control, let the wise make an island that no flood can overwhelm.", vi: "Bằng tinh cần, không buông lung, bằng giới hạnh và tự chế, người trí hãy tự tạo cho mình một hòn đảo mà nước lũ không thể nhận chìm." },
    ["effort", "self"],
    { en: "What daily practice would make an island for me when life floods?", vi: "Pháp thực tập hằng ngày nào sẽ là hòn đảo cho mình khi đời dâng lũ?" }),
  q("dhp100", pc("100"),
    { en: "Better than a thousand words without meaning is a single meaningful word which, on hearing it, brings peace.", vi: "Dù nói ngàn lời mà vô nghĩa, không bằng một câu có nghĩa, nghe xong được an tịnh." },
    ["speech"],
    { en: "What one sentence could I say today that would bring someone peace?", vi: "Hôm nay mình có thể nói một câu nào đem lại bình an cho ai đó?" }),
  q("an3-65-kalama",
    { en: "Kālāma Sutta (AN 3.65)", vi: "Kinh Kālāma (Tăng Chi 3.65)" },
    { en: "Do not accept something because it is reported, or traditional, or in the scriptures, or because the teacher is respected. When you yourselves know 'these things are wholesome, blameless, praised by the wise, and lead to welfare and happiness', then take them up and live by them.", vi: "Chớ vội tin điều gì vì nghe truyền lại, vì theo truyền thống, vì có trong kinh điển, hay vì vị thầy được kính trọng. Khi nào tự mình biết rõ “các pháp này là thiện, không có lỗi, được người trí tán thán, đưa đến hạnh phúc và an lạc”, thì hãy chấp nhận và sống theo." },
    ["wisdom", "self"],
    { en: "What do I believe mostly because someone I respect said it?", vi: "Điều gì mình tin chủ yếu chỉ vì một người mình kính trọng đã nói?" }),
  q("dhp282", pc("282"),
    { en: "From meditation wisdom arises; without meditation wisdom declines. Knowing these two paths, of growth and of decline, let one conduct oneself so that wisdom grows.", vi: "Tu thiền thì trí tuệ sinh, không tu thiền thì trí tuệ diệt. Biết rõ hai con đường tăng trưởng và suy giảm này, hãy tự sắp đặt mình để trí tuệ được tăng trưởng." },
    ["wisdom", "mindfulness"],
    { en: "When did I last sit quietly with nothing to do?", vi: "Lần cuối mình ngồi yên mà không làm gì cả là khi nào?" }),
  q("dhp204", pc("204"),
    { en: "Health is the greatest gain, contentment the greatest wealth, a trusted friend the best of kin, Nibbāna the highest happiness.", vi: "Không bệnh là lợi lớn nhất, biết đủ là giàu nhất, người đáng tin là bà con thân nhất, Niết bàn là an lạc tối thượng." },
    ["letting-go", "wisdom"],
    { en: "What do I already have that is enough?", vi: "Mình đã có sẵn điều gì mà thật ra là đủ?" }),
  q("sn56-11-middle",
    { en: "Dhammacakkappavattana Sutta (SN 56.11), the first sermon", vi: "Kinh Chuyển Pháp Luân (Tương Ưng 56.11), bài pháp đầu tiên" },
    { en: "Avoiding both extremes, of indulgence in sense pleasures and of self-torment, the Tathāgata has awakened to the Middle Way, which gives vision, gives knowledge, and leads to peace.", vi: "Tránh xa hai cực đoan là đắm say dục lạc và tự hành khổ mình, Như Lai đã giác ngộ Trung Đạo, con đường đem lại con mắt, đem lại trí tuệ, đưa đến an tịnh." },
    ["wisdom", "effort"],
    { en: "Where am I swinging between too much and too little?", vi: "Ở đâu mình đang đong đưa giữa thái quá và bất cập?" }),
  q("sn45-2-friendship",
    { en: "Upaḍḍha Sutta (SN 45.2)", vi: "Kinh Một Nửa (Tương Ưng 45.2)" },
    { en: "Admirable friendship, admirable companionship, admirable comradeship is actually the whole of the holy life.", vi: "Có bạn lành, có bạn tốt, có thân hữu lành: đó chính là toàn bộ đời sống phạm hạnh." },
    ["compassion", "effort"],
    { en: "Who helps me become my better self, and do I tell them?", vi: "Ai giúp mình trở thành phiên bản tốt hơn, và mình có nói cho họ biết không?" }),
];

export const quoteById = (id: string) => QUOTES.find((x) => x.id === id);

/** Wrap in quotation marks unless the text already starts with one. */
export const quoted = (text: string) => (/^[“"]/.test(text) ? text : `“${text}”`);

// ---------- Personal state (saved in my_data/quotes.json) ----------

export interface QuotePick {
  date: string; // YYYY-MM-DD
  id: string;
  note?: string; // their reflection
}

export interface QuoteState {
  picks: QuotePick[];
  favorites: string[];
}

export const emptyQuoteState = (): QuoteState => ({ picks: [], favorites: [] });

/** A gentle suggestion: random, but not one picked in the last 14 days. */
export function suggestQuote(state: QuoteState, theme?: QuoteTheme): BuddhaQuote {
  const recent = new Set(state.picks.slice(-14).map((p) => p.id));
  const pool = QUOTES.filter((x) => (!theme || x.themes.includes(theme)) && !recent.has(x.id));
  const list = pool.length ? pool : QUOTES.filter((x) => !theme || x.themes.includes(theme));
  const r = new Uint32Array(1);
  crypto.getRandomValues(r);
  return list[r[0] % list.length];
}

export function describeQuote(state: QuoteState, today: string): string {
  const pick = state.picks.find((p) => p.date === today);
  if (!pick) return "";
  const x = quoteById(pick.id);
  if (!x) return "";
  return [
    "### The Buddha's words they chose for today",
    `- ${x.source.en}: "${x.text.en}"`,
    pick.note ? `- Their reflection on it: ${pick.note.slice(0, 600)}` : "",
  ].filter(Boolean).join("\n");
}
