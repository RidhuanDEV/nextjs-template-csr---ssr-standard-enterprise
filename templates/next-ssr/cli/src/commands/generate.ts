import type { Command } from "commander";
import inquirer from "inquirer";
import { generateFrontendModule } from "../generators/frontend/module.js";
import { generateFrontendComponent } from "../generators/frontend/component.js";
import { generateFrontendCrud } from "../generators/frontend/crud.js";
import { generateBackendModule } from "../generators/backend/module.js";
import { generateBackendCrud } from "../generators/backend/crud.js";
import { generateFullstackCrud } from "../generators/fullstack/crud.js";
import { normalizeEntityName } from "../utils/template.js";

type FrontendType = "module" | "component" | "crud";
type BackendType = "module" | "crud";

interface GenerateOptions {
  dir?: string;
  merge?: boolean;
}

export interface ComponentGenerationRequest {
  componentName: string;
  moduleName: string;
}

function toLayoutOptions(options: GenerateOptions): { merge?: boolean } {
  return options.merge ? { merge: true } : {};
}

export function registerGenerateCommand(program: Command) {
  const generateCommand = program
    .command("generate")
    .alias("g")
    .description("Generate strict, enterprise-ready modules and CRUD scaffolds");

  // Frontend generators
  generateCommand
    .command("frontend <type> [name]")
    .alias("gf")
    .description(
      "Generate frontend code (module, component, crud) with strict enterprise scaffolding",
    )
    .option("-d, --dir <module>", "Target module for component generation")
    .option("--merge", "Generate a shared schema file under src/modules/<name>/schemas")
    .action(async (type: string, providedName: string | undefined, options: GenerateOptions) => {
      const validTypes: FrontendType[] = ["module", "component", "crud"];

      if (!validTypes.includes(type as FrontendType)) {
        console.error(`Invalid type "${type}". Valid: ${validTypes.join(", ")}`);
        process.exit(1);
      }

      const name = await resolveName(providedName, type);

      switch (type as FrontendType) {
        case "module":
          await generateFrontendModule(name, toLayoutOptions(options));
          break;
        case "component":
          await generateFrontendComponent(resolveComponentGenerationRequest(name, options));
          break;
        case "crud":
          await generateFrontendCrud(name, toLayoutOptions(options));
          break;
      }
    });

  // Backend generators
  generateCommand
    .command("backend <type> [name]")
    .alias("gb")
    .description(
      "Generate backend code (module, crud) with strict typing; CRUD bootstraps the backend module if it does not exist yet",
    )
    .option("--merge", "Generate a shared schema file under src/modules/<name>/schemas")
    .action(async (type: string, providedName: string | undefined, options: GenerateOptions) => {
      const validTypes: BackendType[] = ["module", "crud"];

      if (!validTypes.includes(type as BackendType)) {
        console.error(`Invalid type "${type}". Valid: ${validTypes.join(", ")}`);
        process.exit(1);
      }

      const name = await resolveName(providedName, type);

      switch (type as BackendType) {
        case "module":
          await generateBackendModule(name, toLayoutOptions(options));
          break;
        case "crud":
          await generateBackendCrud(name, toLayoutOptions(options));
          break;
      }
    });

  // Fullstack CRUD (backend + frontend)
  generateCommand
    .command("crud [name]")
    .alias("gc")
    .description("Generate fullstack CRUD with split server/client modules by default")
    .option("--merge", "Generate a shared schema file under src/modules/<name>/schemas")
    .action(async (providedName: string | undefined, options: GenerateOptions) => {
      const name = await resolveName(providedName, "crud");
      await generateFullstackCrud(name, toLayoutOptions(options));
    });

  // Shorthand: generate module = frontend module
  generateCommand
    .command("module [name]")
    .alias("gm")
    .description('Generate frontend module (shorthand for "generate frontend module")')
    .option("--merge", "Generate a shared schema file under src/modules/<name>/schemas")
    .action(async (providedName: string | undefined, options: GenerateOptions) => {
      const name = await resolveName(providedName, "module");
      await generateFrontendModule(name, toLayoutOptions(options));
    });

  // Shorthand: generate component = frontend component
  generateCommand
    .command("component [name]")
    .description("Generate a client component inside src/modules/<module>/client/components")
    .option(
      "-d, --dir <module>",
      "Module directory. If omitted, the component name is also used as the module name.",
    )
    .action(async (providedName: string | undefined, options: GenerateOptions) => {
      const name = await resolveName(providedName, "component");
      await generateFrontendComponent(resolveComponentGenerationRequest(name, options));
    });
}

export function resolveComponentGenerationRequest(
  providedName: string,
  options: Pick<GenerateOptions, "dir">,
): ComponentGenerationRequest {
  return {
    componentName: providedName,
    moduleName: normalizeEntityName(options.dir ?? providedName),
  };
}

async function resolveName(providedName: string | undefined, type: string): Promise<string> {
  let name = providedName ?? "";

  if (!name) {
    const answers = await inquirer.prompt<{ name: string }>([
      {
        type: "input",
        name: "name",
        message: `Enter ${type} name:`,
        validate: (input: string) => input.trim().length > 0 || "Name is required",
      },
    ]);
    name = answers.name;
  }

  return normalizeEntityName(name);
}
