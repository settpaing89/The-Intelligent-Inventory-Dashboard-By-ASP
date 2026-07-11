type LogLevel = 'info' | 'warn' | 'error'

function log(level: LogLevel, event: string, data?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    data: data ?? {},
  }
  const consoleMethod =
    level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : console.info
  consoleMethod(entry)
}

export const logger = {
  info: (event: string, data?: Record<string, unknown>) =>
    log('info', event, data),
  warn: (event: string, data?: Record<string, unknown>) =>
    log('warn', event, data),
  error: (event: string, data?: Record<string, unknown>) =>
    log('error', event, data),
}
