# AthleteOS Monitoring Stack

This directory contains the local monitoring and observability stack for AthleteOS:

- Prometheus for metrics and alert evaluation
- Grafana for dashboards
- Loki + Promtail for structured log aggregation
- Alertmanager for Slack and PagerDuty routing

## Local access

When the stack is running through `docker compose up`, the local endpoints are:

- API metrics: `http://localhost:8000/metrics`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`
- Loki: `http://localhost:3100`
- Alertmanager: `http://localhost:9093`

Grafana defaults:

- Username: `admin`
- Password: `admin` unless overridden with `GF_SECURITY_ADMIN_PASSWORD`

## Dashboards

Provisioned dashboards live under `grafana/dashboards/`:

- `API Overview`
- `AthleteOS Business Metrics`
- `Celery Worker Health`
- `Logs Overview`

Grafana provisioning files automatically load Prometheus and Loki as datasources plus all dashboard JSON files on startup.

## PagerDuty and Slack setup

Alertmanager configuration uses environment-variable placeholders:

- `PAGERDUTY_ROUTING_KEY`
- `SLACK_WEBHOOK_URL`

To enable routing:

1. Create a PagerDuty Events API v2 integration and copy the routing key.
2. Create a Slack incoming webhook for your alerts channel.
3. Export both variables in the environment used by Alertmanager before starting the stack.

Critical alerts route to PagerDuty and warning alerts route to Slack.

## Notes

- The `/metrics` endpoint is intentionally restricted to internal callers only.
- Application logs are JSON-formatted with sensitive fields redacted for DPDP compliance.
- `promtail.yml` assumes Docker JSON log files are available at `/var/lib/docker/containers`.
