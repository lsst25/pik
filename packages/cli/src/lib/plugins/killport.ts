import { execSync } from 'child_process';
import type { Command } from 'commander';
import { confirm, select } from '@inquirer/prompts';
import pc from 'picocolors';
import type { PikPlugin } from '@lsst/pik-core';

interface ProcessInfo {
  pid: number;
  command: string;
}

interface PortInfo {
  port: number;
  pid: number;
  command: string;
}

function getListeningPorts(): PortInfo[] {
  try {
    const output = execSync('lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null', { encoding: 'utf-8' });
    const lines = output.trim().split('\n').slice(1); // Skip header

    const ports: PortInfo[] = [];
    const seen = new Set<number>();

    for (const line of lines) {
      const parts = line.split(/\s+/);
      const command = parts[0];
      const pid = parseInt(parts[1], 10);
      const nameCol = parts[8] || '';
      const portMatch = nameCol.match(/:(\d+)$/);

      if (portMatch) {
        const port = parseInt(portMatch[1], 10);
        if (!seen.has(port)) {
          seen.add(port);
          ports.push({ port, pid, command });
        }
      }
    }

    return ports.sort((a, b) => a.port - b.port);
  } catch {
    return [];
  }
}

function getProcessesOnPort(port: number): ProcessInfo[] {
  try {
    const output = execSync(`lsof -ti:${port}`, { encoding: 'utf-8' });
    const pids = output
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((pid) => parseInt(pid, 10));

    return pids.map((pid) => {
      let command = 'unknown';
      try {
        command = execSync(`ps -p ${pid} -o comm=`, { encoding: 'utf-8' }).trim();
      } catch {
        // Process may have already exited
      }
      return { pid, command };
    });
  } catch {
    return [];
  }
}

function killProcess(pid: number): boolean {
  try {
    process.kill(pid, 'SIGKILL');
    return true;
  } catch {
    return false;
  }
}

async function killPortInteractive(port: number, skipConfirm: boolean): Promise<void> {
  const processes = getProcessesOnPort(port);

  if (processes.length === 0) {
    console.log(pc.yellow(`No process found on port ${port}`));
    return;
  }

  console.log(pc.bold(`Processes on port ${port}:`));
  for (const proc of processes) {
    console.log(`  ${pc.cyan(proc.pid.toString())} - ${proc.command}`);
  }

  if (!skipConfirm) {
    const shouldKill = await confirm({
      message: `Kill ${processes.length} process${processes.length > 1 ? 'es' : ''}?`,
      default: true,
    });

    if (!shouldKill) {
      console.log(pc.dim('Cancelled'));
      return;
    }
  }

  for (const proc of processes) {
    if (killProcess(proc.pid)) {
      console.log(pc.green(`✓ Killed ${proc.pid} (${proc.command})`));
    } else {
      console.log(pc.red(`✗ Failed to kill ${proc.pid}`));
    }
  }
}

export const killportPlugin: PikPlugin = {
  name: 'Killport',
  description: 'Kill processes on specific ports',
  command: 'killport',
  aliases: ['kp'],

  register(program: Command) {
    program
      .command('killport')
      .alias('kp')
      .description('Kill process running on a specific port')
      .argument('[port]', 'Port number (interactive if not provided)')
      .option('-y, --yes', 'Skip confirmation')
      .action(async (portArg: string | undefined, options: { yes?: boolean }) => {
        if (portArg) {
          const port = parseInt(portArg, 10);

          if (isNaN(port) || port < 1 || port > 65535) {
            console.error(pc.red(`Invalid port: ${portArg}`));
            process.exit(1);
          }

          await killPortInteractive(port, options.yes ?? false);
        } else {
          // Interactive mode - show list of listening ports
          const ports = getListeningPorts();

          if (ports.length === 0) {
            console.log(pc.yellow('No listening ports found'));
            return;
          }

          try {
            const selected = await select({
              message: 'Select port to kill',
              choices: ports.map((p) => ({
                name: `${pc.cyan(`:${p.port}`)} - ${p.command} ${pc.dim(`(pid ${p.pid})`)}`,
                value: p.port,
              })),
            });

            await killPortInteractive(selected, options.yes ?? false);
          } catch (error) {
            if (error instanceof Error && error.name === 'ExitPromptError') {
              return;
            }
            throw error;
          }
        }
      });
  },
};
