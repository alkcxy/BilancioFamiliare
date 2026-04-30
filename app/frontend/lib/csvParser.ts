export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  const sep = lines[0].includes(';') ? ';' : ','
  const [headerLine, ...dataLines] = lines
  const headers = headerLine.split(sep).map((h) => h.trim())
  const rows = dataLines.map((l) => l.split(sep).map((c) => c.trim()))
  return { headers, rows }
}

export function inferSign(raw: string): { sign: '+' | '-'; amount: string } {
  const normalized = raw.replace(',', '.')
  const negative = normalized.startsWith('-')
  const amount = negative ? normalized.slice(1) : normalized
  return { sign: negative ? '-' : '+', amount }
}
