// Fills <variable> placeholders with recipient data
export function fillTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/<([^>]+)>/g, (match, key) => {
    const val = variables[key.toLowerCase().trim()];
    return val !== undefined ? val : match;
  });
}

// Extracts all <variable> names from a template string
export function extractVariables(template: string): string[] {
  const matches = template.match(/<([^>]+)>/g) ?? [];
  return [...new Set(matches.map(m => m.slice(1, -1).toLowerCase().trim()))];
}
