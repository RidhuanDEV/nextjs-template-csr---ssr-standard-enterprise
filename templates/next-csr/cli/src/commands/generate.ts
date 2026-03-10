import type { Command } from 'commander';
import { generateModule } from '../generators/module.js';
import { generateComponent } from '../generators/component.js';
import { generateCrud } from '../generators/crud.js';

type GeneratorType = 'module' | 'component' | 'crud';

export function registerGenerateCommand(program: Command) {
  program
    .command('generate <type> [name]')
    .alias('g')
    .description('Generate a module, component, or CRUD scaffold')
    .option('-d, --dir <directory>', 'Subdirectory for components (e.g., "ui")')
    .action(async (type: string, providedName: string | undefined, options: { dir?: string }) => {
      const validTypes: GeneratorType[] = ['module', 'component', 'crud'];

      if (!validTypes.includes(type as GeneratorType)) {
        console.error(`Invalid type "${type}". Valid types: ${validTypes.join(', ')}`);
        process.exit(1);
      }

      let name = providedName ?? '';

      if (!name) {
        const answers = await inquirer.prompt<{ name: string }>([
          {
            type: 'input',
            name: 'name',
            message: `Enter ${type} name:`,
            validate: (input: string) =>
              input.trim().length > 0 || 'Name is required',
          },
        ]);
        name = answers.name;
      }

      const normalizedName = name.toLowerCase().replace(/\s+/g, '-');

      switch (type as GeneratorType) {
        case 'module':
          await generateModule(normalizedName);
          break;
        case 'component':
          await generateComponent(normalizedName, options.dir);
          break;
        case 'crud':
          await generateCrud(normalizedName);
          break;
      }
    });
}
