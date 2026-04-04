import renderer from "react-test-renderer";
import { describe, expect, it } from "vitest";

import DashboardOverviewPage from "@/../app/(dashboard)/page";

describe("dashboard overview snapshot", () => {
  it("matches the overview layout", () => {
    const tree = renderer.create(<DashboardOverviewPage />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
