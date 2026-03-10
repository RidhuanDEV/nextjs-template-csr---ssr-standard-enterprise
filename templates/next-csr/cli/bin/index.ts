#!/usr/bin/env node

import { Command } from 'commander';
import { registerGenerateCommand } from '../src/commands/generate.js';

const program = new Command();

program
  .name('generate-cli')
  .description('Project generator for CSR template')
  .version('1.0.0');

registerGenerateCommand(program);

program.parse();
