/**
 * Logger estructurado para GoalApp Mobile
 *
 * Niveles de logging:
 * - debug: Solo en desarrollo
 * - info: Información general
 * - warn: Advertencias
 * - error: Errores
 *
 * En producción solo se muestran warn y error
 */

import { ENV } from '../constants/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  metadata?: Record<string, unknown>;
}

const LOG_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// En producción solo warn/error
const MIN_LEVEL: LogLevel = __DEV__ ? 'debug' : 'warn';

function shouldLog(level: LogLevel): boolean {
  return LOG_ORDER[level] >= LOG_ORDER[MIN_LEVEL];
}

function formatLog(context: LogContext): string {
  const metadata = context.metadata ? ` | ${JSON.stringify(context.metadata)}` : '';
  return `[${context.timestamp}] [${context.level.toUpperCase()}] [${context.category}] ${context.message}${metadata}`;
}

function log(level: LogLevel, category: string, message: string, metadata?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  if (!ENV.ENABLE_LOGS) return;

  const context: LogContext = {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    metadata,
  };

  const formatted = formatLog(context);

  switch (level) {
    case 'debug':
      console.debug(formatted);
      break;
    case 'info':
      console.info(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }
}

export const logger = {
  debug: (category: string, message: string, metadata?: Record<string, unknown>) =>
    log('debug', category, message, metadata),
  info: (category: string, message: string, metadata?: Record<string, unknown>) =>
    log('info', category, message, metadata),
  warn: (category: string, message: string, metadata?: Record<string, unknown>) =>
    log('warn', category, message, metadata),
  error: (category: string, message: string, metadata?: Record<string, unknown>) =>
    log('error', category, message, metadata),
};
