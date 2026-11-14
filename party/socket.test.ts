import { describe, expect, it } from "vitest";
import { parseIncoming } from "./socket";

describe("parseIncoming", () => {
  it("decodes a JSON object within the size cap", () => {
    expect(parseIncoming('{"type":"ready"}', 64)).toEqual({ type: "ready" });
  });

  it("drops binary, oversized, malformed and non-object frames", () => {
    expect(parseIncoming(new ArrayBuffer(4), 64)).toBeNull();
    expect(parseIncoming(new Uint8Array(4), 64)).toBeNull();
    expect(parseIncoming(`{"type":"${"x".repeat(100)}"}`, 64)).toBeNull();
    expect(parseIncoming("{not json", 64)).toBeNull();
    expect(parseIncoming('"ready"', 64)).toBeNull();
    expect(parseIncoming("42", 64)).toBeNull();
    expect(parseIncoming("null", 64)).toBeNull();
  });
});
