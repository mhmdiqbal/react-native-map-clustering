import ClusteredMapView from "../src/ClusteredMapView";
import Marker from "../src/Marker";
import DefaultExport, { Marker as MarkerExport } from "../src";

describe("index", () => {
  it("exports ClusteredMapView as the default export", () => {
    expect(DefaultExport).toBe(ClusteredMapView);
  });

  it("exports the typed Marker", () => {
    expect(MarkerExport).toBe(Marker);
  });
});
