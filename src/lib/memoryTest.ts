import { extractUserFacts } from "./memory";

// Test function to verify memory extraction works
export function testMemoryExtraction() {
  const testMessages = [
    "Remember that I prefer working late at night",
    "Keep in mind that my favorite color is blue",
    "Don't forget I have a meeting with investors on Friday",
    "Note that I'm allergic to peanuts",
    "Sam, remember I'm launching the product next month",
    "For later: the API key expires on Dec 31st",
    "Save this: my backup email is test@example.com",
    "I'm 25 years old and work as a developer",
    "I live in New York and love pizza",
  ];

  testMessages.forEach((message, index) => {
    console.log(`\nTest ${index + 1}: "${message}"`);
    const facts = extractUserFacts(message);
    console.log("Extracted facts:", facts);
  });
}

// Uncomment to run tests in console:
// testMemoryExtraction();
