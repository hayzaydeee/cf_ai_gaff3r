// Structured logger — emits JSON lines to console (Workers Logs / Logpush compatible)
// All events include: ts, event, and any additional fields.
// Severity: 'info' | 'warn' | 'error'

export type LogEvent =
  | 'prediction_made'
  | 'prediction_resolved'
  | 'snapshot_captured'
  | 'dc_fit_completed'
  | 'sign_in'
  | 'injection_blocked'
  | 'rate_limit_hit'
  | 'migration_completed'
  | 'stream_error'
  | 'cron_started'
  | 'cron_completed';

type Severity = 'info' | 'warn' | 'error';

export function log(
  event: LogEvent,
  data: Record<string, unknown> = {},
  severity: Severity = 'info',
): void {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    severity,
    event,
    ...data,
  });

  if (severity === 'error') console.error(entry);
  else if (severity === 'warn') console.warn(entry);
  else console.log(entry);
}
