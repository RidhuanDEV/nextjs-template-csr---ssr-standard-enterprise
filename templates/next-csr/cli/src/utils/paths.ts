import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FRAGMENT_PATTERN = /\/\* FRAGMENT:([a-zA-Z0-9_-]+) \*\/([\s\S]*?)\/\* END FRAGMENT:\1 \*\//g;

export interface WriteFileResult {
  action: 'created' | 'skipped-identical' | 'merged' | 'conflict';
  targetPath: string;
  conflictPath?: string;
}

export function findProjectRoot(startDir = __dirname): string {
  let currentDir = path.resolve(startDir);
  const filesystemRoot = path.parse(currentDir).root;

  while (true) {
    if (isProjectRoot(currentDir)) {
      return currentDir;
    }

    if (currentDir === filesystemRoot) {
      return path.resolve(__dirname, '..', '..', '..');
    }

    currentDir = path.dirname(currentDir);
  }
}

export function resolveProjectRoot(): string {
  return findProjectRoot();
}

export function resolveModulesDir(): string {
  return path.join(resolveProjectRoot(), 'src', 'modules');
}

export function resolveComponentsDir(): string {
  return path.join(resolveProjectRoot(), 'src', 'components');
}

export function resolveAppDir(): string {
  return path.join(resolveProjectRoot(), 'src', 'app');
}

export function resolveConstantsDir(): string {
  return path.join(resolveProjectRoot(), 'src', 'lib', 'constants');
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

export async function fileExists(filePath: string): Promise<boolean> {
  return fs.pathExists(filePath);
}

export async function writeFileSafe(filePath: string, content: string): Promise<WriteFileResult> {
  if (!(await fileExists(filePath))) {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`  CREATE ${path.relative(resolveProjectRoot(), filePath)}`);

    return {
      action: 'created',
      targetPath: filePath,
    };
  }

  const existingContent = await fs.readFile(filePath, 'utf-8');

  if (existingContent === content) {
    console.log(`  SKIP ${path.relative(resolveProjectRoot(), filePath)} (identical)`);

    return {
      action: 'skipped-identical',
      targetPath: filePath,
    };
  }

  const mergedContent = tryMergeFragmentDocuments(existingContent, content);

  if (mergedContent) {
    await fs.writeFile(filePath, mergedContent, 'utf-8');
    console.log(`  MERGE ${path.relative(resolveProjectRoot(), filePath)}`);

    return {
      action: 'merged',
      targetPath: filePath,
    };
  }

  const conflictPath = `${filePath}.gen-conflict`;
  await fs.writeFile(conflictPath, content, 'utf-8');
  console.log(
    `  CONFLICT ${path.relative(resolveProjectRoot(), filePath)} -> ${path.relative(resolveProjectRoot(), conflictPath)}`
  );

  return {
    action: 'conflict',
    targetPath: filePath,
    conflictPath,
  };
}

function isProjectRoot(candidatePath: string): boolean {
  return (
    fs.existsSync(path.join(candidatePath, 'package.json')) &&
    fs.existsSync(path.join(candidatePath, 'src')) &&
    fs.existsSync(path.join(candidatePath, 'cli'))
  );
}

function extractFragments(content: string): Map<string, string> {
  const fragments = new Map<string, string>();

  for (const match of content.matchAll(FRAGMENT_PATTERN)) {
    const fragmentName = match[1];
    const fragmentContent = match[2] ?? '';

    if (fragmentName) {
      fragments.set(fragmentName, fragmentContent.trim());
    }
  }

  return fragments;
}

function tryMergeFragmentDocuments(
  existingContent: string,
  incomingContent: string
): string | null {
  const existingFragments = extractFragments(existingContent);
  const incomingFragments = extractFragments(incomingContent);

  if (existingFragments.size === 0 || incomingFragments.size === 0) {
    return null;
  }

  let mergedDocument = existingContent;

  for (const [fragmentName, existingFragment] of existingFragments.entries()) {
    const incomingFragment = incomingFragments.get(fragmentName) ?? '';
    const mergedFragment = mergeFragmentContent(existingFragment, incomingFragment);

    mergedDocument = replaceFragmentContent(mergedDocument, fragmentName, mergedFragment);
  }

  return mergedDocument === existingContent ? null : mergedDocument;
}

function mergeFragmentContent(existingContent: string, incomingContent: string): string {
  if (existingContent === incomingContent) {
    return existingContent;
  }

  if (!existingContent) {
    return incomingContent;
  }

  if (!incomingContent) {
    return existingContent;
  }

  if (existingContent.includes(incomingContent)) {
    return existingContent;
  }

  if (incomingContent.includes(existingContent)) {
    return incomingContent;
  }

  return `${existingContent}\n${incomingContent}`;
}

function replaceFragmentContent(
  documentContent: string,
  fragmentName: string,
  fragmentContent: string
): string {
  const fragmentRegex = new RegExp(
    `(/\\* FRAGMENT:${fragmentName} \\*/)([\\s\\S]*?)(/\\* END FRAGMENT:${fragmentName} \\*/)`
  );

  return documentContent.replace(fragmentRegex, `$1\n${fragmentContent}\n$3`);
}
