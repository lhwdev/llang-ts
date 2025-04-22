export interface Logger {
  log(line: string): void;
}

export const ConsoleLogger: Logger = {
  log(line) {
    console.log(line);
  },
};

let currentLogger: Logger = ConsoleLogger;

export function log(line: string) {
  currentLogger.log(line);
}

export function withLogger<R>(logger: Logger, fn: () => R): R {
  const previous = currentLogger;
  try {
    currentLogger = logger;
    return fn();
  } finally {
    currentLogger = previous;
  }
}
