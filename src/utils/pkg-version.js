// Utility to robustly get the package version for both local and global installs
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function findPackageJson(startDir = __dirname) {
  let dir = startDir;
  while (dir !== path.parse(dir).root) {
    const candidate = path.join(dir, 'package.json');
    try {
      require('fs').accessSync(candidate);
      return candidate;
    } catch {}
    dir = path.dirname(dir);
  }
  throw new Error('package.json not found');
}
export const PKG_VERSION = require(findPackageJson()).version;
