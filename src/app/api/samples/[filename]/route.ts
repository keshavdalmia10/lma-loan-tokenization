import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Serve sample PDF files
const ALLOWED_FILES: Record<string, string> = {
  'sample-loan-term-sheet.pdf': 'application/pdf',
  'sample-lma-facility-agreement-cover-summary.pdf': 'application/pdf',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Check if file is allowed
  const contentType = ALLOWED_FILES[filename];
  if (!contentType) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // Try multiple paths (development vs production)
  const possiblePaths = [
    join(process.cwd(), 'public', filename),
    join(process.cwd(), '..', 'public', filename),
    join('/app', 'public', filename),
  ];

  for (const filePath of possiblePaths) {
    if (existsSync(filePath)) {
      try {
        const fileBuffer = readFileSync(filePath);
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${filename}"`,
          },
        });
      } catch {
        continue;
      }
    }
  }

  return NextResponse.json({ error: 'File not found' }, { status: 404 });
}
