import { describe, expect, it } from "vitest";

import * as nativeComponents from "../components/index.native";
import * as webComponents from "../components/index.web";

describe("platform exports", () => {
  it("exports the web component surface", () => {
    expect(webComponents.Button).toBeTypeOf("function");
    expect(webComponents.Modal).toBeTypeOf("function");
  });

  it("exports the native component surface", () => {
    expect(nativeComponents.Button).toBeTypeOf("function");
    expect(nativeComponents.BottomSheet).toBeTypeOf("function");
  });
});
