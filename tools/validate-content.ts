#!/usr/bin/env tsx
import { readFileSync } from "fs";
import { join } from "path";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { loadSchema } from "./schema/loadSchema.js";

function main() {
  const contentPath = join(process.cwd(), "public/content/site-content.json");
  const schema = loadSchema();

  console.log("Loading generated content...");
  const contentText = readFileSync(contentPath, "utf-8");
  const content = JSON.parse(contentText);

  console.log("Validating against JSON Schema...");
  const ajv = new Ajv({
    strict: true,
    allErrors: true,
    validateSchema: false, // Disable meta-schema validation to work with draft 2020-12
  });
  addFormats(ajv);

  const validate = ajv.compile(schema);
  const valid = validate(content);

  if (!valid) {
    console.error("✗ Validation failed:");
    for (const error of validate.errors || []) {
      console.error(`  ${error.instancePath || "/"}: ${error.message}`);
      if (error.params) {
        console.error(`    ${JSON.stringify(error.params)}`);
      }
    }
    process.exit(1);
  }

  console.log("✓ Validation passed");
}

main();
