/**
 * Test suite for skippable error detection in embed-song
 * This tests the isSkippableError() helper logic
 */

// Simulate the isSkippableError function from embed-song.ts
function isSkippableError(error: unknown): boolean {
  if (!error) return false;

  if (error instanceof Error) {
    const message = error.message || "";
    // Check for TRPC error codes in message or check instanceof
    if (
      message.includes("NOT_FOUND") ||
      message.includes("BAD_REQUEST") ||
      (error as any).code === "NOT_FOUND" ||
      (error as any).code === "BAD_REQUEST"
    ) {
      return true;
    }
  }

  if (typeof error === "object" && error !== null) {
    const maybeCode = (error as any).code;
    if (maybeCode === "NOT_FOUND" || maybeCode === "BAD_REQUEST") {
      return true;
    }
  }

  return false;
}

// Test cases
const testCases = [
  // Skippable errors
  {
    error: { code: "NOT_FOUND" },
    expected: true,
    desc: "Object with code NOT_FOUND",
  },
  {
    error: { code: "BAD_REQUEST" },
    expected: true,
    desc: "Object with code BAD_REQUEST",
  },
  {
    error: new Error("Last.fm error 6: NOT_FOUND"),
    expected: true,
    desc: "Error with NOT_FOUND in message",
  },
  {
    error: new Error("Invalid parameters: BAD_REQUEST"),
    expected: true,
    desc: "Error with BAD_REQUEST in message",
  },
  {
    error: Object.assign(new Error("Track not found"), { code: "NOT_FOUND" }),
    expected: true,
    desc: "Error instance with code property",
  },

  // Non-skippable errors
  {
    error: { code: "UNAUTHORIZED" },
    expected: false,
    desc: "Object with code UNAUTHORIZED",
  },
  {
    error: { code: "INTERNAL_SERVER_ERROR" },
    expected: false,
    desc: "Object with code INTERNAL_SERVER_ERROR",
  },
  {
    error: new Error("Backend failed"),
    expected: false,
    desc: "Error without skippable markers",
  },
  {
    error: new Error("Service temporarily unavailable"),
    expected: false,
    desc: "Transient error",
  },

  // Edge cases
  { error: null, expected: false, desc: "null error" },
  { error: undefined, expected: false, desc: "undefined error" },
  { error: "", expected: false, desc: "empty string" },
  { error: 0, expected: false, desc: "number 0" },
  { error: {}, expected: false, desc: "empty object" },
];

let passed = 0;
let failed = 0;

console.log("Testing skippable error detection...\n");

for (const test of testCases) {
  const result = isSkippableError(test.error);
  const isPass = result === test.expected;

  if (isPass) {
    passed++;
    console.log(`✓ ${test.desc} → skippable=${result}`);
  } else {
    failed++;
    console.log(
      `✗ ${test.desc} → skippable=${result}, expected ${test.expected}`,
    );
  }
}

console.log(`\n${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log("✅ All tests passed!");
  process.exit(0);
} else {
  console.log("❌ Some tests failed!");
  process.exit(1);
}
