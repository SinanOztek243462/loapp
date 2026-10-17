import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldCheck,
  Download,
  Upload,
  Power,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  FolderArchive,
} from 'lucide-react';

export interface LifeOSFullBackupData {
  version: string;
  exportedAt: string;
  tasks: any[];
  recurringRoutines: any[];
  skippedRoutineKeys: string[];
  habits: any[];
  finance: any[];
  goals: any[];
  categories: any[];
  dayNotes: Record<string, any>;
  rewards: any[];
  redemptions: any[];
  monthlyIncome: number;
  lootPool: any[];
  droppedItems: any[];
  pityStreak: number;
}

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  getBackupPayload: () => LifeOSFullBackupData;
  onRestoreBackupPayload: (data: Partial<LifeOSFullBackupData>) => void;
}

interface SystemStatusInfo {
  startupEnabled: boolean;
  startupPath: string;
  backupPath: string;
  lastDiskBackupAt: string | null;
}

export async function querySystemStatus(): Promise<SystemStatusInfo | null> {
  try {
    const w = window as any;
    if (w.require) {
      const { ipcRenderer } = w.require('electron');
      return await ipcRenderer.invoke('lifeos-get-system-status');
    }
  } catch {}
  try {
    const res = await fetch('/api/lifeos/status');
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function toggleWindowsStartup(enable: boolean): Promise<boolean | null> {
  try {
    const w = window as any;
    if (w.require) {
      const { ipcRenderer } = w.require('electron');
      const res = await ipcRenderer.invoke('lifeos-toggle-startup', enable);
      return Boolean(res?.startupEnabled);
    }
  } catch {}
  try {
    const res = await fetch('/api/lifeos/startup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enable }),
    });
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.startupEnabled);
    }
  } catch {}
  return null;
}

export async function saveBackupToDisk(payload: LifeOSFullBackupData): Promise<{
  ok: boolean;
  lastDiskBackupAt?: string;
  backupPath?: string;
  error?: string;
}> {
  const jsonStr = JSON.stringify(payload, null, 2);
  try {
    const w = window as any;
    if (w.require) {
      const { ipcRenderer } = w.require('electron');
      return await ipcRenderer.invoke('lifeos-save-disk-backup', jsonStr);
    }
  } catch {}
  try {
    const res = await fetch('/api/lifeos/disk-backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonStr,
    });
    if (res.ok) return await res.json();
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
  return { ok: false, error: 'Yerel disk servisine ulaşılamadı.' };
}

