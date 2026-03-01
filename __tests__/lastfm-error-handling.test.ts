/**
 * Test suite for Last.fm error payload detection
 * This tests the error code → TRPCError code mapping
 */

import { TRPCError } from "@trpc/server";

// Simulate the error code mapping logic from src/lib/music/lastfm.ts
function mapLastFmErrorCode(
  errorCode: number,
): "NOT_FOUND" | "BAD_REQUEST" | "UNAUTHORIZED" | "INTERNAL_SERVER_ERROR" {
  let code:
    | "NOT_FOUND"
    | "BAD_REQUEST"
    | "UNAUTHORIZED"
    | "INTERNAL_SERVER_ERROR" = "INTERNAL_SERVER_ERROR";

  switch (errorCode) {
    // Skippable: resource doesn't exist or can't be returned
    case 6: // Invalid parameters
    case 7: // Invalid resource specified
    case 15: // Item not available for streaming
    case 20: // Not enough content
    case 21: // Not enough members
    case 22: // Not enough fans
    case 23: // Not enough neighbours
    case 25: // Radio station not found
      code = "NOT_FOUND";
      break;

    // Skippable: bad request shape, deprecated, or invalid method
    case 2: // Invalid service
    case 3: // Invalid method
    case 5: // Invalid format
    case 27: // Deprecated
      code = "BAD_REQUEST";
      break;

    // Auth / key issues – fatal config, not skippable
    case 4: // Authentication failed
    case 9: // Invalid session key
    case 10: // Invalid API key
    case 13: // Invalid method signature
    case 14: // Unauthorized token
    case 26: // API key suspended
      code = "UNAUTHORIZED";
      break;

    // Transient / retriable
    case 8: // Operation failed – backend error
    case 11: // Service offline
    case 16: // Temporarily unavailable
    case 29: // Rate limit exceeded
      code = "INTERNAL_SERVER_ERROR";
      break;

    default:
      code = "INTERNAL_SERVER_ERROR";
  }

  return code;
}

// Test cases
const testCases = [
  // Skippable: NOT_FOUND errors
  { code: 6, expected: "NOT_FOUND", desc: "Invalid parameters" },
  { code: 7, expected: "NOT_FOUND", desc: "Invalid resource specified" },
  { code: 15, expected: "NOT_FOUND", desc: "Item not available for streaming" },
  { code: 20, expected: "NOT_FOUND", desc: "Not enough content" },
  { code: 25, expected: "NOT_FOUND", desc: "Radio not found" },

  // Skippable: BAD_REQUEST errors
  { code: 2, expected: "BAD_REQUEST", desc: "Invalid service" },
  { code: 3, expected: "BAD_REQUEST", desc: "Invalid method" },
  { code: 5, expected: "BAD_REQUEST", desc: "Invalid format" },
  { code: 27, expected: "BAD_REQUEST", desc: "Deprecated" },

  // Non-skippable: UNAUTHORIZED
  { code: 10, expected: "UNAUTHORIZED", desc: "Invalid API key" },
  { code: 26, expected: "UNAUTHORIZED", desc: "API key suspended" },

  // Retriable: INTERNAL_SERVER_ERROR
  { code: 8, expected: "INTERNAL_SERVER_ERROR", desc: "Operation failed" },
  { code: 11, expected: "INTERNAL_SERVER_ERROR", desc: "Service offline" },
  {
    code: 16,
    expected: "INTERNAL_SERVER_ERROR",
    desc: "Temporarily unavailable",
  },
  { code: 29, expected: "INTERNAL_SERVER_ERROR", desc: "Rate limit exceeded" },

  // Unknown code defaults to INTERNAL_SERVER_ERROR
  { code: 999, expected: "INTERNAL_SERVER_ERROR", desc: "Unknown error code" },
];

let passed = 0;
let failed = 0;

console.log("Testing Last.fm error code mapping...\n");

for (const test of testCases) {
  const result = mapLastFmErrorCode(test.code);
  const isPass = result === test.expected;

  if (isPass) {
    passed++;
    console.log(`✓ Error ${test.code} → ${result} (${test.desc})`);
  } else {
    failed++;
    console.log(
      `✗ Error ${test.code} → ${result}, expected ${test.expected} (${test.desc})`,
    );
  }
}

console.log(`\n${passed} passed, ${failed} failed\n`);

// Test the classification logic
console.log("Testing error classification for skip vs retry:\n");

const classifyTests = [
  { code: 6, shouldSkip: true, desc: "Track not found (invalid params)" },
  { code: 7, shouldSkip: true, desc: "Track not found (invalid resource)" },
  { code: 10, shouldSkip: false, desc: "Invalid API key (config issue)" },
  { code: 8, shouldSkip: false, desc: "Backend failure (retriable)" },
  { code: 29, shouldSkip: false, desc: "Rate limit (retriable)" },
];

let classifyPassed = 0;
let classifyFailed = 0;

for (const test of classifyTests) {
  const code = mapLastFmErrorCode(test.code);
  const isSkippable = code === "NOT_FOUND" || code === "BAD_REQUEST";
  const isPass = isSkippable === test.shouldSkip;

  if (isPass) {
    classifyPassed++;
    const action = test.shouldSkip ? "skip" : "retry";
    console.log(`✓ Error ${test.code} should ${action} (${test.desc})`);
  } else {
    classifyFailed++;
    const expected = test.shouldSkip ? "skip" : "retry";
    const actual = isSkippable ? "skip" : "retry";
    console.log(
      `✗ Error ${test.code} should ${expected} but would ${actual} (${test.desc})`,
    );
  }
}

console.log(
  `\n${classifyPassed} classification passed, ${classifyFailed} failed\n`,
);

if (failed === 0 && classifyFailed === 0) {
  console.log("✅ All tests passed!");
  process.exit(0);
} else {
  console.log("❌ Some tests failed!");
  process.exit(1);
}
