import path from 'node:path';
import fs from 'fs-extra';
import type { Command } from 'commander';
import inquirer from 'inquirer';

type TemplateType = 'next-csr' | 'next-ssr';

export function registerCreateCommand(program: Command) {
  program
    .command('create <name>')
    .description('Create a new project from CSR or SSR template')
    .option('-t, --template <type>', 'Template type: csr or ssr')
    .action(async (name: string, options: { template?: string }) => {
      const targetDir = path.resolve(process.cwd(), name);

      if (await fs.pathExists(targetDir)) {
        const { overwrite } = await inquirer.prompt<{ overwrite: boolean }>([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `Directory "${name}" already exists. Continue?`,
            default: false,
          },
        ]);
        if (!overwrite) {
          console.log('Aborted.');
          return;
        }
      }

      let templateType: TemplateType;

      if (options.template === 'csr') {
        templateType = 'next-csr';
      } else if (options.template === 'ssr') {
        templateType = 'next-ssr';
      } else {
        const { template } = await inquirer.prompt<{ template: TemplateType }>([
          {
            type: 'list',
            name: 'template',
            message: 'Select template:',
            choices: [
              { name: 'CSR - Client-Side Rendering (frontend only)', value: 'next-csr' },
              { name: 'SSR - Server-Side Rendering (fullstack with Prisma, Redis, Auth)', value: 'next-ssr' },
            ],
          },
        ]);
        templateType = template;
      }

      const templatesRoot = path.resolve(
        path.dirname(new URL(import.meta.url).pathname),
        '..', '..', '..', 'templates'
      );
      const templateDir = path.join(templatesRoot, templateType);

      if (!(await fs.pathExists(templateDir))) {
        console.error(`Template not found at: ${templateDir}`);
        process.exit(1);
      }

      console.log(`\nCreating project "${name}" from ${templateType} template...\n`);

      await fs.copy(templateDir, targetDir, {
        filter: (src: string) => {
          const basename = path.basename(src);
          return !['node_modules', '.next', '.git'].includes(basename);
        },
      });

      // Update package.json name
      const pkgPath = path.join(targetDir, 'package.json');
      const pkg = await fs.readJSON(pkgPath) as Record<string, string>;
      pkg.name = name;
      await fs.writeJSON(pkgPath, pkg, { spaces: 2 });

      console.log(`Project "${name}" created successfully.\n`);
      console.log('Next steps:');
      console.log(`  cd ${name}`);
      console.log('  cp .env.example .env.local');
      console.log('  npm install');

      if (templateType === 'next-ssr') {
        console.log('  npm run docker:up');
        console.log('  npm run db:generate');
        console.log('  npm run db:push');
        console.log('  npm run db:seed');
      }

      console.log('  npm run dev');
      console.log('');
      console.log('Generate code:');
      console.log('  npx tsx cli/bin/index.ts generate module <name>');
      console.log('  npx tsx cli/bin/index.ts generate component <name>');
      console.log('  npx tsx cli/bin/index.ts generate crud <name>');

      if (templateType === 'next-ssr') {
        console.log('  npx tsx cli/bin/index.ts generate backend module <name>');
        console.log('  npx tsx cli/bin/index.ts generate backend crud <name>');
      }
    });
}
