interface TemplateVariables {
  name: string;
  Name: string;
  NAME: string;
  namePlural: string;
  NamePlural: string;
}

export function createVariables(name: string): TemplateVariables {
  const pascal = toPascalCase(name);
  const plural = name.endsWith('s') ? name : name + 's';
  const pascalPlural = toPascalCase(plural);

  return {
    name,
    Name: pascal,
    NAME: name.toUpperCase(),
    namePlural: plural,
    NamePlural: pascalPlural,
  };
}

export function renderTemplate(template: string, vars: TemplateVariables): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}
