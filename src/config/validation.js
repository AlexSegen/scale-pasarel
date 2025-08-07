import { ConfigurationError } from '../errors/CustomErrors.js';
import { logger } from '../services/LoggerService.js';

export class ConfigValidator {
  static validateRequired(config, requiredKeys) {
    const missing = [];
    
    for (const key of requiredKeys) {
      if (!config[key] || config[key].toString().trim() === '') {
        missing.push(key);
      }
    }
    
    if (missing.length > 0) {
      throw new ConfigurationError(
        `Missing required configuration keys: ${missing.join(', ')}`,
        missing[0]
      );
    }
  }

  static validateSerialPort(portName) {
    if (!portName) {
      throw new ConfigurationError('Serial port name is required');
    }

    // Basic port name validation
    const windowsPortPattern = /^COM\d+$/i;
    const unixPortPattern = /^\/dev\/(tty|cu)\./;
    
    if (!windowsPortPattern.test(portName) && !unixPortPattern.test(portName)) {
      logger.warn(`Serial port name '${portName}' may not be valid`, 'ConfigValidator');
    }
  }

  static validateBaudRate(baudRate) {
    const rate = parseInt(baudRate);
    const validRates = [110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200];
    
    if (isNaN(rate) || !validRates.includes(rate)) {
      throw new ConfigurationError(
        `Invalid baud rate: ${baudRate}. Valid rates: ${validRates.join(', ')}`
      );
    }
  }

  static validateUrl(url, fieldName) {
    if (!url) return; // Optional field
    
    try {
      new URL(url);
    } catch {
      throw new ConfigurationError(`Invalid URL format for ${fieldName}: ${url}`);
    }
  }

  static validateEnvironment(env) {
    const validEnvironments = ['development', 'production', 'test', 'MOCKS'];
    
    if (env && !validEnvironments.includes(env)) {
      logger.warn(`Unknown environment: ${env}. Valid: ${validEnvironments.join(', ')}`, 'ConfigValidator');
    }
  }

  static validateFullConfiguration(config) {
    logger.info('Validating application configuration', 'ConfigValidator');
    
    // Always required
    const commonRequired = ['WORKSTATION_ID'];
    this.validateRequired(config, commonRequired);
    
    // Production-specific validation
    if (!config.isDev) {
      const prodRequired = ['SOAP_USER', 'SOAP_PASSWORD'];
      this.validateRequired(config, prodRequired);
      
      this.validateUrl(config.SOAP_URL, 'SOAP_URL');
    }
    
    // Serial port validation
    this.validateSerialPort(config.SERIAL_PORT_NAME);
    this.validateBaudRate(config.BAUD_RATE);
    
    // Environment validation
    this.validateEnvironment(process.env.NODE_ENV);
    
    logger.info('Configuration validation completed successfully', 'ConfigValidator');
    
    return {
      valid: true,
      message: 'Configuration is valid',
      timestamp: new Date().toISOString()
    };
  }

  static getConfigSummary(config) {
    return {
      workstationId: config.WORKSTATION_ID,
      environment: config.isDev ? 'development (mocks)' : 'production',
      serialPort: config.SERIAL_PORT_NAME,
      baudRate: config.BAUD_RATE,
      soapUrl: config.SOAP_URL || 'local WSDL file',
      soapUser: config.SOAP_USER ? '***configured***' : 'not configured'
    };
  }
}