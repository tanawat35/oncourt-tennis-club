// ─────────────────────────────────────────────────────────────
//  ไฟล์ตั้งค่าเว็บไซต์ (แก้ข้อมูลธุรกิจทั้งหมดได้ที่นี่ไฟล์เดียว)
//  Every business fact on the site comes from this file.
//  Values marked SAMPLE are placeholders until the coach confirms.
// ─────────────────────────────────────────────────────────────

export const CLUB = {
  name: 'On Court Tennis Club',
  coach: 'Coach Mark',
  coachFull: 'Worradit Pathamarot',
  handle: '@markutc',
  province: { th: 'จังหวัดอุตรดิตถ์', en: 'Uttaradit, Thailand' },
  links: {
    instagram: 'https://www.instagram.com/markutc',
    facebook: 'https://www.facebook.com/oncourttennisclub',
    maps: 'https://share.google/CYWM4kL0xz8W3x4ZG',
    line: '', // SAMPLE: e.g. 'https://line.me/ti/p/~oncourt'
  },
  phone: '091-024-5124',
  promptpay: '', // PromptPay phone or national-ID. Empty = QR hidden (pay at club)
  adminPin: '2026', // PIN for #admin when the site runs without our server. Change before going live.
  openHour: 6, // SAMPLE 06:00
  closeHour: 22, // SAMPLE 22:00 (last slot starts 21:00)
  nightFrom: 18, // evening rate starts (SAMPLE)
  courts: [
    { id: 'c1', th: 'คอร์ต 1', en: 'Court 1' },
    { id: 'c2', th: 'คอร์ต 2', en: 'Court 2' },
  ],
  bookAheadDays: 14,
};

// Where photos/videos live (public/media)
export const M = (f) => ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_MEDIA) || './media/') + f;

// SAMPLE prices (THB)
export const COURT_RATE = { day: 300, night: 400 };

export const PROGRAMS = [
  {
    id: 'private', price: 1000, unit: 'hr', hours: 1, seats: '1:1', img: 'rally-forehand.webp',
    th: { name: 'Private 1:1', tag: 'เร่งฝีมือเร็วที่สุด', desc: 'โค้ชมาร์คดูคุณคนเดียวทั้งชั่วโมง แก้ท่าทีละจุด วางแผนการเล่นเฉพาะตัว' },
    en: { name: 'Private 1:1', tag: 'Fastest progress', desc: 'A full hour of Coach Mark on your game alone. One fix at a time, a plan built around you.' },
  },
  {
    id: 'semi', price: 700, unit: 'person', hours: 1, seats: '1:2', img: 'kid-lesson.webp',
    th: { name: 'Semi-Private', tag: 'มากับเพื่อนหรือครอบครัว', desc: 'เรียนคู่กับเพื่อนหรือคนในครอบครัว ได้ทั้งเทคนิคและการตีโต้จริง' },
    en: { name: 'Semi-Private', tag: 'Bring a partner', desc: 'Train with a friend or family member: technique plus real live rallies.' },
  },
  {
    id: 'group', price: 450, unit: 'person', hours: 1.5, seats: '4–6', img: 'ladder-drill.webp',
    th: { name: 'Group Clinic', tag: 'สนุก ได้เพื่อน', desc: 'คลาสกลุ่มแบ่งตามระดับ ดริลฟุตเวิร์กเข้มข้น จบด้วยเกมแข่งทุกครั้ง' },
    en: { name: 'Group Clinic', tag: 'Social & intense', desc: 'Level-matched group drills with footwork work, always finishing with competitive games.' },
  },
  {
    id: 'junior', price: 3200, unit: 'month', hours: 1, seats: '6–15 yrs', img: 'footwork-drill.webp',
    th: { name: 'Junior Academy', tag: 'อายุ 6–15 ปี', desc: 'หลักสูตรเด็ก 8 ครั้ง/เดือน ปูพื้นฐานถูกต้องตั้งแต่แรก จนพร้อมลงแข่งระดับเยาวชน' },
    en: { name: 'Junior Academy', tag: 'Ages 6–15', desc: '8 sessions a month. Correct fundamentals from day one, all the way to junior tournaments.' },
  },
];

