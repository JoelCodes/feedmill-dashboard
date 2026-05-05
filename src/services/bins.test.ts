import { getBins, getBinsByCustomerId } from "./bins";

describe("bins service", () => {
  describe("getBins", () => {
    it("returns an array with length > 0", async () => {
      const bins = await getBins();
      expect(bins.length).toBeGreaterThan(0);
    });

    it("each bin has id property", async () => {
      const bins = await getBins();
      bins.forEach((bin) => {
        expect(bin).toHaveProperty("id");
        expect(typeof bin.id).toBe("string");
      });
    });

    it("each bin has fillPercentage property (number)", async () => {
      const bins = await getBins();
      bins.forEach((bin) => {
        expect(bin).toHaveProperty("fillPercentage");
        expect(typeof bin.fillPercentage).toBe("number");
      });
    });

    it("each bin has alertLevel property", async () => {
      const bins = await getBins();
      bins.forEach((bin) => {
        expect(bin).toHaveProperty("alertLevel");
        expect(["none", "low", "critical"]).toContain(bin.alertLevel);
      });
    });
  });

  describe("getBinsByCustomerId", () => {
    it("returns only bins for the specified customer", async () => {
      const bins = await getBinsByCustomerId("CUST-001");
      expect(bins.length).toBeGreaterThan(0);
      bins.forEach((bin) => {
        expect(bin.customerId).toBe("CUST-001");
      });
    });

    it("returns empty array for non-existent customer", async () => {
      const bins = await getBinsByCustomerId("INVALID-CUSTOMER");
      expect(bins).toEqual([]);
    });
  });

  describe("alert level thresholds", () => {
    it("bins with fillPercentage < 20 have alertLevel critical", async () => {
      const bins = await getBins();
      const criticalBins = bins.filter((bin) => bin.fillPercentage < 20);
      expect(criticalBins.length).toBeGreaterThan(0);
      criticalBins.forEach((bin) => {
        expect(bin.alertLevel).toBe("critical");
      });
    });

    it("bins with fillPercentage 20-39 have alertLevel low", async () => {
      const bins = await getBins();
      const lowBins = bins.filter(
        (bin) => bin.fillPercentage >= 20 && bin.fillPercentage < 40
      );
      expect(lowBins.length).toBeGreaterThan(0);
      lowBins.forEach((bin) => {
        expect(bin.alertLevel).toBe("low");
      });
    });

    it("bins with fillPercentage >= 40 have alertLevel none", async () => {
      const bins = await getBins();
      const normalBins = bins.filter((bin) => bin.fillPercentage >= 40);
      expect(normalBins.length).toBeGreaterThan(0);
      normalBins.forEach((bin) => {
        expect(bin.alertLevel).toBe("none");
      });
    });
  });
});
