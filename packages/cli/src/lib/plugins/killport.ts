import { execSync } from 'child_process';
import type { Command } from 'commander';
import { confirm } from '@inquirer/prompts';
import pc from 'picocolors';
import type { PikPlugin } from '@lsst/pik-core';

interface ProcessInfo {
  pid: number;
  command: string;
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
      .argument('<port>', 'Port number')
      .option('-y, --yes', 'Skip confirmation')
      .action(async (portArg: string, options: { yes?: boolean }) => {
        const port = parseInt(portArg, 10);

        if (isNaN(port) || port < 1 || port > 65535) {
          console.error(pc.red(`Invalid port: ${portArg}`));
          process.exit(1);
        }

        const processes = getProcessesOnPort(port);

        if (processes.length === 0) {
          console.log(pc.yellow(`No process found on port ${port}`));
          return;
        }

        console.log(pc.bold(`Processes on port ${port}:`));
        for (const proc of processes) {
          console.log(`  ${pc.cyan(proc.pid.toString())} - ${proc.command}`);
        }

        if (!options.yes) {
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
      });
  },
};
