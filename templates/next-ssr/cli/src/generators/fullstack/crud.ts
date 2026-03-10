import { generateBackendCrud } from '../backend/crud.js';
import { generateFrontendCrud } from '../frontend/crud.js';

export async function generateFullstackCrud(name: string): Promise<void> {
  console.log(`\n=== Generating fullstack CRUD for: ${name} ===\n`);

  await generateBackendCrud(name);
  await generateFrontendCrud(name);

  console.log(`\n=== Fullstack CRUD for "${name}" generated successfully ===`);
  console.log(`\nReminder:`);
  console.log(`  1. Add the model to prisma/schema.prisma`);
  console.log(`  2. Run: npx prisma migrate dev`);
  console.log(`  3. Add permissions to src/lib/constants/permissions.ts`);
  console.log(`  4. Add navigation link to src/components/layout/Sidebar.tsx`);
  console.log(`  5. Fill in the TODO placeholders in generated files`);
}
