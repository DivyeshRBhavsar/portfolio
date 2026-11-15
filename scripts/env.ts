import { existsSync } from 'fs';
import path from 'path';

/**
 * Load .env.local into process.env for the scripts (Next.js does this itself for the
 * app). Variables already set in the environment win, as in Next.js and CI.
 */
export function loadEnv(): void {
  const file = path.join(process.cwd(), '.env.local');
  if (!existsSync(file)) return;
  (process as unknown as { loadEnvFile: (file: string) => void }).loadEnvFile(file);
}
