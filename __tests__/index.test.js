import ClusteredMapView from "../lib/ClusteredMapView";

describe("index", () => {
  it("exports ClusteredMapView as the default export", () => {
    expect(require("../index").default).toBe(ClusteredMapView);
  });
});
