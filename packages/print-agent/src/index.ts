import readline from 'readline';
import { loadConfig, saveConfig, configExists, PrintAgentConfig } from './config';
import { EscPosPrinter } from './printer';
import { PrintAgentSocket } from './socket';
import { detectAllPrinters, DetectedPrinter } from './detector';
import { ReceiptRenderer } from './renderer';

const VERSION = '1.0.0';

function clearLine() {
  process.stdout.write('\r\x1b[K');
}

function printBanner() {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║      ZappAI Print Agent v' + VERSION + '       ║');
  console.log('║   Agente de Impressão Térmica ZappAI  ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');
}

function printStatus(config: PrintAgentConfig, printerStatus: string) {
  console.log('─'.repeat(40));
  console.log(`Servidor:   ${config.serverUrl}`);
  console.log(`Impressora: ${config.printerType.toUpperCase()} | ${
    config.printerType === 'network'
      ? `${config.networkHost}:${config.networkPort}`
      : config.printerType === 'serial'
      ? config.serialPort
      : 'USB'
  }`);
  console.log(`Status:     ${printerStatus}`);
  console.log(`Printer ID: ${config.printerId || '(não configurado)'}`);
  console.log('─'.repeat(40));
  console.log('');
}

async function setupWizard(): Promise<PrintAgentConfig | null> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const question = (q: string): Promise<string> =>
    new Promise((resolve) => rl.question(q, resolve));

  try {
    console.log('=== CONFIGURAÇÃO INICIAL ===\n');

    const serverUrl = await question('URL do servidor ZappAI [http://localhost:3001/api]: ');
    const printerId = await question('ID da impressora (obtido no painel ZappAI): ');

    if (!printerId.trim()) {
      console.log('\nERRO: ID da impressora é obrigatório.');
      console.log('Crie uma impressora no painel em: Configurações > Impressoras');
      rl.close();
      return null;
    }

    console.log('\nDetectando impressoras...');
    const printers = await detectAllPrinters((scanned, total) => {
      clearLine();
      process.stdout.write(`Verificando ${scanned}/${total}...`);
    });
    clearLine();

    let printerType: 'network' | 'serial' | 'usb' = 'network';
    let networkHost = '192.168.1.100';
    let networkPort = 9100;
    let serialPort = '/dev/ttyUSB0';

    if (printers.length > 0) {
      console.log(`\nImpressoras encontradas:`);
      printers.forEach((p, i) => console.log(`  [${i + 1}] ${p.name}`));
      console.log(`  [0] Configurar manualmente`);

      const choice = await question('\nEscolha [0]: ');
      const idx = parseInt(choice) - 1;

      if (idx >= 0 && idx < printers.length) {
        const selected = printers[idx];
        printerType = selected.type;
        if (selected.type === 'network') {
          networkHost = selected.host!;
          networkPort = selected.port!;
        } else if (selected.type === 'serial') {
          serialPort = selected.path!;
        }
      } else {
        // Manual setup
        const typeChoice = await question('\nTipo de conexão [network/serial/usb] (network): ');
        printerType = (['network', 'serial', 'usb'].includes(typeChoice) ? typeChoice : 'network') as any;

        if (printerType === 'network') {
          networkHost = (await question('IP da impressora [192.168.1.100]: ')) || '192.168.1.100';
          const portStr = await question('Porta [9100]: ');
          networkPort = parseInt(portStr) || 9100;
        } else if (printerType === 'serial') {
          serialPort = (await question('Porta serial [/dev/ttyUSB0]: ')) || '/dev/ttyUSB0';
        }
      }
    } else {
      console.log('\nNenhuma impressora detectada automaticamente.');
      const typeChoice = await question('Tipo de conexão [network/serial/usb] (network): ');
      printerType = (['network', 'serial', 'usb'].includes(typeChoice) ? typeChoice : 'network') as any;

      if (printerType === 'network') {
        networkHost = (await question('IP da impressora [192.168.1.100]: ')) || '192.168.1.100';
        const portStr = await question('Porta [9100]: ');
        networkPort = parseInt(portStr) || 9100;
      } else if (printerType === 'serial') {
        serialPort = (await question('Porta serial [/dev/ttyUSB0]: ')) || '/dev/ttyUSB0';
      }
    }

    const widthStr = await question('Largura do papel [48 chars para 80mm, 32 para 58mm] (48): ');
    const paperWidth = parseInt(widthStr) || 48;

    const copiesStr = await question('Número de cópias [1]: ');
    const copies = parseInt(copiesStr) || 1;

    const config: PrintAgentConfig = {
      serverUrl: serverUrl.trim() || 'http://localhost:3001/api',
      printerId: printerId.trim(),
      printerType,
      networkHost,
      networkPort,
      serialPort,
      paperWidth,
      copies,
    };

    saveConfig(config);
    console.log('\nConfiguração salva com sucesso!\n');
    rl.close();
    return config;
  } catch (e) {
    rl.close();
    throw e;
  }
}

