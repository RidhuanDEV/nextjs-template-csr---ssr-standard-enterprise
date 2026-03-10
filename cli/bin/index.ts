#!/usr/bin/env node

import { Command } from 'commander';
import { registerCreateCommand } from '../src/commands/create.js';

const program = new Command();

program
  .name('frontend-cli')
  .description('Create new projects from CSR or SSR templates')
  .version('1.0.0');

registerCreateCommand(program);

program.parse();