export const PLANS = [
  {
    id: 'rally', price: 0,
    th: { name: 'Rally', note: 'สมัครฟรี', perks: ['รับ 50 แต้มต้อนรับ', 'สะสมแต้มทุกการจอง', 'ข่าวคลาสและแมตช์ก่อนใคร'] },
    en: { name: 'Rally', note: 'Free', perks: ['50 welcome points', 'Earn points on every booking', 'First to hear about clinics & matches'] },
  },
  {
    id: 'baseline', price: 1500, featured: true,
    th: { name: 'Baseline', note: '/เดือน', perks: ['ลดค่าคอร์ต 10% ทุกช่วงเวลา', 'จองล่วงหน้าได้ 14 วัน', 'ฟรี Group Clinic 1 ครั้ง/เดือน'] },
    en: { name: 'Baseline', note: '/month', perks: ['10% off every court booking', 'Book up to 14 days ahead', '1 free Group Clinic per month'] },
  },
  {
    id: 'ace', price: 3900,
    th: { name: 'Ace', note: '/เดือน', perks: ['คอร์ตฟรี 4 ชั่วโมง/เดือน', 'ลดค่าเรียน 20% ทุกโปรแกรม', 'Match Night รายเดือนกับโค้ช'] },
    en: { name: 'Ace', note: '/month', perks: ['4 free court hours per month', '20% off every lesson program', 'Monthly Match Night with the coach'] },
  },
];

export const LEVELS = [
  { id: 'new', th: 'เพิ่งเริ่ม', en: 'Brand new' },
  { id: 'beginner', th: 'พื้นฐาน', en: 'Beginner' },
  { id: 'intermediate', th: 'กลาง', en: 'Intermediate' },
  { id: 'advanced', th: 'แข่งขัน', en: 'Advanced / competitive' },
];

// ─── Points (SAMPLE rules — confirm with the coach) ─────────────
export const POINTS = { bahtPerPoint: 10, signupBonus: 50 };
export const TIERS = [
  { id: 'rookie', min: 0, bonus: 0, name: 'Rookie' },
  { id: 'challenger', min: 500, bonus: 0.1, name: 'Challenger' },
  { id: 'pro', min: 1500, bonus: 0.2, name: 'Pro' },
  { id: 'champion', min: 3000, bonus: 0.3, name: 'Champion' },
];
export const REWARDS = [
  { id: 'balls', pts: 100, th: 'ลูกเทนนิส 1 กระป๋อง', en: '1 can of balls' },
  { id: 'string', pts: 250, th: 'ค่าแรงขึ้นเอ็นฟรี 1 ครั้ง', en: 'Free stringing labour' },
  { id: 'court', pts: 400, th: 'เช่าคอร์ตฟรี 1 ชม.', en: '1 free court hour' },
  { id: 'private', pts: 1000, th: 'Private 1:1 ฟรี 1 ชม.', en: 'Free 1-hour private lesson' },
];

// ─── Real content from the club (photos, results) ─────────────
export const ACHIEVEMENTS = {
  athlete: { th: 'ด.ญ.สุธาสินี รัตนปกรณ์', en: 'Suthasinee Rattanapakorn' },
  results: [
    { place: '3rd', th: { t: 'รองชนะเลิศอันดับ 2 · หญิงเดี่ยว U16', e: 'PTT-พัฒนาฝีมือ ครั้งที่ 5 ประจำปี 2569 (ภาคเหนือ) · จ.เชียงราย' }, en: { t: '2nd Runner-Up · Girls’ Singles U16', e: 'PTT Tennis Skill Development No. 5, 2026 (Northern) · Chiang Rai' } },
    { place: '3rd', th: { t: 'รองชนะเลิศอันดับ 2 · หญิงเดี่ยว U16', e: 'Cross Court Club · จ.เชียงใหม่' }, en: { t: '2nd Runner-Up · Girls’ Singles U16', e: 'Cross Court Club · Chiang Mai' } },
    { place: '3rd', th: { t: 'รองชนะเลิศอันดับ 2 · หญิงเดี่ยว U18', e: 'Cross Court Club · จ.เชียงใหม่' }, en: { t: '2nd Runner-Up · Girls’ Singles U18', e: 'Cross Court Club · Chiang Mai' } },
    { place: '2nd', th: { t: 'รองชนะเลิศอันดับ 1 · หญิงคู่ U14', e: 'Cross Court Club · จ.เชียงใหม่' }, en: { t: '1st Runner-Up · Girls’ Doubles U14', e: 'Cross Court Club · Chiang Mai' } },
  ],
  photos: ['trophy.webp', 'podium.webp', 'team-tournament.webp', 'poster-ptt.webp'],
};

