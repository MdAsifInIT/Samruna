import { describe, expect, it } from "vitest";
import { executionStatusPresentation } from "./executionPresentation";

describe("executionStatusPresentation", () => {
  it.each(["running", "completed", "needs_human", "blocked", "failed"] as const)("maps %s truthfully", (status) => {
    const presentation = executionStatusPresentation(status);
    expect(presentation.label).toBeTruthy();
    expect(presentation.headline.toLowerCase()).toContain(status === "needs_human" ? "human review" : status === "completed" ? "completed" : status);
    expect(presentation.tone === "success").toBe(status === "completed");
  });
});
