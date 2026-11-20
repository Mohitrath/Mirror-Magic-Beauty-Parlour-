import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { zipSync } from "fflate";

// Include project source, never runtime data or local credentials.
const entries = {};
function include(file) { entries["mirror-magic-vercel/" + file.replaceAll("\\","/")] = readFileSync(file); }
function walk(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const file = join(folder, entry.name);
    if (file === join("public","downloads")) continue;
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile()) include(file);
  }
}
for (const dir of ["app","components","public","lib","db","drizzle","scripts"]) walk(dir);
for (const file of ["README.md",".env.example",".gitignore","package.json","package-lock.json","tsconfig.json","next.config.ts"]) include(file);
mkdirSync("public/downloads", { recursive:true });
writeFileSync("public/downloads/mirror-magic-source.zip", zipSync(entries));
