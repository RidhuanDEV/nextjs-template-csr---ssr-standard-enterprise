#!/usr/bin/env node

import { Command } from "commander";
import { registerCreateCommand } from "../src/commands/create.js";

const program = new Command();

program
  .name("create-next-template")
  .description(
    "Scaffold a new Next.js project from CSR or SSR enterprise templates",
  )
  .version("2.0.0");

registerCreateCommand(program);

program.parse();
