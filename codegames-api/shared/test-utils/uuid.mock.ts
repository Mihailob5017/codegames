// Test stub for the ESM-only `uuid` package (jest + ts-jest can't parse its
// ESM build). Mapped in via jest.config.js `moduleNameMapper`. Returns a fixed
// value so filenames/ids are deterministic in tests.
export const v4 = (): string => "00000000-0000-0000-0000-000000000000";
