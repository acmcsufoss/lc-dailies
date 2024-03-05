# lc-dailies

Daily Leetcode challenges for members to practice their algorithms.

## Development

For running the server locally, run this command.

```sh
deno task start
```

For formatting, linting, updating dependencies, and updating the lock file run
this command.

```sh
deno task all
```

## Deployment

The server is automatically deployed on push to the `main` branch via
[Deno Deploy](https://deno.com/deploy).

### Daily webhook invocation

The daily webhook is invoked by a daily Deno Cron job.

---

Developed with 💖 by [**@acmcsufoss**](https://oss.acmcsuf.com/)
