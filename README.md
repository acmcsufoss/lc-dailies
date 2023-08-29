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

The daily webhook is invoked by making a POST request to the `/daily/:token`
endpoint.

Set up a cron job to make the request at the desired time. Supabase supports
cron jobs via the
[pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
extension.

```sql
select cron.unschedule('lc-daily');

select
  cron.schedule(
    'lc-daily',
    '0 0 * * *', -- https://crontab.guru/#0_0_*_*_*
    $$
    select
      net.http_post(
          url:='...',
      ) as request_id;
    $$
  );
```

---

Developed with 💖 by [**@acmcsufoss**](https://oss.acmcsuf.com/)
