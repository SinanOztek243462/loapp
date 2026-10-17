# LifeOS — Masaüstü Yaşam, Zaman ve Disiplin Organizatörü

**LifeOS**, geleneksel planlayıcıların *"planlanan ama gerçekte yapılmayan görevleri tamamlanmış kabul etme"* ve *"tekrarlayan iş kurallarını her gün manuel girme"* problemlerini çözmek amacıyla **İş Analizi (Business Analysis)** ve **Matematiksel Oyunlaştırma (Gamification Economy)** prensipleriyle modellenmiş masaüstü uygulamasıdır.

---

## 🎯 Çözülen Temel İş Problemleri & Analiz Kurgusu

### 1. Doğrulama Odaklı Durum Makinesi (Task Validation State Machine)
Klasik takvim uygulamalarında sabah planlanan bir görev, gerçekten yapılmasa bile istatistiklere yansır. LifeOS'ta görev yaşam döngüsü 5 durumlu bir **State Machine** olarak kurgulanmıştır:
- `planned` $\rightarrow$ `awaiting_approval` (Bitiş saati geldiğinde masaüstü bildirimi ve sesli uyarı tetiklenir)
- `approved` (Sadece kullanıcı tarafından onaylanan gerçek süreler pasta grafiğine ve puana işlenir)
- `postponed` (Erteleme: Düşük disiplin cezası `-15% KP`)
- `cancelled` (İptal / Yapılamadı: Yüksek disiplin cezası `-45% KP`)

### 2. Varlık Ayrıştırması (Entity Modeling: Tek Seferlik Ajanda vs. Tekrarlayan Şablonlar)
Veri modelinde 3 farklı zamansal varlık birbirinden ayrıştırılmıştır:
1. **Saatli Sabit Mesai & Rutin Şablonları (`RecurringRoutine`):** Mesai saatleri (`09:00 - 18:00`) veya sabit rutinler yalnızca **1 kez** tanımlanır; seçilen haftanın günlerinde (`Pzt–Cum` vb.) günlük Excel tablosuna otomatik atanır. İzin/tatil durumları için duraklatma (`active: false`) ve tek günlük istisna (`skippedRoutineKeys`) koruması bulunur.
2. **Her Güne Otomatik Atanan Sabit Kotalar (`Habit` Quotas):** Günlük su tüketimi (`3 Litre`), kitap okuma (`30 Sayfa`) gibi saat bağımsız hedefler ajanda notu olarak değil, her güne otomatik atanan kademeli kota (`+0.5L`, `+10 Sayfa`) varlıkları olarak modellenmiştir.
3. **Tarihe Özel Ajanda & Randevular (`DayAgendaNote` & `isAppointment`):** Sadece belirli bir tarihe özgü hastane randevusu, fatura veya teslim notları aylık takvim çekmecesinde tutulur.

### 3. Matematiksel Puanlama & Olasılıksal Ödül Ekonomisi (Gamification & Expected Value)
- **Kazanım Puanı (KP) Formülü:**
  $$\text{KP} = \text{Onaylanan Süre (dk)} \times \text{Kategori Katsayısı} \times \text{Öncelik Katsayısı}$$
- **Günlük Disiplin Karnesi:** Tamamlama oranı, odak süresi ve ceza puanlarına göre günlük `0–100` skor ve `S, A, B, C, D, F` harf notu üretilir.
- **Aylık Gelire Endeksli RPG Ganimet (Loot) Dağılımı:**
  Görev onaylandığında veya sandık açıldığında, ödül bütçesi kullanıcının aylık gelirine ($M$) oranla olasılıksal olarak hesaplanır (Beklenen Değer $E[\alpha] = \%2.12 \times M$):
  - **Sıradan (%50):** $\%0.5 \, M$
  - **Yaygın (%30):** $\%1.5 \, M$
  - **Nadir (%13):** $\%4.0 \, M$
  - **Epik (%6):** $\%10.0 \, M$
  - **Efsanevi (%1):** $\%30.0 \, M$
- **Demirci Füzyon & Yanma (Pity) Mekaniği:** Düşük seviye itemler (`3x` veya `10x Sıradan -> 1x Nadir` sıçrama kontratı) birleştirilebilir; başarısız füzyonda itemler yanarak **Kül Telafi Puanı (KP)** ve sonraki denemeler için **Pity Şans Bonusu** üretir.

---

## 🛠️ Teknik Mimari & Çalıştırma

- **Masaüstü & Sistem Tepsisi (System Tray):** Electron (`electron/main.cjs`) + Windows Başlangıç Otomasyonu (`LifeOS-AutoStart.vbs`)
- **Arayüz & Durum Yönetimi:** React + TypeScript + Tailwind CSS + Vite
- **Çift Katmanlı Veri Koruması:** `localStorage` + Otomatik yerel disk yedeği (`backups/LifeOS-AutoBackup.json`) + Tek tıkla taşınabilir `.JSON` dışa/içe aktarma (`SystemSettingsModal.tsx`)

### Kurulum ve Başlatma
```bash
npm install
npm run build
```
Windows masaüstünde doğrudan başlatmak için **`Baslat-LifeOS.bat`** dosyasına çift tıklamanız yeterlidir.