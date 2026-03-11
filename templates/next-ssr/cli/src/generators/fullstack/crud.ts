import { generateBackendCrud } from "../backend/crud.js";
import { generateFrontendCrud } from "../frontend/crud.js";
import type { GeneratorLayoutOptions } from "../shared.js";

export async function generateFullstackCrud(
  name: string,
  options: GeneratorLayoutOptions = {},
): Promise<void> {
  console.log(`\n=== Generating fullstack CRUD for: ${name} ===\n`);

  await generateBackendCrud(name, options);
  await generateFrontendCrud(name, options);

  console.log(`\n=== Fullstack CRUD for "${name}" generated successfully ===`);
  console.log(`\nReminder:`);
  console.log(`  1. Add the model to prisma/schema.prisma`);
  console.log(`  2. Run: npx prisma migrate dev`);
  console.log(`  3. Build the CLI: npm run cli:build`);
  console.log(`  4. Review generated permission constants + sidebar changes`);
  console.log(`  5. Add the sidebar link to src/components/layout/Sidebar.tsx`);
}
