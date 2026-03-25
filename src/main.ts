import { readFileSync } from "fs";
import { parse } from "./parser.js";
import { validate } from "./validator.js";

const filePath = process.argv[2] || "sample.roam";
const input = readFileSync(filePath, "utf-8");
const trip = parse(input);
const errors = validate(trip);

if (errors.length > 0) {
  console.error("Validation errors:");
  for (const err of errors) {
    console.error(`  [${err.index}] ${err.message}`);
  }
  process.exit(1);
}

console.log(JSON.stringify(trip, null, 2));
