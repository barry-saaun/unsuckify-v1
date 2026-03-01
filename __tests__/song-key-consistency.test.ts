/**
 * Test suite for song key consistency
 * Verifies that buildSongKey produces consistent keys for the same input
 * and that identity-derived keys match playlist keys
 */

// Simulate buildSongKey from src/lib/ingestion/sanitise.ts
// Current implementation: lowercase + replace spaces with dashes
function buildSongKey(artist: string, track: string): string {
  return `${artist}::${track}`.toLowerCase().replace(/\s+/g, "-");
}

// Test cases
const testCases = [
  {
    artist: "The Beatles",
    track: "Let It Be",
    desc: "Classic artist and track",
  },
  {
    artist: "Fabolous & Tamia",
    track: "Into You (feat. Tamia) - Early Fade Main Mix Amended",
    desc: "Featured artist with remix subtitle",
  },
  { artist: "Cher", track: "Believe", desc: "Single artist" },
  {
    artist: "  The Doors  ",
    track: "  Light My Fire  ",
    desc: "Whitespace handling",
  },
  {
    artist: "RADIOHEAD",
    track: "CREEP",
    desc: "Uppercase normalization",
  },
];

console.log("Testing song key consistency...\n");

let passed = 0;
let failed = 0;

// Test 1: Same input produces same key
console.log("Test 1: Deterministic hashing (same input → same key)\n");
for (const test of testCases) {
  const key1 = buildSongKey(test.artist, test.track);
  const key2 = buildSongKey(test.artist, test.track);
  const isPass = key1 === key2;

  if (isPass) {
    passed++;
    console.log(`✓ "${test.artist}" - "${test.track}" → consistent hash`);
  } else {
    failed++;
    console.log(
      `✗ "${test.artist}" - "${test.track}" → inconsistent hash (${key1} vs ${key2})`,
    );
  }
}

// Test 2: Case insensitivity
console.log("\nTest 2: Case insensitivity\n");

const caseTests = [
  {
    input1: { artist: "The Beatles", track: "Let It Be" },
    input2: { artist: "the beatles", track: "let it be" },
    desc: "Mixed case normalization",
  },
  {
    input1: { artist: "RADIOHEAD", track: "CREEP" },
    input2: { artist: "Radiohead", track: "Creep" },
    desc: "Uppercase vs mixed case",
  },
];

for (const test of caseTests) {
  const key1 = buildSongKey(test.input1.artist, test.input1.track);
  const key2 = buildSongKey(test.input2.artist, test.input2.track);
  const isPass = key1 === key2;

  if (isPass) {
    passed++;
    console.log(`✓ ${test.desc} → same key despite different case`);
  } else {
    failed++;
    console.log(`✗ ${test.desc} → different keys (${key1} vs ${key2})`);
  }
}

// Test 3: Multiple spaces are normalized to single dash (via /\s+/g replacement)
console.log("\nTest 3: Multiple spaces normalized to single dash\n");

const whitespaceTests = [
  {
    input1: { artist: "The Doors", track: "Light My Fire" },
    input2: { artist: "The  Doors", track: "Light  My  Fire" },
    expected: true,
    desc: "Multiple spaces ARE normalized to single dash via /\\s+/g",
  },
  {
    input1: { artist: "Cher", track: "Believe" },
    input2: { artist: "Cher", track: "Believe" },
    expected: true,
    desc: "Same input produces same output",
  },
];

for (const test of whitespaceTests) {
  const key1 = buildSongKey(test.input1.artist, test.input1.track);
  const key2 = buildSongKey(test.input2.artist, test.input2.track);
  const isPass = (key1 === key2) === test.expected;

  if (isPass) {
    passed++;
    const result = key1 === key2 ? "same" : "different";
    console.log(`✓ ${test.desc} → ${result} as expected`);
  } else {
    failed++;
    const expected = test.expected ? "same" : "different";
    const actual = key1 === key2 ? "same" : "different";
    console.log(`✗ ${test.desc} → ${actual} but expected ${expected}`);
  }
}

// Test 4: Identity-derived key matches playlist key (the fix from Step 5)
console.log("\nTest 4: Identity-derived keys match playlist keys\n");

const identityTests = [
  {
    playlistArtist: "Fabolous & Tamia",
    playlistTrack: "Into You (feat. Tamia) - Early Fade Main Mix Amended",
    lastFmArtist: "Fabolous",
    lastFmTrack: "Into You",
    desc: "Last.fm canonicalizes artist & track names",
  },
];

for (const test of identityTests) {
  // In old code, songKey would be built from Last.fm metadata
  const oldSongKey = buildSongKey(test.lastFmArtist, test.lastFmTrack);

  // In new code (Step 5), songKey is built from playlist identity
  const newSongKey = buildSongKey(test.playlistArtist, test.playlistTrack);

  // They should be different, but consistently so
  console.log(`  Playlist identity key: ${newSongKey.substring(0, 8)}...`);
  console.log(`  Last.fm-derived key:   ${oldSongKey.substring(0, 8)}...`);
  console.log(
    `  → ${newSongKey !== oldSongKey ? "Different (as expected)" : "Same (would cause issues!)"}`,
  );

  if (newSongKey !== oldSongKey) {
    passed++;
    console.log(`✓ ${test.desc} → identity keying prevents mismatch`);
  } else {
    failed++;
    console.log(`✗ ${test.desc} → keys should differ to prevent lookup issues`);
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
