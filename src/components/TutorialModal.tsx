import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  Repeat,
  Droplets,
  CheckCircle2,
  Calendar,
  Gift,
  Flame,
  ShieldCheck,
  Plus,
  MapPin,
  Play,
  ArrowRight,
  Trash2,
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShiftsModal: () => void;
  onOpenQuotasModal: () => void;
  onOpenSystemModal: () => void;
  onNavigateView: (view: 'daily' | 'monthly' | 'rewards' | 'lifeos') => void;
  onResetAllData: () => void;
}

type GuideSectionId =
  | 'schedule'
  | 'quotas'
  | 'approval'
  | 'calendar'
  | 'loot_forge'
  | 'system';

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  onOpenShiftsModal,
  onOpenQuotasModal,
  onOpenSystemModal,
  onNavigateView,
  onResetAllData,
}) => {
  const [activeSection, setActiveSection] = useState<GuideSectionId>('schedule');

  if (!isOpen) return null;

  const sections: {
    id: GuideSectionId;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'schedule',
      title: '1. Saatli Görev & Sabit Mesai',
      subtitle: 'Excel tablosu ve tekrarlı işler',
      icon: <Repeat className="h-4 w-4 text-indigo-400" />,
    },
    {
      id: 'quotas',
      title: '2. Günlük Su & Kota Hedefleri',
      subtitle: 'Her güne otomatik atanan hedefler',
      icon: <Droplets className="h-4 w-4 text-cyan-400" />,
    },
    {
      id: 'approval',
      title: '3. Süre Sonu Onay & Pasta Grafiği',
      subtitle: 'Puan kazanma ve süre doğrulama',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    },
    {
      id: 'calendar',
      title: '4. Aylık Takvim & Ajanda',
      subtitle: 'Randevular ve disiplin karnesi',
      icon: <Calendar className="h-4 w-4 text-amber-400" />,
    },
    {
      id: 'loot_forge',
      title: '5. KP Mağazası, Drop & Demirci',
      subtitle: 'Gelire endeksli item ve füzyon',
      icon: <Flame className="h-4 w-4 text-rose-400" />,
    },
    {
      id: 'system',
      title: '6. Oto-Başlatma & Yedekleme',
      subtitle: 'Sistem tepsisi ve veri sıfırlama',
      icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-indigo-500/40 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                LifeOS Kullanım Rehberi — Hangi Buton Ne İşe Yarar?
              </h2>
              <p className="text-xs text-slate-400">
                Uygulamadaki tüm butonların görevleri ve adım adım çalışma mantığı
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 p-2 text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Split Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Sidebar Menu */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/60 p-3 space-y-1.5 overflow-y-auto">
            {sections.map((sec) => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full text-left rounded-xl p-3 transition flex items-start gap-3 border ${
                    isActive
                      ? 'border-indigo-500/50 bg-indigo-600/15 text-white shadow'
                      : 'border-transparent hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{sec.icon}</div>
                  <div>
                    <div className="text-xs font-extrabold">{sec.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {sec.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Content Area */}
          <div className="md:col-span-8 p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
            {activeSection === 'schedule' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    1. Saatli Görev, Mesai ve Sabit Rutin Nasıl Eklenir?
                  </h3>
                  <p className="text-slate-400 mt-1">
                    Sol taraftaki Excel tablosu gün içindeki saatli işlerinizi yönetir. Tek seferlik işleri ve her gün tekrar eden mesainizi şu butonlarla ayırırsınız:
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white">
                        <Plus className="h-3.5 w-3.5" /> Ekle / Sabitle
                      </span>
                      <span className="font-bold text-white">
                        Excel Hızlı Ekleme Çubuğu (Tablonun Üstü)
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      Başlangıç ve bitiş saatini (`09:00 - 18:00`), görev adını ve kategoriyi seçtiğiniz yerdir. Yanındaki açılır kutudan:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                      <li>
                        <strong>Tek Seferlik (Sadece Bugün):</strong> Sadece seçili tarihe ekler.
                      </li>
                      <li>
                        <strong>🔄 Hafta İçi Her Gün (Pzt-Cum) / Her Gün:</strong> Bunu seçip{' '}
                        <strong className="text-indigo-300">Sabitle</strong> butonuna basarsanız, mesainizi bir daha her gün girmenize gerek kalmaz; seçilen günlerde tabloya otomatik düşer.
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/50 bg-indigo-500/15 px-2.5 py-1 text-[11px] font-bold text-indigo-300">
                        <Repeat className="h-3.5 w-3.5" /> Sabit Mesai & Rutinler
                      </span>
                      <span className="font-bold text-white">
                        Mesai Şablonları ve İzin Modu Butonu
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      Kaydettiğiniz sabit mesai veya rutinlerin saatini değiştirmek, hangi günlerde (`Pzt, Sal, Çar...`) çıkacağını seçmek veya yıllık izne çıktığınızda{' '}
                      <strong className="text-amber-300">İzinli / Duraklatıldı</strong> moduna almak için kullanılır.
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenShiftsModal();
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 px-3 py-1.5 text-[11px] font-bold text-indigo-300 transition"
                    >
                      <span>Şimdi Mesai Şablonlarını Aç</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500 bg-amber-500/20 px-2 py-1 text-[11px] font-bold text-amber-300">
                        <MapPin className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-slate-500">/</span>
                      <span className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-bold text-indigo-400">
                        <Play className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-bold text-white">
                        Randevu İşareti & Odak Sayacı (Pomodoro)
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      <strong>Konum İkonu:</strong> Görevi "Randevu" olarak işaretler (Aylık takvim kutusunda sarı rozetle öne çıkar).{' '}
                      <strong>Oynat (Play) İkonu:</strong> Görev süresini sağ üstteki canlı geri sayım sayacına yükler ve başlatır.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'quotas' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    2. Günlük Su Tüketimi & Kota Hedefleri Nasıl Çalışır?
                  </h3>
                  <p className="text-slate-400 mt-1">
                    <strong>"3 Litre Su İç"</strong>, <strong>"30 Sayfa Kitap Oku"</strong> veya <strong>"Vitamin Al"</strong> gibi hedeflerin belirli bir saati yoktur ve her güne tek tek ajanda notu olarak yazılmaz.
                  </p>
                </div>

                <div className="rounded-xl border border-cyan-500/30 bg-slate-950/80 p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-1 text-[11px] font-bold text-cyan-300">
                      <Plus className="h-3.5 w-3.5" /> Sabit Günlük Hedef Ekle / Yönet
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Excel tablosunun hemen üstündeki bu butona basarak hedefi <strong>1 kez</strong> tanımlarsınız:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                    <li>
                      <strong>Hedef Miktar & Birim:</strong> Örn: <code>3</code> <code>Litre</code> veya <code>30</code> <code>Sayfa</code>
                    </li>
                    <li>
                      <strong>Artış Adımı (+ Butonu):</strong> Örn: <code>0.5</code> (Her tıklamada +0.5 Litre artırır)
                    </li>
                    <li>
                      <strong>Atanacağı Günler:</strong> Seçtiğiniz günlerde her günün ekranına otomatik atanır.
                    </li>
                  </ul>

                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 font-mono text-[11px] font-bold text-cyan-200">
                      +0.5
                    </span>
                    <span className="text-slate-400">
                      butonuyla gün içinde ilerlemenizi artırır, hedef dolduğunda veya
                    </span>
                    <span className="rounded-md bg-emerald-500/25 border border-emerald-500/50 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                      ✓ Bitir
                    </span>
                    <span className="text-slate-400">
                      dediğinizde <strong>+25 KP</strong> kazanırsınız.
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenQuotasModal();
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 px-3 py-1.5 text-[11px] font-bold text-cyan-300 transition"
                  >
                    <span>Şimdi Günlük Su / Kota Hedefi Tanımla</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'approval' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    3. Süre Sonu Onay Sistemi & Pasta Grafiği Mantığı
                  </h3>
                  <p className="text-slate-400 mt-1">
                    LifeOS'ta sabah tabloya yazdığınız hiçbir görev siz gerçekten yapıp onaylamadan pasta grafiğine veya puanınıza işlenmez.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
                    <div className="font-bold text-white">
                      Görev Bitiş Saati Geldiğinde Ne Olur?
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      Saatiniz görevin bitiş saatine ulaştığında (uygulama arka planda tepside çalışsa bile) sesli bildirim ve <strong>Görev Onay Penceresi</strong> açılır:
                    </p>
                    <ul className="space-y-1.5 text-slate-300">
                      <li>
                        <strong className="text-emerald-400">✓ Tamamlandı Onayla:</strong> Görev süresini sağdaki <strong>Pasta Grafiğine</strong> ekler, <strong>KP Puanınızı</strong> verir ve olasılıksal <strong>İtem Drop</strong> zarını atar.
                      </li>
                      <li>
                        <strong className="text-indigo-400">+15 Dk / +30 Dk Uzat:</strong> İşiniz bitmediyse bitiş saatini ileri öteler.
                      </li>
                      <li>
                        <strong className="text-amber-400">Ertele (-%15 KP):</strong> Görevi ertelersiniz, küçük bir disiplin cezası kesilir.
                      </li>
                      <li>
                        <strong className="text-rose-400">İptal / Yapılamadı (-%45 KP):</strong> Görevi iptal edersiniz, günlük disiplin karneniz (`S, A, B, C, D, F`) ve puanınız düşer.
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-1.5">
                    <div className="font-bold text-white">
                      Tablo İçindeki Hızlı Durum Butonları (✓ / ✗ / Geri Al)
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      Bitiş saatini beklemeden erken bitirdiğiniz bir görevi tablonun en sağındaki yeşil <strong className="text-emerald-400">✓</strong> butonuyla hemen onaylayabilir, kırmızı <strong className="text-rose-400">✗</strong> ile iptal edebilir veya yanlışlıkla onayladıysanız <strong className="text-slate-300">↺</strong> butonuyla tekrar "Planlandı" durumuna döndürebilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'calendar' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    4. Aylık Takvim, Karne Harfleri ve Tarihe Özel Ajanda
                  </h3>
                  <p className="text-slate-400 mt-1">
                    Üst bardaki <strong>Tarih Butonuna</strong> veya <strong>Aylık Takvim & Ajanda</strong> sekmesine tıkladığınızda aylık görünüme geçersiniz.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-1.5">
                    <div className="font-bold text-white">
                      Tek Tıklama vs. Çift Tıklama Farkı
                    </div>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                      <li>
                        <strong>Güne Tek Tıklama:</strong> Takvimden çıkmadan sağdaki çekmecede o günün <strong>Ajanda Notunu</strong>, <strong>Randevularını</strong> ve <strong>Disiplin Karnesini (`S`–`F`)</strong> önizlersiniz.
                      </li>
                      <li>
                        <strong>Güne Çift Tıklama (veya "Günün İçine Gir" Butonu):</strong> Doğrudan o tarihin saatlik Excel tablosunun içine girersiniz.
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-1.5">
                    <div className="font-bold text-white">
                      Bu Güne Özel Ajanda Notu & Hızlı Randevu Planlama
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      Sağ çekmecedeki <strong>"Bu Güne Özel Ajanda Notu"</strong> kutusu sadece seçili tarihe özgü hatırlatmalar (Örn: <em>"Hastane randevusu, tahlil sonucunu al"</em>, <em>"Kira ödemesi"</em>) içindir. En alttaki formdan o güne girmeden doğrudan saatli randevu da ekleyebilirsiniz.
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateView('monthly');
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1.5 text-[11px] font-bold text-amber-300 transition"
                    >
                      <span>Aylık Takvim & Ajandayı Aç</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'loot_forge' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    5. KP Mağazası, RPG İtem Drop ve Demirci Füzyon Ocağı
                  </h3>
                  <p className="text-slate-400 mt-1">
                    Üst bardaki <strong>Puan & Ödül Mağazası</strong> sekmesinden erişilir. Kendi içinde 4 alt sekmesi vardır:
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <Gift className="h-4 w-4" />
                      <span>Ganimet Sandığı & Aylık Gelir Ayarı</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      <strong>Aylık Gelir / Maaş (TL)</strong> kutusuna kendi gelirinizi girersiniz. Görev onayladığınızda veya <strong>300 KP ile Sandık Açtığınızda</strong> düşen itemlerin bütçe karşılığı bu gelire göre hesaplanır (Örn: <code>%1 Efsanevi = Aylık Gelirin %30'u</code>).
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-rose-300">
                      <Flame className="h-4 w-4" />
                      <span>Demirci & Füzyon Ocağı (Birleştirme ve Yanma)</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      Envanterinizde biriken düşük seviye itemleri (Örn: <code>3x Sıradan &rarr; 1x Yaygın</code> veya <code>10x Sıradan &rarr; 1x Nadir</code> sıçrama kontratı) birleştirip üst seviyeye basabilirsiniz. Füzyon başarısız olursa itemler yanar ancak <strong>Kül Telafi KP'si</strong> ve sonraki denemeler için <strong>+2 Pity Şans Bonusu</strong> verir.
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateView('rewards');
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 px-3 py-1.5 text-[11px] font-bold text-rose-300 transition"
                    >
                      <span>Ödül Mağazası & Demirci Ocağına Git</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'system' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    6. Sistem Tepsisi, Oto-Başlatma, Yedekleme & Veri Sıfırlama
                  </h3>
                  <p className="text-slate-400 mt-1">
                    Sağ üstteki yeşil <strong>🛡️ Yedek & Oto-Başlat</strong> butonu ile tüm sistem ayarlarını yönetebilirsiniz:
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-1.5">
                    <div className="font-bold text-emerald-300">
                      Windows Açılışında Otomatik Başlatma & Sistem Tepsisi
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      Masaüstü uygulamasını (`Baslat-LifeOS.bat`) kapattığınızda tamamen kapanmaz; sağ alt saatin yanındaki <strong>Sistem Tepsisinde (System Tray)</strong> çalışmaya ve görev bitiş saatlerini takip etmeye devam eder.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-1.5">
                    <div className="font-bold text-indigo-300">
                      JSON Yedek İndir / Yükle & Disk Koruması
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      Verileriniz otomatik olarak <code>d:\organizator\backups\LifeOS-AutoBackup.json</code> dosyasına yedeklenir. İstediğiniz zaman taşınabilir <code>.json</code> yedek dosyası da indirebilirsiniz.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={() => {
                          onClose();
                          onOpenSystemModal();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 px-3 py-1.5 text-[11px] font-bold text-emerald-300 transition"
                      >
                        <span>Yedek & Oto-Başlatma Penceresini Aç</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              'Tüm görev, rutin, kota, ajanda ve envanter verilerini sıfırlayıp tertemiz bir başlangıç yapmak istediğinize emin misiniz?'
                            )
                          ) {
                            onResetAllData();
                            onClose();
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 px-3 py-1.5 text-[11px] font-bold text-rose-300 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Tüm Verileri Sıfırla (Temiz Sayfa)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/90 px-6 py-3.5 text-xs text-slate-400">
          <span>
            Bu rehbere istediğiniz zaman sağ üstteki <strong>"❓ Rehber"</strong> butonundan ulaşabilirsiniz.
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-extrabold text-white transition"
          >
            Anladım, Başlayalım
          </button>
        </div>
      </div>
    </div>
  );
};