export const FILMS = [
  { src: 'film-feeding', wide: true, th: 'ป้อนลูกฝึกตีจริงในคอร์ต', en: 'Live-ball feeding drills' },
  { src: 'film-footwork', th: 'ฟุตเวิร์กสำหรับเด็ก', en: 'Junior footwork' },
  { src: 'film-splitstep', th: 'Split Step จังหวะเตรียมเคลื่อนที่', en: 'The split step' },
  { src: 'film-rally', th: 'ตีโต้จากเส้นหลัง', en: 'Baseline rally' },
];

export const GALLERY = [
  { f: 'serve-basket.webp', th: 'ฝึกเสิร์ฟกับตะกร้าลูก', en: 'Serve practice' },
  { f: 'kid-coach.webp', th: 'คลาสเด็กกับโค้ช', en: 'Junior lesson' },
  { f: 'racket-net.webp', th: 'สนามในร่ม On Court', en: 'Our indoor court' },
  { f: 'player-ball.webp', th: 'สมาชิกของคลับ', en: 'Club member' },
  { f: 'rally-back.webp', th: 'ตีโต้ยามเย็น', en: 'Evening rally' },
  { f: 'tee-drill.webp', th: 'ดริลฝึกจังหวะ', en: 'Timing drill' },
  { f: 'forehand-lunge.webp', th: 'โฟร์แฮนด์', en: 'Forehand' },
  { f: 'player-lifestyle.webp', th: 'Play Hard, Stay Humble', en: 'Play Hard, Stay Humble' },
  { f: 'ball-bag.webp', th: 'พร้อมลงคอร์ต', en: 'Ready to play' },
  { f: 'kid-lesson.webp', th: 'เรียนเป็นครอบครัว', en: 'Family lesson' },
];

