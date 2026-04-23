#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = new URL('.', import.meta.url).pathname;
const projectRoot = join(__dirname, '..');

let vexProcess = null;
let restarting = false;

function startVex() {
  if (restarting) return;
  
  console.log('🚀 Starting vex dev...');
  vexProcess = spawn('node', ['packages/cli/dist/index.js', 'dev', '--cwd', 'apps/www'], {
    cwd: projectRoot,
    stdio: 'inherit'
  });
  
  vexProcess.on('exit', (code, signal) => {
    vexProcess = null;
    if (!restarting && signal !== 'SIGTERM' && code !== 0) {
      console.log(`⚠️ vex dev exited with code ${code}, restarting...`);
      setTimeout(startVex, 1000);
    }
  });
}

async function restartVex() {
  if (restarting) return;
  restarting = true;
  
  console.log('🔄 File change detected, restarting...');
  
  if (vexProcess) {
    vexProcess.kill('SIGTERM');
    // Give it time to cleanup
    await new Promise(resolve => {
      const timeout = setTimeout(resolve, 2000);
      vexProcess.on('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }
  
  restarting = false;
  startVex();
}

// Watch for changes
const coreWatcher = watch(join(projectRoot, 'packages/core/dist/.build'), () => restartVex());
const cliWatcher = watch(join(projectRoot, 'packages/cli/dist/.build'), () => restartVex());

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  coreWatcher.close();
  cliWatcher.close();
  if (vexProcess) {
    vexProcess.kill('SIGTERM');
  }
  process.exit(0);
});

startVex();