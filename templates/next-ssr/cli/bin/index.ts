#!/usr/bin/env node

import { Command } from "commander";
import { registerGenerateCommand } from "../src/commands/generate.js";
import { registerAuditCommand } from "../src/commands/audit.js";

const program = new Command();

program
  .name("ssr-cli")
  .description("Enterprise-grade CLI generator for SSR fullstack template")
  .version("1.0.0");

registerGenerateCommand(program);
registerAuditCommand(program);

program.parse();
