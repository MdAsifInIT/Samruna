import { pathToFileURL } from "node:url";
import { createServerAiProvider } from "./ai";
import { createWorkspaceService } from "./workspace";

function runCli(command = process.argv[2] ?? "help"): void {
  if (!["seed", "reset", "export", "health"].includes(command)) {
    console.log("Usage: tsx server/cli.ts seed|reset|export|health");
    return;
  }

  const service = createWorkspaceService(undefined, createServerAiProvider());

  try {
    if (command === "seed" || command === "reset") {
      const snapshot = service.reset();
      console.log(JSON.stringify(snapshot.state, null, 2));
    } else if (command === "export") {
      console.log(service.export());
    } else if (command === "health") {
      console.log(JSON.stringify(service.health(), null, 2));
    }
  } finally {
    service.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
