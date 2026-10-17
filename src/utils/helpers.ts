import { Category, ScheduleTask, DayAgendaNote, Habit, FinanceEntry, LifeGoal, RewardItem, RecurringRoutine } from '../types';

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateDurationMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60; // Cross-midnight support
  return diff;
}

export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutesToAdd;
  const nh = Math.floor((total % (24 * 60)) / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export function formatMinutesHuman(minutes: number): string {
  if (minutes <= 0) return '0 dk';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} sa ${m} dk`;
  if (h > 0) return `${h} saat`;
  return `${m} dk`;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-work', name: 'Derin Çalışma & İş', color: '#6366f1', icon: 'Briefcase', weeklyTargetHours: 30, pointMultiplier: 1.5 },
  { id: 'cat-study', name: 'Eğitim & Gelişim', color: '#06b6d4', icon: 'BookOpen', weeklyTargetHours: 14, pointMultiplier: 1.4 },
  { id: 'cat-health', name: 'Spor & Sağlık', color: '#10b981', icon: 'HeartPulse', weeklyTargetHours: 7, pointMultiplier: 1.3 },
  { id: 'cat-errands', name: 'Randevu & Dış İşler', color: '#f59e0b', icon: 'MapPin', weeklyTargetHours: 5, pointMultiplier: 1.1 },
  { id: 'cat-routine', name: 'Yaşam & Rutin', color: '#a855f7', icon: 'Coffee', weeklyTargetHours: 10, pointMultiplier: 1.0 },
  { id: 'cat-leisure', name: 'Dinlenme & Sosyal', color: '#ec4899', icon: 'Gamepad2', weeklyTargetHours: 10, pointMultiplier: 0.8 },
];

export const DEFAULT_REWARDS: RewardItem[] = [
  {
    id: 'rew-1',
    title: '2 Saat Suçluluk Duymadan Oyun / Film Keyfi',
    description: 'Tüm görevler onaylandıktan sonra tam odak serbest zaman ödülü.',
    cost: 350,
    icon: 'Gamepad2',
    category: 'Eğlence',
  },
  {
    id: 'rew-2',
    title: 'Favori Kahve & Tatlı Molası',
    description: 'Dışarıda veya siparişle özel kahve/tatlı ödülü.',
    cost: 500,
    icon: 'Coffee',
    category: 'Keyif',
  },
  {
    id: 'rew-3',
    title: 'Cheat Meal / Favori Restoran Siparişi',
    description: 'Haftalık disiplin zincirini koruduğunda özel yemek ödülü.',
    cost: 900,
    icon: 'Utensils',
    category: 'Gastronomi',
  },
  {
    id: 'rew-4',
    title: 'Yeni Kitap / Kurs / Oyun Satın Alma İzni',
    description: 'İstek listesindeki bir içeriği bütçeden satın alma hakkı.',
    cost: 1800,
    icon: 'BookOpen',
    category: 'Gelişim & Hobi',
  },
  {
    id: 'rew-5',
    title: 'Tam Gün Serbest Hafta Sonu Kaçamağı',
    description: 'Alarm kurmadan, tamamen dinlenme ve gezme odaklı gün.',
    cost: 3000,
    icon: 'Sparkles',
    category: 'Yaşam',
  },
  {
    id: 'rew-6',
    title: 'Büyük Ekipman / Teknoloji Hedefi Ödülü',
    description: 'Uzun süreli disiplin birikimiyle kendine büyük hediye.',
    cost: 7500,
    icon: 'Trophy',
    category: 'Büyük Ödül',
  },
];

export function getInitialTasks(todayStr: string): ScheduleTask[] {
  const tomorrow = new Date(todayStr + 'T12:00:00');
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateISO(tomorrow);

  const inThreeDays = new Date(todayStr + 'T12:00:00');
  inThreeDays.setDate(inThreeDays.getDate() + 3);
  const threeDaysStr = formatDateISO(inThreeDays);

  const yesterday = new Date(todayStr + 'T12:00:00');
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateISO(yesterday);

  return [
    {
      id: 'task-1',
      date: todayStr,
      startTime: '08:30',
      endTime: '09:30',
      title: 'Sabah Rutini, Kahvaltı & Gün Planlaması',
      categoryId: 'cat-routine',
      priority: 'medium',
      status: 'approved',
      notes: 'Kahve, vitaminler ve günlük hedeflerin kontrolü',
      approvedDurationMinutes: 60,
    },
    {
      id: 'task-2',
      date: todayStr,
      startTime: '09:30',
      endTime: '12:00',
      title: 'Derin Odak: Proje Geliştirme Bloğu #1',
      categoryId: 'cat-work',
      priority: 'critical',
      status: 'approved',
      notes: 'Telefon sessizde, bildirimler kapalı çalışıldı.',
      approvedDurationMinutes: 150,
    },
    {
      id: 'task-3',
      date: todayStr,
      startTime: '12:30',
      endTime: '14:00',
      title: 'Antrenman & Duş',
      categoryId: 'cat-health',
      priority: 'high',
      status: 'approved',
      notes: 'Üst vücut + 20 dk kardiyo',
      approvedDurationMinutes: 90,
    },
    {
      id: 'task-4',
      date: todayStr,
      startTime: '14:00',
      endTime: '15:15',
      title: 'Yeni Sistem Mimarisinin İncelenmesi & Dokümantasyon',
      categoryId: 'cat-study',
      priority: 'high',
      status: 'awaiting_approval',
      notes: 'Süresi doldu — onayınızı bekliyor!',
      notified: false,
    },
    {
      id: 'task-5',
      date: todayStr,
      startTime: '16:00',
      endTime: '18:00',
      title: 'Odak Bloğu #2: Kodlama ve Testler',
      categoryId: 'cat-work',
      priority: 'high',
      status: 'planned',
      notes: 'Modüllerin entegrasyonu yapılacak',
    },
    {
      id: 'task-6',
      date: todayStr,
      startTime: '19:30',
      endTime: '21:00',
      title: 'Kitap Okuma & Dil Pratiği',
      categoryId: 'cat-study',
      priority: 'medium',
      status: 'planned',
      notes: 'En az 30 sayfa okuma hedefi',
    },
    // Yesterday's approved tasks so weekly pie chart & XP look rich immediately
    {
      id: 'task-y1',
      date: yesterdayStr,
      startTime: '09:00',
      endTime: '12:30',
      title: 'Haftalık Rapor & Sistem Geliştirme',
      categoryId: 'cat-work',
      priority: 'high',
      status: 'approved',
      notes: 'Tamamlandı',
      approvedDurationMinutes: 210,
    },
    {
      id: 'task-y2',
      date: yesterdayStr,
      startTime: '14:00',
      endTime: '16:00',
      title: 'Teknik Makale & Kurs Takibi',
      categoryId: 'cat-study',
      priority: 'medium',
      status: 'approved',
      notes: 'Bölüm 4 bitirildi',
      approvedDurationMinutes: 120,
    },
    // Future appointments visible in Monthly Calendar preview without entering the day!
    {
      id: 'task-f1',
      date: tomorrowStr,
      startTime: '10:30',
      endTime: '11:45',
      title: 'Hastane Randevusu (Göz Polikliniği)',
      categoryId: 'cat-errands',
      priority: 'critical',
      status: 'planned',
      notes: '15 dk erken gidilecek, tahlil sonuçlarını yanına al.',
      isAppointment: true,
      location: 'Şehir Hastanesi B Blok',
    },
    {
      id: 'task-f2',
      date: threeDaysStr,
      startTime: '15:00',
      endTime: '16:30',
      title: 'Diş Hekimi Kontrolü & Banka İşleri',
      categoryId: 'cat-errands',
      priority: 'high',
      status: 'planned',
      notes: 'Dönüşte kargo şubesine uğranacak.',
      isAppointment: true,
      location: 'Merkez Klinik',
    },
  ];
}

export function getInitialDayNotes(todayStr: string): Record<string, DayAgendaNote> {
  const tomorrow = new Date(todayStr + 'T12:00:00');
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateISO(tomorrow);

  const inThreeDays = new Date(todayStr + 'T12:00:00');
  inThreeDays.setDate(inThreeDays.getDate() + 3);
  const threeDaysStr = formatDateISO(inThreeDays);

  return {
    [todayStr]: {
      date: todayStr,
      summaryNote: 'Bugün odaklanma günü. Akşam 18:00 sonrası ekran süresini azalt.',
      highlights: ['Proje v1.0 teslimi', 'Aylık fatura kontrolü'],
    },
    [tomorrowStr]: {
      date: tomorrowStr,
      summaryNote: 'Sabah 10:30 Hastane randevusu var! Kimlik ve eski raporları unutma.',
      highlights: ['Hastane Randevusu (10:30)', 'Eczaneye uğra'],
    },
    [threeDaysStr]: {
      date: threeDaysStr,
      summaryNote: 'Öğleden sonra dışarıda randevular var, derin çalışmayı sabaha çek.',
      highlights: ['Diş Hekimi (15:00)', 'Kargo teslimi'],
    },
  };
}

export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'hab-water',
    title: '💧 Günlük Su Tüketimi',
    categoryId: 'cat-health',
    targetDaysPerWeek: 7,
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    dailyTargetValue: 3,
    unit: 'Litre',
    stepValue: 0.5,
    dailyProgress: {},
    completedDates: [],
    active: true,
  },
  {
    id: 'hab-book',
    title: '📖 Günlük Kitap Okuma',
    categoryId: 'cat-study',
    targetDaysPerWeek: 7,
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    dailyTargetValue: 30,
    unit: 'Sayfa',
    stepValue: 10,
    dailyProgress: {},
    completedDates: [],
    active: true,
  },
  {
    id: 'hab-clean-food',
    title: '🥗 Şekersiz / Temiz Beslenme',
    categoryId: 'cat-health',
    targetDaysPerWeek: 6,
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    dailyTargetValue: 1,
    unit: 'Gün',
    stepValue: 1,
    dailyProgress: {},
    completedDates: [],
    active: true,
  },
  {
    id: 'hab-steps',
    title: '🚶 Günlük Yürüyüş / Adım',
    categoryId: 'cat-health',
    targetDaysPerWeek: 5,
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    dailyTargetValue: 10000,
    unit: 'Adım',
    stepValue: 2500,
    dailyProgress: {},
    completedDates: [],
    active: true,
  },
];

export const DEFAULT_GOALS: LifeGoal[] = [
  {
    id: 'goal-1',
    title: 'Kişisel Yazılım / Proje Hedefini Tamamla',
    deadline: '2026-12-31',
    progress: 65,
    categoryId: 'cat-work',
    milestones: [
      { id: 'm1', text: 'Mimari tasarımı bitir', done: true },
      { id: 'm2', text: 'Günlük Excel-tarzı zamanlayıcıyı kur', done: true },
      { id: 'm3', text: '30 gün kesintisiz veri kaydet', done: false },
    ],
  },
  {
    id: 'goal-2',
    title: 'Fiziksel Kondisyon & Sağlık Rutini',
    deadline: '2026-11-30',
    progress: 45,
    categoryId: 'cat-health',
    milestones: [
      { id: 'm4', text: 'Haftada 4 gün antrenman ortalaması yakala', done: true },
      { id: 'm5', text: 'Uyku saatlerini 23:30 - 07:30 arasına sabitle', done: false },
    ],
  },
];

export const DEFAULT_FINANCE: FinanceEntry[] = [
  { id: 'fin-1', date: '2026-10-01', title: 'Aylık Gelir / Maaş', amount: 65000, type: 'income', category: 'Gelir' },
  { id: 'fin-2', date: '2026-10-05', title: 'Sabit Faturalar & Kira', amount: 18500, type: 'expense', category: 'Barınma' },
  { id: 'fin-3', date: '2026-10-12', title: 'Mutfak & Market Alışverişi', amount: 4200, type: 'expense', category: 'Gıda' },
  { id: 'fin-4', date: '2026-10-15', title: 'Yazılım & Bulut Abonelikleri', amount: 950, type: 'expense', category: 'Gelişim' },
];

export const WEEKDAY_OPTIONS: { day: number; short: string; label: string }[] = [
  { day: 1, short: 'Pzt', label: 'Pazartesi' },
  { day: 2, short: 'Sal', label: 'Salı' },
  { day: 3, short: 'Çar', label: 'Çarşamba' },
  { day: 4, short: 'Per', label: 'Perşembe' },
  { day: 5, short: 'Cum', label: 'Cuma' },
  { day: 6, short: 'Cmt', label: 'Cumartesi' },
  { day: 0, short: 'Paz', label: 'Pazar' },
];

export const DEFAULT_RECURRING_ROUTINES: RecurringRoutine[] = [
  {
    id: 'rout-shift',
    title: 'Mesai / Ana İş Saatleri',
    startTime: '09:00',
    endTime: '18:00',
    categoryId: 'cat-work',
    priority: 'critical',
    daysOfWeek: [1, 2, 3, 4, 5], // Pazartesi - Cuma otomatik!
    notes: 'Sabit iş mesaisi (1 kez tanımlandı, her hafta içi otomatik eklenir)',
    active: true,
  },
  {
    id: 'rout-morning',
    title: 'Sabah Rutini, Kahvaltı & Hazırlık',
    startTime: '07:45',
    endTime: '08:45',
    categoryId: 'cat-routine',
    priority: 'medium',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Her gün otomatik!
    notes: 'Kahvaltı, su ve güne hazırlık',
    active: true,
  },
  {
    id: 'rout-sport',
    title: 'Akşam Antrenmanı & Yürüyüş',
    startTime: '19:00',
    endTime: '20:15',
    categoryId: 'cat-health',
    priority: 'high',
    daysOfWeek: [1, 3, 5], // Pzt, Çar, Cum otomatik!
    notes: 'Düzenli spor bloğu',
    active: true,
  },
];