// ─── UI copy ────────────────────────────────────────────────
export const I18N = {
  th: {
    skip: 'ข้ามไปเนื้อหาหลัก',
    nav: { coach: 'โค้ช', film: 'ในคอร์ต', programs: 'คอร์สเรียน', court: 'เช่าคอร์ต', fame: 'ผลงาน', points: 'แต้มสะสม', book: 'จองเลย' },
    loader: 'กำลังเปิดไฟสนาม',
    hero: {
      eyebrow: 'On Court Tennis Club · อุตรดิตถ์',
      title: 'ทุกช็อตที่ดี<br>เริ่มจากก้าวแรก<span class="nw">ในคอร์ต</span>',
      sub: 'สนามเทนนิสในร่มแห่งแรกและแห่งเดียวในจังหวัดอุตรดิตถ์ เรียนกับโค้ชมาร์คที่ได้รับการรับรองจาก ITF และจองคอร์ตได้ในที่เดียว',
      ctaBook: 'จองคอร์ต', ctaLesson: 'จองเรียนกับโค้ช', scroll: 'เลื่อนลงเพื่อเริ่มแมตช์',
    },
    coach: {
      eyebrow: 'บทที่ 1 — The Coach',
      title: 'โค้ชมาร์ค<br>ITF Certified Coach',
      body: 'Worradit Pathamarot หรือโค้ชมาร์ค เป็นทั้งโค้ชและนักเทนนิส ผ่านหลักสูตรโค้ชของสมาคมลอนเทนนิสแห่งประเทศไทยร่วมกับสหพันธ์เทนนิสนานาชาติ (ITF) ทุกคลาสเริ่มจากดูว่าคุณเล่นอย่างไร แล้วแก้ทีละจุดให้ตีได้แน่นขึ้น เร็วขึ้น และสนุกขึ้น',
      points: ['ITF Level 1 Coach', 'Certified LTAT/ITF Play & Stay Coach', 'หลักสูตร 80 ชั่วโมง ศูนย์พัฒนากีฬาเทนนิสแห่งชาติ นนทบุรี'],
      photo: 'โค้ชมาร์ค · Worradit Pathamarot', cert: 'ดูใบรับรอง ITF',
    },
    method: {
      eyebrow: 'บทที่ 2 — The Method',
      title: 'สี่จังหวะสู่เกมที่มั่นใจ',
      steps: [
        { k: '01', t: 'Footwork', d: 'เท้าไปก่อน ไม้ตามหลัง ฝึก Split Step การเคลื่อนที่และการตั้งหลักให้ถึงลูกทุกลูก' },
        { k: '02', t: 'Technique', d: 'Forehand, Backhand, Serve, Volley ปรับวงสวิงให้ถูกหลักและไม่บาดเจ็บ' },
        { k: '03', t: 'Tactics', d: 'รู้ว่าจะตีไปที่ไหน เมื่อไร และเพราะอะไร อ่านเกมคู่แข่งให้ออก' },
        { k: '04', t: 'Match Play', d: 'เอาทุกอย่างมาใช้ในแมตช์จริง ฝึกใจให้นิ่งในแต้มสำคัญ' },
      ],
    },
    film: { eyebrow: 'บทที่ 3 — Inside On Court', title: 'ภาพจริงจากคอร์ตของเรา', sound: 'คลิปไม่มีเสียง' },
    programs: {
      eyebrow: 'บทที่ 4 — Programs',
      title: 'เลือกคอร์สที่ใช่สำหรับคุณ',
      unit: { hr: 'บาท/ชม.', person: 'บาท/คน', month: 'บาท/เดือน' },
      hours: 'ชม.', seats: 'ผู้เรียน', book: 'จองคอร์สนี้',
    },
    court: {
      eyebrow: 'บทที่ 5 — The Court',
      title: 'สนามในร่ม<br>เล่นได้ทุก<span class="nw">สภาพอากาศ</span>',
      body: 'คอร์ตฮาร์ดในอาคารพร้อมไฟส่องสว่างทั้งสนาม ไม่ต้องกลัวฝนหรือแดด จองเป็นรายชั่วโมง เลือกคอร์ตและเวลาที่ว่างได้ทันที',
      day: 'ช่วงกลางวัน', night: 'ช่วงเย็น', perHour: 'บาท/ชม.', hours: 'เปิดทุกวัน', book: 'ดูเวลาว่าง',
    },
    fame: {
      eyebrow: 'บทที่ 6 — Wall of Fame',
      title: 'ผลงานลูกศิษย์',
      lead: 'ตัวแทนจากจังหวัดอุตรดิตถ์ ที่ฝึกซ้อมกับ On Court Tennis Club',
      quote: 'Play · Train · Grow — On Court, we build champions',
    },
    shop: {
      eyebrow: 'Pro Shop',
      title: 'อุปกรณ์ครบ<br>ขึ้นเอ็นได้ที่คลับ',
      body: 'จำหน่ายไม้ ลูก กระเป๋า และอุปกรณ์เทนนิส พร้อมเครื่องขึ้นเอ็นในร้าน',
      rules: [['เคารพกติกา', 'Respect the rules'], ['เคารพคู่แข่ง', 'Respect your opponent'], ['ดูแลสนาม', 'Take care of the court'], ['สนุกกับเกม', 'Enjoy the game']],
      rulesTitle: 'กติกาของคลับ',
    },
    member: {
      eyebrow: 'บทที่ 7 — Membership',
      title: 'เป็นส่วนหนึ่งของคลับ',
      join: 'สมัคร', popular: 'คุ้มที่สุด',
    },
    points: {
      eyebrow: 'On Court Points',
      title: 'ตีได้แต้ม<br>สะสมแลกรางวัล',
      how: [
        ['ทุก 10 บาท = 1 แต้ม', 'เมื่อโค้ชยืนยันการจองคอร์ตหรือคลาสเรียน'],
        ['สมัครสมาชิกรับ 50 แต้ม', 'ได้ทันทีเมื่อโค้ชอนุมัติ'],
        ['เลื่อนระดับ ได้แต้มเพิ่ม', 'Challenger +10% · Pro +20% · Champion +30%'],
      ],
      rewardsTitle: 'รางวัลที่แลกได้', pts: 'แต้ม',
      checkTitle: 'เช็กแต้มของคุณ', phone: 'เบอร์โทรที่ใช้จอง', check: 'เช็กแต้ม',
      balance: 'แต้มคงเหลือ', lifetime: 'สะสมทั้งหมด', tier: 'ระดับ', next: 'อีก {n} แต้ม ถึงระดับ {t}', maxTier: 'ระดับสูงสุดแล้ว',
      canRedeem: 'แลกได้', need: 'อีก {n}', history: 'ประวัติแต้ม', empty: 'ยังไม่มีแต้มสำหรับเบอร์นี้ จองคอร์ตหรือสมัครสมาชิกเพื่อเริ่มสะสม',
      redeemNote: 'แลกรางวัลที่เคาน์เตอร์ โค้ชจะหักแต้มให้', reasons: { booking: 'จองสำเร็จ', signup: 'ต้อนรับสมาชิกใหม่', redeem: 'แลกรางวัล', adjust: 'ปรับแต้ม', reverse: 'ยกเลิกการจอง' },
    },
    book: {
      eyebrow: 'Match Point',
      title: 'จองวันนี้ เจอกันที่คอร์ต',
      tabCourt: 'จองคอร์ต', tabLesson: 'จองเรียน', tabMember: 'สมัครสมาชิก',
      date: 'เลือกวัน', time: 'เลือกเวลา', court: 'เลือกคอร์ต', program: 'เลือกคอร์ส', duration: 'ระยะเวลา',
      hr: 'ชม.', level: 'ระดับฝีมือ', name: 'ชื่อ-นามสกุล', phone: 'เบอร์โทร', line: 'LINE ID (ถ้ามี)', email: 'อีเมล', note: 'หมายเหตุถึงโค้ช',
      plan: 'แพ็กเกจสมาชิก', total: 'ยอดรวม', earn: 'แต้มที่จะได้',
      sum: { date: 'วันที่', time: 'เวลา', court: 'คอร์ต', program: 'คอร์ส', plan: 'แพ็กเกจ', name: 'ชื่อ' },
      submit: 'ยืนยันการจอง', submitMember: 'สมัครสมาชิก',
      taken: 'เต็ม', free: 'ว่าง', coachBusy: 'โค้ชไม่ว่าง', past: 'ผ่านแล้ว',
      pickSlot: 'เลือกเวลาที่ว่างก่อน', required: 'กรุณากรอกช่องนี้', phoneBad: 'เบอร์โทร 9–10 หลัก',
      conflict: 'ขออภัย เวลานี้เพิ่งถูกจองไป กรุณาเลือกเวลาใหม่',
      successTitle: 'รับคำขอจองแล้ว', successMember: 'ยินดีต้อนรับสู่คลับ',
      successBody: 'สถานะ: รอโค้ชยืนยัน โค้ชจะติดต่อกลับทางโทรศัพท์หรือ LINE',
      earnNote: '+{n} แต้ม เข้าบัญชีเมื่อโค้ชยืนยัน',
      ref: 'รหัสการจอง', memberNo: 'เลขสมาชิก', payTitle: 'ชำระผ่าน PromptPay', payAtClub: 'ชำระที่คลับได้ในวันที่มาเล่น',
      again: 'จองเพิ่ม', close: 'ปิด', saving: 'กำลังบันทึก…',
      demoNote: 'โหมดทดลอง: ข้อมูลบันทึกไว้ในเบราว์เซอร์นี้เท่านั้น',
      priceNote: 'ราคาและกติกาแต้มเป็นค่าตัวอย่าง ยืนยันกับโค้ชก่อนชำระเงิน',
    },
    gallery: { title: 'ชีวิตในคลับ' },
    faq: {
      title: 'คำถามที่พบบ่อย',
      items: [
        ['ไม่เคยเล่นเทนนิสเลย เรียนได้ไหม', 'ได้ครับ คลาสแรกโค้ชจะเริ่มตั้งแต่การจับไม้และการยืน เลือกระดับ "เพิ่งเริ่ม" ตอนจองได้เลย'],
        ['ต้องมีไม้เทนนิสเองไหม', 'ครั้งแรกไม่จำเป็น แจ้งในหมายเหตุตอนจองได้ หรือเลือกซื้อที่ Pro Shop ของคลับ'],
        ['ฝนตกเล่นได้ไหม', 'ได้ครับ สนามเป็นคอร์ตในร่ม เล่นได้ทุกสภาพอากาศ'],
        ['ยกเลิกหรือเลื่อนได้ไหม', 'แจ้งล่วงหน้าอย่างน้อย 24 ชั่วโมงทางโทรศัพท์หรือ LINE เพื่อเลื่อนได้ฟรี'],
        ['แต้มสะสมใช้อย่างไร', 'แต้มเข้าบัญชีตามเบอร์โทรที่ใช้จอง เมื่อโค้ชยืนยันการจอง เช็กแต้มได้ที่ส่วน "แต้มสะสม" และแลกรางวัลที่เคาน์เตอร์'],
      ],
    },
    contact: { title: 'ติดตามและติดต่อ', map: 'แผนที่ / รีวิว Google', ig: 'Instagram', fb: 'Facebook', call: 'โทรจองคอร์ต' },
    footer: { rights: 'สงวนลิขสิทธิ์', admin: 'สำหรับโค้ช', slogan: 'On Court, we grow together.' },
    weekdays: ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'],
    months: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
  },
  en: {
    skip: 'Skip to main content',
    nav: { coach: 'Coach', film: 'On court', programs: 'Programs', court: 'Courts', fame: 'Results', points: 'Points', book: 'Book now' },
    loader: 'Switching on the court lights',
    hero: {
      eyebrow: 'On Court Tennis Club · Uttaradit',
      title: 'Every great shot<br>starts with your<br>first step on court',
      sub: 'The first and only indoor tennis court in Uttaradit. Train with ITF-certified Coach Mark and book your court in one place.',
      ctaBook: 'Book a court', ctaLesson: 'Book a lesson', scroll: 'Scroll to start the match',
    },
    coach: {
      eyebrow: 'Chapter 1 — The Coach',
      title: 'Coach Mark<br>ITF Certified',
      body: 'Worradit Pathamarot, known as Coach Mark, is both a coach and a player, certified through the Lawn Tennis Association of Thailand and the International Tennis Federation (ITF). Every session starts by watching how you play, then fixes one thing at a time so you hit cleaner, move faster and enjoy it more.',
      points: ['ITF Level 1 Coach', 'Certified LTAT/ITF Play & Stay Coach', '80-hour course, National Tennis Development Center, Nonthaburi'],
      photo: 'Coach Mark · Worradit Pathamarot', cert: 'View ITF certificate',
    },
    method: {
      eyebrow: 'Chapter 2 — The Method',
      title: 'Four beats to a confident game',
      steps: [
        { k: '01', t: 'Footwork', d: 'Feet first, racket second. Split step, movement and recovery so you reach every ball.' },
        { k: '02', t: 'Technique', d: 'Forehand, backhand, serve, volley: clean, efficient swings that protect your body.' },
        { k: '03', t: 'Tactics', d: 'Where to hit, when, and why. Learn to read your opponent.' },
        { k: '04', t: 'Match Play', d: 'Put it together in real points and stay calm when the score is tight.' },
      ],
    },
    film: { eyebrow: 'Chapter 3 — Inside On Court', title: 'Real footage from our court', sound: 'Clips are muted' },
    programs: {
      eyebrow: 'Chapter 4 — Programs',
      title: 'Pick the program that fits you',
      unit: { hr: 'THB / hr', person: 'THB / person', month: 'THB / month' },
      hours: 'hr', seats: 'players', book: 'Book this program',
    },
    court: {
      eyebrow: 'Chapter 5 — The Court',
      title: 'Indoor courts.<br>Play in any weather.',
      body: 'Hard courts inside a fully lit hall: no rain delays, no midday sun. Book by the hour and pick any free court and time instantly.',
      day: 'Daytime', night: 'Evening', perHour: 'THB / hr', hours: 'Open daily', book: 'See free times',
    },
    fame: {
      eyebrow: 'Chapter 6 — Wall of Fame',
      title: 'Our players’ results',
      lead: 'Representing Uttaradit province, training at On Court Tennis Club',
      quote: 'Play · Train · Grow — On Court, we build champions',
    },
    shop: {
      eyebrow: 'Pro Shop',
      title: 'Gear up and<br>restring at the club',
      body: 'Rackets, balls, bags and accessories, plus an in-house stringing machine.',
      rules: [['Respect the rules', 'เคารพกติกา'], ['Respect your opponent', 'เคารพคู่แข่ง'], ['Take care of the court', 'ดูแลสนาม'], ['Enjoy the game', 'สนุกกับเกม']],
      rulesTitle: 'Club code',
    },
    member: {
      eyebrow: 'Chapter 7 — Membership',
      title: 'Become part of the club',
      join: 'Join', popular: 'Best value',
    },
    points: {
      eyebrow: 'On Court Points',
      title: 'Play, earn,<br>get rewarded',
      how: [
        ['1 point per 10 THB', 'Credited when the coach confirms your court or lesson booking'],
        ['50 points to join', 'Added as soon as the coach approves your membership'],
        ['Level up, earn faster', 'Challenger +10% · Pro +20% · Champion +30%'],
      ],
      rewardsTitle: 'Rewards', pts: 'pts',
      checkTitle: 'Check your points', phone: 'Phone used for booking', check: 'Check',
      balance: 'Points balance', lifetime: 'Lifetime earned', tier: 'Level', next: '{n} more points to {t}', maxTier: 'Top level reached',
      canRedeem: 'Available', need: '{n} to go', history: 'Points history', empty: 'No points for this number yet. Book a court or join the club to start earning.',
      redeemNote: 'Redeem at the counter and the coach will deduct your points', reasons: { booking: 'Booking confirmed', signup: 'Welcome bonus', redeem: 'Reward redeemed', adjust: 'Adjustment', reverse: 'Booking cancelled' },
    },
    book: {
      eyebrow: 'Match Point',
      title: 'Book today. See you on court.',
      tabCourt: 'Book a court', tabLesson: 'Book a lesson', tabMember: 'Join the club',
      date: 'Pick a day', time: 'Pick a time', court: 'Pick a court', program: 'Pick a program', duration: 'Duration',
      hr: 'hr', level: 'Your level', name: 'Full name', phone: 'Phone', line: 'LINE ID (optional)', email: 'Email', note: 'Note to the coach',
      plan: 'Membership plan', total: 'Total', earn: 'Points you earn',
      sum: { date: 'Date', time: 'Time', court: 'Court', program: 'Program', plan: 'Plan', name: 'Name' },
      submit: 'Confirm booking', submitMember: 'Join now',
      taken: 'Taken', free: 'Free', coachBusy: 'Coach busy', past: 'Passed',
      pickSlot: 'Pick a free time first', required: 'Please fill this in', phoneBad: 'Phone must be 9–10 digits',
      conflict: 'Sorry, that time was just booked. Please pick another.',
      successTitle: 'Booking request received', successMember: 'Welcome to the club',
      successBody: 'Status: awaiting coach confirmation. Mark will contact you by phone or LINE.',
      earnNote: '+{n} points once the coach confirms',
      ref: 'Booking code', memberNo: 'Member no.', payTitle: 'Pay with PromptPay', payAtClub: 'You can pay at the club on the day',
      again: 'Book another', close: 'Close', saving: 'Saving…',
      demoNote: 'Demo mode: data is stored in this browser only',
      priceNote: 'Prices and points rules are samples. Confirm with the coach before paying.',
    },
    gallery: { title: 'Club life' },
    faq: {
      title: 'FAQ',
      items: [
        ['I have never played. Can I join?', 'Yes. Your first session starts with grip and stance. Choose "Brand new" as your level when booking.'],
        ['Do I need my own racket?', 'Not for your first session. Add a note when booking, or pick one up at the club Pro Shop.'],
        ['Can I play when it rains?', 'Yes. Our courts are indoors, so you can play in any weather.'],
        ['Can I cancel or reschedule?', 'Let us know at least 24 hours ahead by phone or LINE to reschedule for free.'],
        ['How do points work?', 'Points go to the phone number you book with, once the coach confirms. Check them in the Points section and redeem at the counter.'],
      ],
    },
    contact: { title: 'Follow & contact', map: 'Map / Google reviews', ig: 'Instagram', fb: 'Facebook', call: 'Call to book' },
    footer: { rights: 'All rights reserved', admin: 'Coach login', slogan: 'On Court, we grow together.' },
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
};
