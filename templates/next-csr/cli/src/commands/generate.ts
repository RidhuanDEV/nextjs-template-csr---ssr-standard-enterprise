import type { Command } from 'commander';
import inquirer from 'inquirer';
import { generateModule } from '../generators/module.ts';
import { generateComponent, type ComponentGenerationRequest } from '../generators/component.ts';
import { generateCrud } from '../generators/crud.ts';
import { normalizeEntityName } from '../utils/template.ts';

type FrontendType = 'module' | 'component' | 'crud';

const FRONTEND_TYPES: FrontendType[] = ['module', 'component', 'crud'];

interface GenerateOptions {
  dir?: string;
}

function resolveComponentRequest(
  name: string,
  options: Pick<GenerateOptions, 'dir'>
): ComponentGenerationRequest {
  return {
    componentName: name,
    moduleName: normalizeEntityName(options.dir ?? name),
  };
}

function isFrontendType(value: string): value is FrontendType {
  return FRONTEND_TYPES.some((candidate) => candidate === value);
}

export function registerGenerateCommand(program: Command) {
  const generateCommand = program
    .command('generate')
    .alias('g')
    .description('Generate strict, enterprise-ready modules and CRUD scaffolds');

  // Frontend generators (all CSR code is frontend)
  generateCommand
    .command('frontend <type> [name]')
    .alias('gf')
    .description(
      'Generate frontend code (module, component, crud) with strict enterprise scaffolding'
    )
    .option('-d, --dir <module>', 'Target module for component generation')
    .action(async (type: string, providedName: string | undefined, options: GenerateOptions) => {
      if (!isFrontendType(type)) {
        console.error(`Invalid type "${type}". Valid: ${FRONTEND_TYPES.join(', ')}`);
        process.exit(1);
      }

      const name = await resolveName(providedName, type);

      switch (type) {
        case 'module':
          await generateModule(name);
          break;
        case 'component':
          await generateComponent(resolveComponentRequest(name, options));
          break;
        case 'crud':
          await generateCrud(name);
          break;
      }
    });

  // Shorthand: generate crud
  generateCommand
    .command('crud [name]')
    .alias('gc')
    .description('Generate full CRUD pages + module scaffold')
    .action(async (providedName: string | undefined) => {
      const name = await resolveName(providedName, 'crud');
      await generateCrud(name);
    });

  // Shorthand: generate module
  generateCommand
    .command('module [name]')
    .alias('gm')
    .description('Generate a module (shorthand for "generate frontend module")')
    .action(async (providedName: string | undefined) => {
      const name = await resolveName(providedName, 'module');
      await generateModule(name);
    });

  // Shorthand: generate component
  generateCommand
    .command('component [name]')
    .description('Generate a client component inside a module')
    .option(
      '-d, --dir <module>',
      'Module directory. If omitted, the component name is also used as the module name.'
    )
    .action(async (providedName: string | undefined, options: GenerateOptions) => {
      const name = await resolveName(providedName, 'component');
      await generateComponent(resolveComponentRequest(name, options));
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

  return normalizeEntityName(name);
}
