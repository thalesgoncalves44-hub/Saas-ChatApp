import net from 'net';
import { PrintAgentConfig } from './config';

export type PrinterStatus = 'online' | 'offline' | 'error';

export class EscPosPrinter {
  private status: PrinterStatus = 'offline';

  constructor(private readonly config: PrintAgentConfig) {}

  getStatus(): PrinterStatus {
    return this.status;
  }

  // ESC/POS byte commands
  private static ESC = 0x1b;
  private static GS = 0x1d;

  private buildEscposBuffer(lines: string[]): Buffer {
    const chunks: Buffer[] = [];

    // Initialize printer
    chunks.push(Buffer.from([EscPosPrinter.ESC, 0x40])); // ESC @

    // Set code page for pt-BR (CP850)
    chunks.push(Buffer.from([EscPosPrinter.ESC, 0x74, 0x02]));

    for (const line of lines) {
      chunks.push(Buffer.from(line + '\n', 'latin1'));
    }

    // Feed and cut
    chunks.push(Buffer.from([EscPosPrinter.GS, 0x56, 0x41, 0x05])); // GS V A 5 - partial cut

    return Buffer.concat(chunks);
  }

  async printLines(lines: string[]): Promise<void> {
    const buf = this.buildEscposBuffer(lines);

    switch (this.config.printerType) {
      case 'network':
        await this.printNetwork(buf);
        break;
      case 'serial':
        await this.printSerial(buf);
        break;
      case 'usb':
        await this.printUsb(buf);
        break;
      default:
        throw new Error(`Unknown printer type: ${this.config.printerType}`);
    }
  }

  private printNetwork(data: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const host = this.config.networkHost || '192.168.1.100';
      const port = this.config.networkPort || 9100;
      const socket = new net.Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error(`Network printer timeout (${host}:${port})`));
      }, 10000);

      socket.connect(port, host, () => {
        socket.write(data, (err) => {
          clearTimeout(timeout);
          socket.end();
          if (err) {
            reject(err);
          } else {
            this.status = 'online';
            resolve();
          }
        });
      });

      socket.on('error', (err) => {
        clearTimeout(timeout);
        this.status = 'error';
        reject(err);
      });
    });
  }

  private async printSerial(data: Buffer): Promise<void> {
    try {
      // Dynamic import to avoid errors when serialport is not installed
      const { SerialPort } = await import('serialport');
      const portPath = this.config.serialPort || '/dev/ttyUSB0';
      const baudRate = this.config.serialBaudRate || 9600;

      return new Promise((resolve, reject) => {
        const port = new SerialPort({ path: portPath, baudRate }, (err) => {
          if (err) {
            this.status = 'error';
            reject(err);
            return;
          }
          port.write(data, (writeErr) => {
            port.close();
            if (writeErr) {
              this.status = 'error';
              reject(writeErr);
            } else {
              this.status = 'online';
              resolve();
            }
          });
        });
      });
    } catch (e) {
      throw new Error('serialport module not available. Install with: npm install serialport');
    }
  }

  private async printUsb(data: Buffer): Promise<void> {
    // Fallback: write to USB as file on Linux (/dev/usb/lp0)
    const fs = await import('fs');
    const usbDevice = '/dev/usb/lp0';
    return new Promise((resolve, reject) => {
      fs.writeFile(usbDevice, data, (err) => {
        if (err) {
          this.status = 'error';
          reject(new Error(`USB print failed: ${err.message}. Try network or serial mode.`));
        } else {
          this.status = 'online';
          resolve();
        }
      });
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      if (this.config.printerType === 'network') {
        const host = this.config.networkHost || '192.168.1.100';
        const port = this.config.networkPort || 9100;
        await new Promise<void>((resolve, reject) => {
          const socket = new net.Socket();
          const timeout = setTimeout(() => { socket.destroy(); reject(new Error('timeout')); }, 3000);
          socket.connect(port, host, () => { clearTimeout(timeout); socket.end(); resolve(); });
          socket.on('error', (e) => { clearTimeout(timeout); reject(e); });
        });
        this.status = 'online';
        return true;
      }
      return true;
    } catch {
      this.status = 'offline';
      return false;
    }
  }
}
