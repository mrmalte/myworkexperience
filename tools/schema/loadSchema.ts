import { readFileSync } from "fs";
import { join } from "path";

export function loadSchema() {
  const schemaPath = join(
    process.cwd(),
    "specs/002-cv-website-pages/contracts/site-content.schema.json"
  );
  const schemaText = readFileSync(schemaPath, "utf-8");
  return JSON.parse(schemaText);
}
