import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { PrintAgentConfig } from './config';
import { EscPosPrinter } from './printer';
import { ReceiptRenderer, PrintJob } from './renderer';

export class PrintAgentSocket {
  private socket: Socket | null = null;
  private renderer: ReceiptRenderer;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    private readonly config: PrintAgentConfig,
    private readonly printer: EscPosPrinter,
  ) {
    this.renderer = new ReceiptRenderer(config.paperWidth || 48);
  }

  start(): void {
    this.isRunning = true;
    this.connect();
    this.startHeartbeat();
  }

  stop(): void {
    this.isRunning = false;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private connect(): void {
    if (!this.isRunning) return;

    const wsUrl = this.config.serverUrl.replace(/\/api$/, '');
    console.log(`[Socket] Connecting to ${wsUrl}...`);

    this.socket = io(wsUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 5000,
      reconnectionAttempts: Infinity,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected!');
      // Join printer room
      this.socket?.emit('join-printer', { printerId: this.config.printerId });
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (err) => {
      console.error(`[Socket] Connection error: ${err.message}`);
    });

    // Listen for print jobs
    this.socket.on('printer:job', async (job: PrintJob) => {
      console.log(`[Socket] Received print job: ${job.type}`);
      await this.handlePrintJob(job);
    });
  }

  private async handlePrintJob(job: PrintJob): Promise<void> {
    const jobId = (job.data as any)?.jobId;
    try {
      const lines = this.renderer.render(job);
      const copies = this.config.copies || 1;

      for (let i = 0; i < copies; i++) {
        await this.printer.printLines(lines);
      }

      console.log(`[Print] Job ${job.type} printed successfully (${copies} copies)`);

      // Report success to API
      if (jobId) {
        await this.reportJobStatus(jobId, 'COMPLETED');
      }
    } catch (err: any) {
      console.error(`[Print] Error printing job:`, err.message);
      if (jobId) {
        await this.reportJobStatus(jobId, 'FAILED', err.message);
      }
    }
  }

  private async reportJobStatus(jobId: string, status: 'COMPLETED' | 'FAILED', error?: string): Promise<void> {
    try {
      await axios.post(`${this.config.serverUrl}/printers/agent/job-status`, {
        jobId,
        status,
        error,
      });
    } catch (e) {
      // Non-critical - ignore
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      try {
        const printerStatus = await this.printer.testConnection();
        await axios.post(`${this.config.serverUrl}/printers/agent/heartbeat`, {
          printerId: this.config.printerId,
          status: printerStatus ? 'online' : 'offline',
          paperLevel: 100, // Would need hardware support to read this
          timestamp: new Date().toISOString(),
        });
      } catch {
        // Non-critical
      }
    }, 30000); // Every 30 seconds
  }
}