export async function loadBackupFromDisk(): Promise<{
  ok: boolean;
  data?: Partial<LifeOSFullBackupData>;
  error?: string;
}> {
  try {
    const w = window as any;
    if (w.require) {
      const { ipcRenderer } = w.require('electron');
      const res = await ipcRenderer.invoke('lifeos-load-disk-backup');
      if (res?.ok && res.content) {
        return { ok: true, data: JSON.parse(res.content) };
      }
      return { ok: false, error: res?.error || 'Disk yedeği okunamadı.' };
    }
  } catch {}
  try {
    const res = await fetch('/api/lifeos/disk-backup');
    if (res.ok) {
      const body = await res.json();
      if (body.ok && body.content) {
        return { ok: true, data: JSON.parse(body.content) };
      }
      return { ok: false, error: body.error || 'Disk yedeği bulunamadı.' };
    }
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
  return { ok: false, error: 'Disk yedeği okunamadı.' };
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  isOpen,
  onClose,
  getBackupPayload,
  onRestoreBackupPayload,
}) => {
  const [status, setStatus] = useState<SystemStatusInfo | null>(null);
  const [loadingStartup, setLoadingStartup] = useState(false);
  const [savingDisk, setSavingDisk] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFeedback(null);
    querySystemStatus().then((st) => {
      if (st) setStatus(st);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleStartup = async () => {
    setLoadingStartup(true);
    setFeedback(null);
    const nextState = !(status?.startupEnabled ?? false);
    const result = await toggleWindowsStartup(nextState);
    const updated = await querySystemStatus();
    if (updated) setStatus(updated);
    setLoadingStartup(false);

    if (result !== null) {
      setFeedback({
        type: 'success',
        message: result
          ? 'Windows açılışında otomatik başlatma AKTİF edildi! Bilgisayar açıldığında LifeOS otomatik başlayacak.'
          : 'Windows açılışında otomatik başlatma devre dışı bırakıldı.',
      });
    } else {
      setFeedback({
        type: 'error',
        message: 'Başlangıç ayarı değiştirilemedi.',
      });
    }
  };

  const handleDownloadJsonBackup = () => {
    try {
      const payload = getBackupPayload();
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const datePart = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LifeOS-Yedek-${datePart}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setFeedback({
        type: 'success',
        message: `LifeOS-Yedek-${datePart}.json başarıyla indirildi!`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Yedek indirilirken hata oluştu: ${err?.message || 'Bilinmeyen hata'}`,
      });
    }
  };

  const handleUploadJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = String(event.target?.result || '');
        const parsed = JSON.parse(text) as Partial<LifeOSFullBackupData>;
        if (!parsed || (!Array.isArray(parsed.tasks) && !Array.isArray(parsed.recurringRoutines))) {
          setFeedback({
            type: 'error',
            message: 'Seçilen dosya geçerli bir LifeOS yedek dosyası (.json) değil.',
          });
          return;
        }
        onRestoreBackupPayload(parsed);
        setFeedback({
          type: 'success',
          message: `"${file.name}" yedeği başarıyla geri yüklendi! Tüm görevler, puanlar, rutinler ve itemler güncellendi.`,
        });
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: `Yedek dosyası okunamadı: ${err?.message || 'Geçersiz JSON'}`,
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleSaveToLocalDisk = async () => {
    setSavingDisk(true);
    setFeedback(null);
    const payload = getBackupPayload();
    const res = await saveBackupToDisk(payload);
    const updated = await querySystemStatus();
    if (updated) setStatus(updated);
    setSavingDisk(false);

    if (res.ok) {
      setFeedback({
        type: 'success',
        message: `Tüm veriler diske kaydedildi: ${res.backupPath || 'd:\\organizator\\backups\\LifeOS-AutoBackup.json'}`,
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Diske kayıt yapılamadı.',
      });
    }
  };

  const handleRestoreFromLocalDisk = async () => {
    setFeedback(null);
    const res = await loadBackupFromDisk();
    if (res.ok && res.data) {
      onRestoreBackupPayload(res.data);
      setFeedback({
        type: 'success',
        message: 'Diskteki otomatik yedek (LifeOS-AutoBackup.json) başarıyla geri yüklendi!',
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Diskte kayıtlı yedek bulunamadı.',
      });
    }
  };

  const payloadPreview = getBackupPayload();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Sistem Başlangıcı & Veri Yedekleme Merkezi</span>
              </h2>
              <p className="text-xs text-slate-400">
                Windows açılışında otomatik çalışma ve tek tıkla veri koruma kalkanı
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {feedback && (
            <div
              className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs ${
                feedback.type === 'success'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* 1. Windows Startup Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                    status?.startupEnabled
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Power className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      1. Bilgisayar Açıldığında Otomatik Başlat (Windows Startup)
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        status?.startupEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {status?.startupEnabled ? 'AKTİF' : 'PASİF'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Bilgisayarını açtığında siyah komut penceresi çıkarmadan doğrudan sağ alt
                    sistem tepsisinde (System Tray) ve masaüstünde otomatik başlar.
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleStartup}
                disabled={loadingStartup}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 ${
                  status?.startupEnabled
                    ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                }`}
              >
                <Power className="h-3.5 w-3.5" />
                <span>
                  {loadingStartup
                    ? 'İşleniyor...'
                    : status?.startupEnabled
                    ? 'Oto-Başlatmayı Kapat'
                    : 'Oto-Başlatmayı Aktif Et'}
                </span>
              </button>
            </div>

            {status?.startupPath && (
              <div className="rounded-lg bg-slate-900/90 border border-slate-800/80 px-3 py-2 text-[11px] font-mono text-slate-400 truncate">
                Başlangıç Kısayolu: {status.startupPath}
              </div>
            )}
          </div>

          {/* 2. Automatic Local Disk Mirror Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      2. Otomatik Disk Yedeği (D:\organizator\backups)
                    </h3>
                    <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                      CANLI KORUMA
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Yaptığın her değişiklik tarayıcı önbelleği silinse bile otomatik olarak{' '}
                    <code className="text-indigo-300">d:\organizator\backups\LifeOS-AutoBackup.json</code>{' '}
                    dosyasına yazılır.
                  </p>
                  {status?.lastDiskBackupAt && (
                    <p className="text-[11px] text-emerald-400 mt-1 font-medium">
                      Son Disk Kaydı:{' '}
                      {new Date(status.lastDiskBackupAt).toLocaleString('tr-TR')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={handleSaveToLocalDisk}
                disabled={savingDisk}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-bold text-white transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${savingDisk ? 'animate-spin' : ''}`} />
                <span>Şimdi Diske Yedekle</span>
              </button>

              <button
                onClick={handleRestoreFromLocalDisk}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition"
              >
                <FolderArchive className="h-3.5 w-3.5 text-amber-400" />
                <span>Diskteki Yedekten Geri Yükle</span>
              </button>
            </div>
          </div>

          {/* 3. Portable JSON File Export / Import Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
                <Download className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white">
                  3. Taşınabilir Yedek Dosyası (.JSON İndir / Yükle)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Format öncesi veya başka bilgisayara taşırken tüm geçmişini tek bir{' '}
                  <code>.json</code> dosyası olarak indirip istediğin zaman geri yükleyebilirsin.
                </p>

                {/* Current Data Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  <div className="rounded-lg bg-slate-900/90 border border-slate-800 px-2.5 py-1.5">
                    <span className="text-[10px] text-slate-400 block">Görev Kaydı</span>
                    <span className="text-xs font-bold text-white">
                      {payloadPreview.tasks.length} Görev
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-900/90 border border-slate-800 px-2.5 py-1.5">
                    <span className="text-[10px] text-slate-400 block">Sabit Mesai/Rutin</span>
                    <span className="text-xs font-bold text-violet-300">
                      {payloadPreview.recurringRoutines.length} Şablon
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-900/90 border border-slate-800 px-2.5 py-1.5">
                    <span className="text-[10px] text-slate-400 block">Envanter İtem</span>
                    <span className="text-xs font-bold text-amber-300">
                      {payloadPreview.droppedItems.length} İtem
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-900/90 border border-slate-800 px-2.5 py-1.5">
                    <span className="text-[10px] text-slate-400 block">Ajanda Notu</span>
                    <span className="text-xs font-bold text-emerald-300">
                      {Object.keys(payloadPreview.dayNotes || {}).length} Gün
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 mt-4">
                  <button
                    onClick={handleDownloadJsonBackup}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>JSON Yedek İndir</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleUploadJsonFile}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition"
                  >
                    <Upload className="h-3.5 w-3.5 text-indigo-400" />
                    <span>JSON Yedek Dosyası Yükle</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/90 px-6 py-3">
          <span className="text-[11px] text-slate-400">
            İpucu: Sağ alttaki LifeOS tepsi ikonuna sağ tıklayarak da Oto-Başlatmayı açıp kapatabilirsin.
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-1.5 text-xs font-bold text-white transition"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
