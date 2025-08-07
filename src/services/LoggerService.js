import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Función para obtener __dirname de manera robusta
function getDirname() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    return path.dirname(__filename);
  } catch (error) {
    return process.cwd();
  }
}

const __dirname = getDirname();

class LoggerService {
  constructor() {
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    this.currentLevel = this.logLevels.INFO;
    
    this.logsDir = this.getLogsDirectory();
    this.ensureLogsDirExists();
  }

  getLogsDirectory() {
    if (__dirname.includes('src')) {
      return path.join(__dirname, '../../logs');
    } else if (__dirname.includes('dist')) {
      return path.join(__dirname, '../logs');
    } else {
      return path.join(__dirname, 'logs');
    }
  }

  async ensureLogsDirExists() {
    try {
      await fs.access(this.logsDir);
    } catch {
      await fs.mkdir(this.logsDir, { recursive: true });
    }
  }

  setLevel(level) {
    if (this.logLevels[level] !== undefined) {
      this.currentLevel = this.logLevels[level];
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };
    return JSON.stringify(logEntry);
  }

  shouldLog(level) {
    return this.logLevels[level] <= this.currentLevel;
  }

  async writeToFile(level, formattedMessage) {
    const date = new Date().toISOString().split('T')[0];
    const filename = `app-${level.toLowerCase()}-${date}.log`;
    const filepath = path.join(this.logsDir, filename);
    
    try {
      await fs.appendFile(filepath, formattedMessage + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  async log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Console output with colors
    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[37m'  // White
    };
    
    console.log(`${colors[level]}[${level}]${'\x1b[0m'} ${message}`, meta.context ? `(${meta.context})` : '');
    
    // File output - only for ERROR level
    if (level === 'ERROR') {
      await this.writeToFile(level, formattedMessage);
    }
  }

  async error(message, error = null, context = null) {
    const meta = { context };
    if (error) {
      meta.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error.statusCode && { statusCode: error.statusCode }),
        ...(error.operation && { operation: error.operation }),
        ...(error.portName && { portName: error.portName })
      };
    }
    await this.log('ERROR', message, meta);
  }

  async warn(message, context = null) {
    await this.log('WARN', message, { context });
  }

  async info(message, context = null) {
    await this.log('INFO', message, { context });
  }

  async debug(message, context = null) {
    await this.log('DEBUG', message, { context });
  }

  // Compatibility method for existing Log function
  async logError(message, module, type = 'error') {
    await this.error(message, null, module);
  }
}

export const logger = new LoggerService();
export { LoggerService };