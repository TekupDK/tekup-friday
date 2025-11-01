import { parseIntent } from "./server/intent-actions.ts";

const testMessages = [
  "Book Lars Nielsen til rengøring på mandag kl 10-13",
  "Opret lead: Peter Hansen, peter@test.dk, 12345678",
  "Opret opgave: Ring til kunde",
  "Nyt lead: Marie ønsker flytterengøring, 85m²",
  "Lars' rengøring er færdig",
];

console.log("=== Intent Detection Test ===\n");

for (const message of testMessages) {
  const intent = parseIntent(message);
  console.log(`Message: "${message}"`);
  console.log(`Intent: ${intent.intent} (confidence: ${intent.confidence})`);
  console.log(`Params:`, intent.params);
  console.log("---\n");
}