async function runTestPrint(config: PrintAgentConfig): Promise<void> {
  console.log('[Test] Enviando página de teste...');
  const printer = new EscPosPrinter(config);
  const renderer = new ReceiptRenderer(config.paperWidth || 48);
  const lines = renderer.renderTest();
  try {
    await printer.printLines(lines);
    console.log('[Test] Impressão de teste enviada com sucesso!');
  } catch (e: any) {
    console.error('[Test] ERRO:', e.message);
  }
}

async function main() {
  printBanner();

  const args = process.argv.slice(2);
  const cmd = args[0];

  // Handle CLI commands
  if (cmd === 'setup') {
    await setupWizard();
    process.exit(0);
  }

  if (cmd === 'test') {
    const config = loadConfig();
    if (!config.printerId) {
      console.error('Execute primeiro: zappai-print-agent setup');
      process.exit(1);
    }
    await runTestPrint(config);
    process.exit(0);
  }

  if (cmd === 'detect') {
    console.log('Detectando impressoras na rede...\n');
    const printers = await detectAllPrinters((scanned, total) => {
      clearLine();
      process.stdout.write(`Verificando ${scanned}/${total}...`);
    });
    clearLine();
    if (printers.length === 0) {
      console.log('Nenhuma impressora encontrada.');
    } else {
      console.log(`${printers.length} impressora(s) encontrada(s):\n`);
      printers.forEach((p) => console.log(`  - ${p.name}`));
    }
    process.exit(0);
  }

  if (cmd === 'help' || cmd === '--help') {
    console.log('Comandos disponíveis:');
    console.log('  setup    - Configurar o agente');
    console.log('  test     - Imprimir página de teste');
    console.log('  detect   - Detectar impressoras');
    console.log('  (vazio)  - Iniciar o agente');
    process.exit(0);
  }

  // Run agent
  let config = loadConfig();

  if (!configExists()) {
    console.log('Primeira execução detectada. Iniciando configuração...\n');
    const newConfig = await setupWizard();
    if (!newConfig) {
      process.exit(1);
    }
    config = newConfig;
  }

  const printer = new EscPosPrinter(config);
  const socketAgent = new PrintAgentSocket(config, printer);

  // Test connection first
  console.log('[Init] Testando conexão com impressora...');
  const connected = await printer.testConnection();
  printStatus(config, connected ? 'ONLINE' : 'OFFLINE');

  if (!connected) {
    console.warn('[Init] Aviso: Impressora não detectada. Continuando mesmo assim...');
    console.warn('[Init] O agente tentará reconectar quando receber jobs de impressão.\n');
  }

  // Start socket connection
  socketAgent.start();
  console.log('[Agent] Agente iniciado. Aguardando jobs de impressão...');
  console.log('[Agent] Pressione Ctrl+C para parar.\n');

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[Agent] Parando agente...');
    socketAgent.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    socketAgent.stop();
    process.exit(0);
  });

  // Keep process alive
  setInterval(() => {}, 60000);
}

main().catch((e) => {
  console.error('[Fatal]', e.message);
  process.exit(1);
});
