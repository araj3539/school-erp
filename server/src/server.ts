import { startServer } from "./app.js";

let shuttingDown = false;
let closeServer: (() => Promise<void>) | undefined;

startServer()
  .then((lifecycle) => {
    closeServer = lifecycle.close;
  })
  .catch((error) => {
    console.error(JSON.stringify({
      event: "startup_error",
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }));
    process.exit(1);
  });

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(JSON.stringify({ event: "shutdown_started", signal }));

  try {
    if (closeServer) {
      await closeServer();
    }
    console.log(JSON.stringify({ event: "shutdown_completed", signal }));
    process.exit(0);
  } catch (error) {
    console.error(JSON.stringify({
      event: "shutdown_error",
      signal,
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    }));
    process.exit(1);
  }
}

process.once("SIGTERM", () => { void shutdown("SIGTERM"); });
process.once("SIGINT", () => { void shutdown("SIGINT"); });
