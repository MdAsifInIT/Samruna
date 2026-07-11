import { mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";

const port = "4174";
const dbPath = resolve(process.cwd(), ".samruna", "backup-demo.sqlite");
const childEnvironment = { ...process.env };

delete childEnvironment.OPENAI_API_KEY;
Object.assign(childEnvironment, {
  HOST: "127.0.0.1",
  PORT: port,
  SAMRUNA_DB_PATH: dbPath,
  SAMRUNA_SERVE_STATIC: "1"
});

let activeChild;
let shutdownSignal;

function spawnChild(command, args) {
  return new Promise((resolveChild, rejectChild) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: childEnvironment,
      stdio: "inherit"
    });

    activeChild = child;
    child.once("error", rejectChild);
    child.once("close", (code, signal) => {
      activeChild = undefined;
      resolveChild({ code: code ?? (signal ? 1 : 0), signal });
    });
  });
}

function runNpm(args) {
  const npmEntryPoint = process.env.npm_execpath;
  return npmEntryPoint
    ? spawnChild(process.execPath, [npmEntryPoint, ...args])
    : spawnChild(process.platform === "win32" ? "npm.cmd" : "npm", args);
}

function removeBackupDatabase() {
  mkdirSync(dirname(dbPath), { recursive: true });
  for (const suffix of ["", "-shm", "-wal"]) {
    rmSync(`${dbPath}${suffix}`, { force: true });
  }
}

function requestShutdown(signal) {
  if (shutdownSignal) return;
  shutdownSignal = signal;

  if (activeChild && activeChild.exitCode === null) {
    activeChild.kill(signal);
    const forceExit = setTimeout(() => {
      if (activeChild && activeChild.exitCode === null) activeChild.kill("SIGKILL");
    }, 5_000);
    forceExit.unref();
  }
}

process.on("SIGINT", () => requestShutdown("SIGINT"));
process.on("SIGTERM", () => requestShutdown("SIGTERM"));

async function main() {
  console.log("Building the deterministic backup demo...");
  const build = await runNpm(["run", "build"]);
  if (build.code !== 0) throw new Error(`Build failed with exit code ${build.code}.`);

  removeBackupDatabase();
  console.log(`Resetting deterministic state in ${dbPath}...`);
  const reset = await spawnChild(process.execPath, ["--import", "tsx", "server/cli.ts", "reset"]);
  if (reset.code !== 0) throw new Error(`Demo reset failed with exit code ${reset.code}.`);

  if (shutdownSignal) return;
  console.log(`Starting the deterministic full-stack backup at http://127.0.0.1:${port}`);
  const server = await spawnChild(process.execPath, [
    "--import",
    "tsx",
    "server/index.ts",
    "--serve-static",
    "--port",
    port
  ]);

  if (!shutdownSignal && server.code !== 0) {
    throw new Error(`Backup demo exited with code ${server.code}.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
