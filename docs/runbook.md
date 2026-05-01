# Coach Claude — Operational Runbook

## First-time Fly.io deploy

```bash
flyctl auth login
cd /path/to/coach-claude
flyctl launch --no-deploy --copy-config --name coach-claude --region yul
flyctl volumes create coach_data --region yul --size 1
TOKEN=$(./scripts/gen-token.sh)
echo "Save this token: $TOKEN"
flyctl secrets set BEARER_TOKEN="$TOKEN"
flyctl deploy --remote-only
flyctl status
```

After first deploy, hit `https://coach-claude.fly.dev/health` to confirm.

## CI / CD

- `.github/workflows/ci.yml` — runs lint+typecheck+test+build on every PR and push to `main`
- `.github/workflows/deploy.yml` — deploys to Fly.io on push to `main`. Requires `FLY_API_TOKEN` secret.

To set the deploy token:
```bash
flyctl tokens create deploy -x 999999h
# Copy output, paste into: GitHub → repo → Settings → Secrets and variables → Actions → New: FLY_API_TOKEN
```

## Token rotation

```bash
NEW_TOKEN=$(./scripts/gen-token.sh)
flyctl secrets set BEARER_TOKEN="$NEW_TOKEN"
# Update PWA Settings (Settings page in app) with the new token
# Update Claude project's MCP connector authorization with the new token
```

## DB restore

```bash
# Backup (manual, run monthly)
flyctl ssh console -C "sqlite3 /data/coach.db '.backup /data/backup.db'"
flyctl ssh sftp shell <<EOF
get /data/backup.db ~/coach-backups/coach-$(date +%Y%m%d-%H%M%S).db
EOF

# Restore
flyctl ssh sftp shell <<EOF
put ~/coach-backups/coach-YYYYMMDD-HHMMSS.db /data/coach.db
EOF
flyctl machine restart
```

## Logs

```bash
flyctl logs               # live tail
flyctl logs --no-tail | tail -100   # recent
flyctl status             # machines + volume + checks
```

## Scale to zero

`fly.toml` has `auto_stop_machines = "stop"` and `min_machines_running = 0`. Idle machines sleep ~5 minutes; first request after wakes in ~1s. No action needed.

## Claude project setup (Phase 9)

Documented separately when Phase 9 lands.
