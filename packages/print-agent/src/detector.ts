import net from 'net';
import os from 'os';

export interface DetectedPrinter {
  type: 'network' | 'serial' | 'usb';
  host?: string;
  port?: number;
  path?: string;
  name: string;
}

// Common thermal printer ports to scan
const PRINTER_PORTS = [9100, 9101, 6101];

// Common serial ports for thermal printers
const SERIAL_PORTS_LINUX = ['/dev/ttyUSB0', '/dev/ttyUSB1', '/dev/ttyS0', '/dev/ttyS1'];
const SERIAL_PORTS_WIN = ['COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6'];
const SERIAL_PORTS_MAC = ['/dev/tty.usbserial', '/dev/tty.usbmodem'];

function getLocalNetworkPrefixes(): string[] {
  const interfaces = os.networkInterfaces();
  const prefixes: string[] = [];

  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        const parts = addr.address.split('.');
        if (parts.length === 4) {
          prefixes.push(`${parts[0]}.${parts[1]}.${parts[2]}`);
        }
      }
    }
  }

  return [...new Set(prefixes)];
}

async function checkPort(host: string, port: number, timeoutMs = 500): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, timeoutMs);

    socket.connect(port, host, () => {
      clearTimeout(timer);
      socket.end();
      resolve(true);
    });

    socket.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

export async function detectNetworkPrinters(
  onProgress?: (scanned: number, total: number) => void,
): Promise<DetectedPrinter[]> {
  const found: DetectedPrinter[] = [];
  const prefixes = getLocalNetworkPrefixes();

  if (prefixes.length === 0) {
    prefixes.push('192.168.1');
  }

  const tasks: Array<() => Promise<void>> = [];
  for (const prefix of prefixes.slice(0, 1)) { // Limit to first network
    for (let i = 1; i <= 254; i++) {
      const host = `${prefix}.${i}`;
      for (const port of PRINTER_PORTS) {
        tasks.push(async () => {
          const open = await checkPort(host, port, 300);
          if (open) {
            found.push({ type: 'network', host, port, name: `Impressora em ${host}:${port}` });
          }
        });
      }
    }
  }

  // Run in batches of 50 parallel checks
  const BATCH = 50;
  let scanned = 0;
  for (let i = 0; i < tasks.length; i += BATCH) {
    const batch = tasks.slice(i, i + BATCH);
    await Promise.all(batch.map((t) => t()));
    scanned += batch.length;
    onProgress?.(scanned, tasks.length);
  }

  return found;
}

export async function detectSerialPrinters(): Promise<DetectedPrinter[]> {
  const fs = await import('fs');
  const found: DetectedPrinter[] = [];

  const platform = os.platform();
  let ports: string[];

  if (platform === 'linux') {
    ports = SERIAL_PORTS_LINUX;
  } else if (platform === 'win32') {
    ports = SERIAL_PORTS_WIN;
  } else if (platform === 'darwin') {
    ports = SERIAL_PORTS_MAC;
  } else {
    ports = SERIAL_PORTS_LINUX;
  }

  for (const portPath of ports) {
    try {
      if (fs.existsSync(portPath)) {
        found.push({ type: 'serial', path: portPath, name: `Serial: ${portPath}` });
      }
    } catch {
      // Skip
    }
  }

  return found;
}

export async function detectUsbPrinters(): Promise<DetectedPrinter[]> {
  const fs = await import('fs');
  const found: DetectedPrinter[] = [];

  // Check Linux USB printer devices
  if (os.platform() === 'linux') {
    for (let i = 0; i < 4; i++) {
      const usbPath = `/dev/usb/lp${i}`;
      try {
        if (fs.existsSync(usbPath)) {
          found.push({ type: 'usb', path: usbPath, name: `USB Impressora lp${i}` });
        }
      } catch {
        // Skip
      }
    }
  }

  return found;
}

export async function detectAllPrinters(
  onProgress?: (scanned: number, total: number) => void,
): Promise<DetectedPrinter[]> {
  const [network, serial, usb] = await Promise.all([
    detectNetworkPrinters(onProgress),
    detectSerialPrinters(),
    detectUsbPrinters(),
  ]);

  return [...network, ...serial, ...usb];
}
