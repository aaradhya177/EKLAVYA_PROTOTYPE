import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RoleGuard } from "@/components/role-guard";
import { mockReplace } from "../vitest.setup";

describe("role guard", () => {
  it("redirects coach role away from portal", () => {
    render(
      <RoleGuard token="token" role="coach">
        <div>Hidden</div>
      </RoleGuard>
    );
    expect(mockReplace).toHaveBeenCalled();
  });
});
