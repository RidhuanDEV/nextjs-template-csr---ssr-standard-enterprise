import pluralize from "pluralize";

export interface TemplateVariables {
  [key: string]: string;
  rawName: string;
  nameKebab: string;
  nameSnake: string;
  nameCamel: string;
  Name: string;
  namePlural: string;
  namePluralKebab: string;
  namePluralSnake: string;
  NamePlural: string;
  NAME: string;
  NAME_PLURAL: string;
}

export interface ComponentVariables {
  [key: string]: string;
  rawName: string;
  nameKebab: string;
  nameSnake: string;
  nameCamel: string;
  Name: string;
  NAME: string;
}

export function normalizeEntityName(input: string): string {
  const words = splitWords(input);
  const singularPhrase = pluralize.singular(words.join(" "));
  return toKebabCase(splitWords(singularPhrase));
}

export function createVariables(input: string): TemplateVariables {
  const singularWords = splitWords(pluralize.singular(splitWords(input).join(" ")));
  const pluralWords = splitWords(pluralize.plural(singularWords.join(" ")));

  return {
    rawName: input.trim(),
    nameKebab: toKebabCase(singularWords),
    nameSnake: toSnakeCase(singularWords),
    nameCamel: toCamelCase(singularWords),
    Name: toPascalCase(singularWords),
    namePlural: toCamelCase(pluralWords),
    namePluralKebab: toKebabCase(pluralWords),
    namePluralSnake: toSnakeCase(pluralWords),
    NamePlural: toPascalCase(pluralWords),
    NAME: toUpperSnakeCase(singularWords),
    NAME_PLURAL: toUpperSnakeCase(pluralWords),
  };
}

export function createComponentVariables(input: string): ComponentVariables {
  const words = splitWords(input);

  return {
    rawName: input.trim(),
    nameKebab: toKebabCase(words),
    nameSnake: toSnakeCase(words),
    nameCamel: toCamelCase(words),
    Name: toPascalCase(words),
    NAME: toUpperSnakeCase(words),
  };
}

export function renderTemplate<T extends Record<string, string>>(
  template: string,
  vars: T,
): string {
  let result = template;

  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }

  return result;
}

function splitWords(input: string): string[] {
  return input
    .trim()
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/[_\-\s]+/g, " ")
    .toLowerCase()
    .split(" ")
    .filter((word) => word.length > 0);
}

function toCamelCase(words: string[]): string {
  return words
    .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join("");
}

function toPascalCase(words: string[]): string {
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
}

function toSnakeCase(words: string[]): string {
  return words.join("_");
}

function toKebabCase(words: string[]): string {
  return words.join("-");
}

function toUpperSnakeCase(words: string[]): string {
  return toSnakeCase(words).toUpperCase();
}
