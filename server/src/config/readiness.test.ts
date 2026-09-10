import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { getReadinessStatus } from "./readiness.js";

describe("getReadinessStatus", () => {
  it("reports MongoDB as unavailable when the connection is not open", () => {
    const originalReadyState = mongoose.connection.readyState;
    Object.defineProperty(mongoose.connection, "readyState", {
      configurable: true,
      value: 0,
    });

    expect(getReadinessStatus()).toEqual({
      ready: false,
      dependencies: { mongodb: "unavailable" },
    });

    Object.defineProperty(mongoose.connection, "readyState", {
      configurable: true,
      value: originalReadyState,
    });
  });

  it("reports MongoDB as ready when the connection is open", () => {
    const originalReadyState = mongoose.connection.readyState;
    Object.defineProperty(mongoose.connection, "readyState", {
      configurable: true,
      value: 1,
    });

    expect(getReadinessStatus()).toEqual({
      ready: true,
      dependencies: { mongodb: "ok" },
    });

    Object.defineProperty(mongoose.connection, "readyState", {
      configurable: true,
      value: originalReadyState,
    });
  });
});
