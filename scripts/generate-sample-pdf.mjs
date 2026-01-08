import fs from 'node:fs';
import path from 'node:path';

function pdfEscape(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r?\n/g, ' ');
}

function pad10(n) {
  return String(n).padStart(10, '0');
}

function buildPdf(lines) {
  const header = '%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n';

  const contentLines = [
    'BT',
    '/F1 12 Tf',
    '72 720 Td',
    '14 TL',
    ...lines.map((l, i) => `(${pdfEscape(l)}) Tj${i === lines.length - 1 ? '' : ' T*'}`),
    'ET',
  ].join('\n') + '\n';

  const contentStream = `<< /Length ${Buffer.byteLength(contentLines, 'latin1')} >>\nstream\n${contentLines}endstream\n`;

  const objects = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  objects[3] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[5] = contentStream.trimEnd();

  let body = '';
  const offsets = [0];
  let cursor = Buffer.byteLength(header, 'latin1');

  for (let i = 1; i <= 5; i++) {
    offsets[i] = cursor;
    const obj = `${i} 0 obj\n${objects[i]}\nendobj\n`;
    body += obj;
    cursor += Buffer.byteLength(obj, 'latin1');
  }

  const xrefStart = cursor;
  let xref = 'xref\n0 6\n';
  xref += '0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) {
    xref += `${pad10(offsets[i])} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return header + body + xref + trailer;
}

const lines = [
  'Loan Term Sheet (Sample)',
  '',
  'Borrower: Acme Manufacturing LLC',
  'Facility Type: Term Loan',
  'Facility Amount: USD 25,000,000',
  'Currency: USD',
  'Interest Type: Floating',
  'Reference Rate: SOFR',
  'Spread: 350 bps',
  'All-in Rate: SOFR + 3.50%',
  'Maturity Date: 2030-12-31',
  'Security Type: Secured',
  'Seniority Rank: Senior',
  '',
  'Covenants:',
  '- Leverage Ratio: <= 4.50x (Quarterly)',
  '- Minimum Liquidity: >= USD 2,000,000 (Monthly)',
];

const linesLmaCover = [
  'LMA Facility Agreement - Cover Summary (Sample)',
  '',
  'This is a short, narrative-style summary intended for document parsing demos.',
  'It is NOT legal advice and is NOT a complete facility agreement.',
  '',
  'Parties',
  'Borrower: Acme Manufacturing LLC (the "Borrower")',
  'Arranger: Example Bank plc',
  'Facility Agent: Example Bank plc',
  'Security Agent: Example Security Trustee Ltd.',
  '',
  'Facilities',
  'Type: Senior Secured Term Loan Facility',
  'Commitment: USD 25,000,000',
  'Purpose: General corporate purposes and permitted acquisitions',
  'Availability Period: 90 days from signing',
  '',
  'Interest',
  'Rate: SOFR + 3.50% per annum (margin 350 bps)',
  'Interest Period: 1 month (Borrower may elect 1 or 3 months)',
  'Default Interest: +2.00% above the rate otherwise applicable',
  '',
  'Repayment & Maturity',
  'Final Maturity Date: 31 December 2030',
  'Amortisation: 1.00% of principal per quarter, balance due at maturity',
  'Voluntary Prepayment: Allowed (subject to customary notice and break costs)',
  '',
  'Security & Guarantees',
  'Security: First-ranking security over material assets (where permitted)',
  'Guarantees: Guarantees from material subsidiaries (subject to limitations)',
  '',
  'Financial Covenants (tested quarterly)',
  'Leverage Ratio: <= 4.50x',
  'Interest Cover: >= 2.00x',
  'Minimum Liquidity: >= USD 2,000,000',
  '',
  'Events of Default (summary)',
  'Non-payment, breach of financial covenants, insolvency, cross-default,',
  'and unlawfulness (subject to cure periods and thresholds where applicable).',
  '',
  'Governing Law',
  'English law',
];

const outputs = [
  { filename: 'sample-loan-term-sheet.pdf', lines },
  { filename: 'sample-lma-facility-agreement-cover-summary.pdf', lines: linesLmaCover },
];

for (const out of outputs) {
  const pdf = buildPdf(out.lines);
  const outPath = path.join(process.cwd(), 'public', out.filename);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.from(pdf, 'latin1'));
  console.log(`Wrote ${outPath}`);
}
