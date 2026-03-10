import type { Command } from 'commander';
import inquirer from 'inquirer';
import { generateFrontendModule } from '../generators/frontend/module.js';
import { generateFrontendComponent } from '../generators/frontend/component.js';
import { generateFrontendCrud } from '../generators/frontend/crud.js';
import { generateBackendModule } from '../generators/backend/module.js';
import { generateBackendCrud } from '../generators/backend/crud.js';
import { generateFullstackCrud } from '../generators/fullstack/crud.js';

type FrontendType = 'module' | 'component' | 'crud';
type BackendType = 'module' | 'crud';

export function registerGenerateCommand(program: Command) {
  // Frontend generators
  program
    .command('generate frontend <type> [name]')
    .alias('gf')
    .description('Generate frontend code (module, component, crud)')
    .option('-d, --dir <directory>', 'Subdirectory for components')
    .action(async (type: string, providedName: string | undefined, options: { dir?: string }) => {
      const validTypes: FrontendType[] = ['module', 'component', 'crud'];

      if (!validTypes.includes(type as FrontendType)) {
        console.error(`Invalid type "${type}". Valid: ${validTypes.join(', ')}`);
        process.exit(1);
      }

      const name = await resolveName(providedName, type);

      switch (type as FrontendType) {
        case 'module':
          await generateFrontendModule(name);
          break;
        case 'component':
          await generateFrontendComponent(name, options.dir);
          break;
        case 'crud':
          await generateFrontendCrud(name);
          break;
      }
    });

  // Backend generators
  program
    .command('generate backend <type> [name]')
    .alias('gb')
    .description('Generate backend code (module, crud)')
    .action(async (type: string, providedName: string | undefined) => {
      const validTypes: BackendType[] = ['module', 'crud'];

      if (!validTypes.includes(type as BackendType)) {
        console.error(`Invalid type "${type}". Valid: ${validTypes.join(', ')}`);
        process.exit(1);
      }

      const name = await resolveName(providedName, type);

      switch (type as BackendType) {
        case 'module':
          await generateBackendModule(name);
          break;
        case 'crud':
          await generateBackendCrud(name);
          break;
      }
    });

  // Fullstack CRUD (backend + frontend)
  program
    .command('generate crud [name]')
    .alias('gc')
    .description('Generate fullstack CRUD (backend module + API routes + frontend pages)')
    .action(async (providedName: string | undefined) => {
      const name = await resolveName(providedName, 'crud');
      await generateFullstackCrud(name);
    });

  // Shorthand: generate module = frontend module
  program
    .command('generate module [name]')
    .alias('gm')
    .description('Generate frontend module (shorthand for "generate frontend module")')
    .action(async (providedName: string | undefined) => {
      const name = await resolveName(providedName, 'module');
      await generateFrontendModule(name);
    });

  // Shorthand: generate component = frontend component
  program
    .command('generate component [name]')
    .description('Generate frontend component (shorthand for "generate frontend component")')
    .option('-d, --dir <directory>', 'Subdirectory for components')
    .action(async (providedName: string | undefined, options: { dir?: string }) => {
      const name = await resolveName(providedName, 'component');
      await generateFrontendComponent(name, options.dir);
    });
}

async function resolveName(providedName: string | undefined, type: string): Promise<string> {
  let name = providedName ?? '';

  if (!name) {
    const answers = await inquirer.prompt<{ name: string }>([
      {
        type: 'input',
        name: 'name',
        message: `Enter ${type} name:`,
        validate: (input: string) => input.trim().length > 0 || 'Name is required',
      },
    ]);
    name = answers.name;
  }

  return name.toLowerCase().replace(/\s+/g, '-');
}
