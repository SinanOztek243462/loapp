// Web Audio API synthesizer for clean alert chimes without external mp3 dependencies
export function playNotificationSound(
  type: 'approval' | 'complete' | 'tick' | 'burn' = 'approval'
) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();

    if (type === 'approval') {
      // Pleasant three-tone ascending chime (C5, E5, G5)
      const frequencies = [523.25, 659.25, 783.99];
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(
          0.2,
          ctx.currentTime + idx * 0.12 + 0.04
        );
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + idx * 0.12 + 0.5
        );

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.55);
      });
    } else if (type === 'complete') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'burn') {
      // Descending dramatic minor/sawtooth tone for Forge Burn failure
      const frequencies = [311.13, 277.18, 207.65]; // D#4 -> C#4 -> G#3
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);

        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(
          0.12,
          ctx.currentTime + idx * 0.14 + 0.03
        );
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + idx * 0.14 + 0.45
        );

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.14);
        osc.stop(ctx.currentTime + idx * 0.14 + 0.5);
      });
    }
  } catch {
    // Ignore if audio is blocked
  }
}

export function triggerDesktopNotification(task: {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  categoryName: string;
}) {
  playNotificationSound('approval');

  try {
    const w = window as unknown as {
      require?: (mod: string) => {
        ipcRenderer: { send: (channel: string, data: unknown) => void };
      };
    };
    if (w.require) {
      const { ipcRenderer } = w.require('electron');
      ipcRenderer.send('notify-task-approval', task);
      return;
    }
  } catch {
    // Fallback to browser Notification API
  }

  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(`⏰ Onay Bekliyor: ${task.title}`, {
        body: `${task.startTime} - ${task.endTime} (${task.categoryName}) tamamlandı mı?`,
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }
}
