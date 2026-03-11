#!/usr/bin/env node

import { Command } from 'commander';
import { registerGenerateCommand } from '../src/commands/generate.ts';
import { registerAuditCommand } from '../src/commands/audit.ts';

const program = new Command();

program
  .name('csr-cli')
  .description('Enterprise-grade CLI generator for CSR template')
  .version('1.0.0');

registerGenerateCommand(program);
registerAuditCommand(program);

program.parse();
