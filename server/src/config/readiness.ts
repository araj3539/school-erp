import mongoose from "mongoose";

export type ReadinessStatus = {
  ready: boolean;
  dependencies: {
    mongodb: "ok" | "unavailable";
  };
};

export function getReadinessStatus(): ReadinessStatus {
  const mongodbReady = mongoose.connection.readyState === 1;

  return {
    ready: mongodbReady,
    dependencies: {
      mongodb: mongodbReady ? "ok" : "unavailable",
    },
  };
}
