import { spawn, type ChildProcess } from "node:child_process";

const viteArgs = process.argv.slice(2);
const children: ChildProcess[] = [];

const backend = spawnNpm(["run", "backend:dev"], {
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: process.env.WGF_BACKEND_PORT ?? "8787"
  }
});
children.push(backend);

const vite = spawnNpm(["run", "dev", "--", ...viteArgs], {
  stdio: "inherit",
  env: process.env
});
children.push(vite);

for (const child of children) {
  child.on("exit", (code) => {
    shutdown(child);

    if (code && code !== 0) {
      process.exitCode = code;
    }
  });
}

function shutdown(source?: ChildProcess): void {
  for (const child of children) {
    if (child !== source && !child.killed) {
      child.kill();
    }
  }
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});
process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

function spawnNpm(args: string[], options: Parameters<typeof spawn>[2]): ChildProcess {
  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/d", "/s", "/c", "npm", ...args], options);
  }

  return spawn("npm", args, options);
}
