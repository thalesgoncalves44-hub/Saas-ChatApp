import fs from 'fs';
import path from 'path';
import os from 'os';

export interface PrintAgentConfig {
  serverUrl: string;
  printerId: string;
  printerType: 'usb' | 'network' | 'serial';
  // USB settings
  usbVendorId?: number;
  usbProductId?: number;
  // Network settings
  networkHost?: string;
  networkPort?: number;
  // Serial settings
  serialPort?: string;
  serialBaudRate?: number;
  // Print settings
  paperWidth: number; // characters per line (48 for 80mm, 32 for 58mm)
  copies: number;
}

const CONFIG_DIR = path.join(os.homedir(), '.zappai');
const CONFIG_FILE = path.join(CONFIG_DIR, 'print-agent.json');

const DEFAULT_CONFIG: PrintAgentConfig = {
  serverUrl: 'http://localhost:3001',
  printerId: '',
  printerType: 'network',
  networkHost: '192.168.1.100',
  networkPort: 9100,
  paperWidth: 48,
  copies: 1,
};

export function loadConfig(): PrintAgentConfig {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return { ...DEFAULT_CONFIG };
    }
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: Partial<PrintAgentConfig>): void {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    const current = loadConfig();
    const merged = { ...current, ...config };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Config] Failed to save config:', e);
  }
}

export function configExists(): boolean {
  return fs.existsSync(CONFIG_FILE) && !!loadConfig().printerId;
}
