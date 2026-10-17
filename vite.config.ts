import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function getStartupVbsPath() {
  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  return path.join(
    appData,
    'Microsoft',
    'Windows',
    'Start Menu',
    'Programs',
    'Startup',
    'LifeOS-AutoStart.vbs'
  );
}

function isWindowsStartupEnabled() {
  try {
    return fs.existsSync(getStartupVbsPath());
  } catch {
    return false;
  }
}

function setWindowsStartupEnabled(enable: boolean) {
  const vbsPath = getStartupVbsPath();
  const projectRoot = path.resolve(process.cwd());
  const electronExe = path.join(projectRoot, 'node_modules', 'electron', 'dist', 'electron.exe');
  try {
    if (enable) {
      const vbsContent = [
        'Set WshShell = CreateObject("WScript.Shell")',
        `WshShell.CurrentDirectory = "${projectRoot}"`,
        `WshShell.Run """${electronExe}"" .", 0, False`,
        '',
      ].join('\r\n');
      fs.mkdirSync(path.dirname(vbsPath), { recursive: true });
      fs.writeFileSync(vbsPath, vbsContent, 'utf-8');
    } else if (fs.existsSync(vbsPath)) {
      fs.unlinkSync(vbsPath);
    }
    return isWindowsStartupEnabled();
  } catch {
    return isWindowsStartupEnabled();
  }
}

function getDiskBackupPath() {
  return path.join(path.resolve(process.cwd()), 'backups', 'LifeOS-AutoBackup.json');
}

function lifeosSystemPlugin() {
  return {
    name: 'lifeos-system-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (!req.url?.startsWith('/api/lifeos/')) return next();

        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        if (req.url === '/api/lifeos/status' && req.method === 'GET') {
          const backupPath = getDiskBackupPath();
          let lastDiskBackupAt: string | null = null;
          try {
            if (fs.existsSync(backupPath)) {
              lastDiskBackupAt = fs.statSync(backupPath).mtime.toISOString();
            }
          } catch {}
          res.end(
            JSON.stringify({
              startupEnabled: isWindowsStartupEnabled(),
              startupPath: getStartupVbsPath(),
              backupPath,
              lastDiskBackupAt,
            })
          );
          return;
        }

        if (req.url === '/api/lifeos/startup' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => (body += chunk));
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const active = setWindowsStartupEnabled(Boolean(parsed.enable));
              res.end(
                JSON.stringify({
                  startupEnabled: active,
                  startupPath: getStartupVbsPath(),
                })
              );
            } catch (e: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: e?.message || 'Invalid JSON' }));
            }
          });
          return;
        }

        if (req.url === '/api/lifeos/disk-backup' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => (body += chunk));
          req.on('end', () => {
            try {
              const backupPath = getDiskBackupPath();
              fs.mkdirSync(path.dirname(backupPath), { recursive: true });
              fs.writeFileSync(backupPath, body, 'utf-8');
              const stat = fs.statSync(backupPath);
              res.end(
                JSON.stringify({
                  ok: true,
                  backupPath,
                  lastDiskBackupAt: stat.mtime.toISOString(),
                })
              );
            } catch (e: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ ok: false, error: e?.message }));
            }
          });
          return;
        }

        if (req.url === '/api/lifeos/disk-backup' && req.method === 'GET') {
          try {
            const backupPath = getDiskBackupPath();
            if (!fs.existsSync(backupPath)) {
              res.end(JSON.stringify({ ok: false, error: 'Henüz disk yedeği bulunamadı.' }));
              return;
            }
            const content = fs.readFileSync(backupPath, 'utf-8');
            res.end(JSON.stringify({ ok: true, content }));
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ ok: false, error: e?.message }));
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), lifeosSystemPlugin()],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  },
});

