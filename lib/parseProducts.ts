export function parseProducts(text: string): string[] {
  const lines = text.includes('\n') ? text.split('\n') : text.split(',')
  return [...new Set(lines.map(l => l.trim()).filter(Boolean))]
}

export function parseCsvProducts(text: string): string[] {
  const lines = text.split(/\r?\n/)
  const names: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const cols = trimmed.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const name = cols[0]
    if (name && name.toLowerCase() !== 'name' && name.toLowerCase() !== 'product') {
      names.push(name)
    }
  }
  return [...new Set(names)]
}
