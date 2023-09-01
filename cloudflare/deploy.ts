import { CF_ACCOUNT_ID, CF_API_TOKEN } from "./env.ts";

const DENOFLARE_VERSION_TAG = "v0.5.12";
const DENOFLARE_MODULE_URL =
  `https://deno.land/x/denoflare@${DENOFLARE_VERSION_TAG}`;
const DENOFLARE_CONFIG_FILENAME = ".denoflare";
const DENOFLARE_SCRIPT_NAME = "lc-dailies";

if (import.meta.main) {
  await deploy();
}

/**
 * deploy deploys the cloudflare worker to cloudflare.
 *
 * https://deno.land/manual/advanced/deploying_deno/cloudflare_workers
 */
async function deploy() {
  // Create a temporary config file for denoflare CLI.
  const config = {
    $schema: `${DENOFLARE_MODULE_URL}/common/config.schema.json`,
    scripts: {
      [DENOFLARE_SCRIPT_NAME]: {
        path: "cloudflare/workers/daily.ts",
        localPort: 8080,
      },
    },
    profiles: {
      profile: {
        accountId: CF_ACCOUNT_ID,
        apiToken: CF_API_TOKEN,
      },
    },
  };
  await Deno.writeTextFile(
    DENOFLARE_CONFIG_FILENAME,
    JSON.stringify(config),
  );

  try {
    // Create a child process running denoflare CLI.
    const child = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "-A",
        "--unstable",
        `${DENOFLARE_MODULE_URL}/cli/cli.ts`,
        "push",
        DENOFLARE_SCRIPT_NAME,
      ],
      stdin: "piped",
      stdout: "piped",
    }).spawn();

    // Pipe the child process stdout to a writable file named "doc.json".
    await child.stdout.pipeTo(
      Deno.openSync(".result", { write: true, create: true }).writable,
    );
  } finally {
    // Delete the temporary config file.
    await Deno.remove(DENOFLARE_CONFIG_FILENAME);
  }
}
