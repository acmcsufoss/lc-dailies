const DENOFLARE_CONFIG_FILENAME = ".denoflare";

/**
 * DENOFLARE_VERSION_TAG is the version tag of denoflare.
 */
export const DENOFLARE_VERSION_TAG = "v0.5.12";

/**
 * DenoflareOptions is the options for denoflare.
 */
export interface DenoflareOptions {
  versionTag: string;
  scriptName: string;
  path: string;
  cfAccountID: string;
  cfAPIToken: string;
  localPort: number;
  subcommand: "push" | "serve";
}

/**
 * denoflare is a helper for interfacing with the denoflare CLI.
 *
 * See: https://denoflare.dev/cli/
 */
export async function denoflare(options: DenoflareOptions) {
  const moduleURL = `https://deno.land/x/denoflare@${options.versionTag}`;
  const config = {
    $schema: `${moduleURL}/common/config.schema.json`,
    scripts: {
      [options.scriptName]: {
        path: options.path,
        localPort: options.localPort,
      },
    },
    profiles: {
      profile: {
        accountId: options.cfAccountID,
        apiToken: options.cfAPIToken,
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
        `${moduleURL}/cli/cli.ts`,
        options.subcommand,
        options.scriptName,
      ],
      stdin: "piped",
      stdout: "piped",
    }).spawn();

    // Pipe the child process stdout to stdout.
    await child.stdout.pipeTo(Deno.stdout.writable);
  } finally {
    // Delete the temporary config file.
    await Deno.remove(DENOFLARE_CONFIG_FILENAME);
  }
}
