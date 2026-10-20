import { persistence } from "../persistence/client";

export const analyticsService = {
  async getDashboard() {
    const [metrics, measurements] = await Promise.all([
      persistence.list("analyticsMetrics"),
      persistence.list("analyticsMeasurements"),
    ]);
    return { metrics, measurements };
  },
};
