/**
 * Integration test for the full embed-song error handling flow
 * Simulates what happens when Last.fm returns various error payloads
 */

// Simulate the core functions
function isSkippableError(error: unknown): boolean {
  if (!error) return false;

  if (error instanceof Error) {
    const message = error.message || "";
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

function mapLastFmErrorCode(
  errorCode: number,
): "NOT_FOUND" | "BAD_REQUEST" | "UNAUTHORIZED" | "INTERNAL_SERVER_ERROR" {
  let code:
    | "NOT_FOUND"
    | "BAD_REQUEST"
    | "UNAUTHORIZED"
    | "INTERNAL_SERVER_ERROR" = "INTERNAL_SERVER_ERROR";

  switch (errorCode) {
    case 6:
    case 7:
    case 15:
    case 20:
    case 21:
    case 22:
    case 23:
    case 25:
      code = "NOT_FOUND";
      break;

    case 2:
    case 3:
    case 5:
    case 27:
      code = "BAD_REQUEST";
      break;

    case 4:
    case 9:
    case 10:
    case 13:
    case 14:
    case 26:
      code = "UNAUTHORIZED";
      break;

    case 8:
    case 11:
    case 16:
    case 29:
      code = "INTERNAL_SERVER_ERROR";
      break;

    default:
      code = "INTERNAL_SERVER_ERROR";
  }

  return code;
}

// Simulate Last.fm error response handling
function processLastFmErrorPayload(payload: unknown): {
  error: Error;
  shouldSkip: boolean;
} | null {
  if (!payload || typeof payload !== "object" || !("error" in payload)) {
    return null;
  }

  const errorCodeRaw = (payload as { error?: unknown }).error;
  const errorCode =
    typeof errorCodeRaw === "number"
      ? errorCodeRaw
      : Number.parseInt(String(errorCodeRaw ?? ""), 10);

  const maybeMessage = (payload as { message?: unknown }).message;
  const message =
    typeof maybeMessage === "string"
      ? maybeMessage
      : "Last.fm returned an error";

  const code = mapLastFmErrorCode(errorCode);
  const error = Object.assign(
    new Error(
      `Last.fm error${Number.isFinite(errorCode) ? ` ${errorCode}` : ""}: ${message}`,
    ),
    { code },
  );

  return { error, shouldSkip: code === "NOT_FOUND" || code === "BAD_REQUEST" };
}

// Test scenarios
const scenarios = [
  {
    name: "Track not found (error code 7)",
    payload: { error: 7, message: "Invalid resource specified" },
    expectedSkip: true,
    expectedError: true,
  },
  {
    name: "Invalid parameters (error code 6)",
    payload: { error: 6, message: "Invalid parameters" },
    expectedSkip: true,
    expectedError: true,
  },
  {
    name: "Invalid API key (error code 10)",
    payload: { error: 10, message: "Invalid API key" },
    expectedSkip: false,
    expectedError: true,
  },
  {
    name: "Rate limit (error code 29)",
    payload: { error: 29, message: "Rate Limit Exceeded" },
    expectedSkip: false,
    expectedError: true,
  },
  {
    name: "Service offline (error code 11)",
    payload: { error: 11, message: "Service Offline" },
    expectedSkip: false,
    expectedError: true,
  },
  {
    name: "Valid response (no error field)",
    payload: { track: { name: "Believe", artist: { name: "Cher" } } },
    expectedSkip: false,
    expectedError: false,
  },
  {
    name: "Null response",
    payload: null,
    expectedSkip: false,
    expectedError: false,
  },
];

let passed = 0;
let failed = 0;

console.log(
  "Testing integration: Last.fm error payload → embed-song decision\n",
);

for (const scenario of scenarios) {
  console.log(`Testing: ${scenario.name}`);

  const result = processLastFmErrorPayload(scenario.payload);

  if (scenario.expectedError) {
    if (result === null) {
      failed++;
      console.log(`  ✗ Expected error but got null\n`);
      continue;
    }

    const shouldSkip = isSkippableError(result.error);
    const isPass = shouldSkip === scenario.expectedSkip;

    if (isPass) {
      passed++;
      const action = shouldSkip ? "skip (no retry)" : "retry";
      console.log(`  ✓ Error detected → ${action}`);
      console.log(`    Error: "${result.error.message}"\n`);
    } else {
      failed++;
      const expectedAction = scenario.expectedSkip ? "skip" : "retry";
      const actualAction = shouldSkip ? "skip" : "retry";
      console.log(`  ✗ Expected ${expectedAction} but would ${actualAction}\n`);
    }
  } else {
    if (result !== null) {
      failed++;
      console.log(
        `  ✗ Expected valid response but got error: ${result.error.message}\n`,
      );
    } else {
      passed++;
      console.log(`  ✓ Valid response (no error)\n`);
    }
  }
}

console.log(`\n${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log("✅ All integration tests passed!");
  process.exit(0);
} else {
  console.log("❌ Some tests failed!");
  process.exit(1);
}
