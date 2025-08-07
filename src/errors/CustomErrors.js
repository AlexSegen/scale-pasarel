export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ConfigurationError extends AppError {
  constructor(message, missingKey = null) {
    super(`Configuration Error: ${message}`, 500);
    this.missingKey = missingKey;
  }
}

export class SoapError extends AppError {
  constructor(message, operation = null, soapCode = null) {
    super(`SOAP Error: ${message}`, 502);
    this.operation = operation;
    this.soapCode = soapCode;
  }
}

export class ScaleError extends AppError {
  constructor(message, portName = null, errorCode = null) {
    super(`Scale Error: ${message}`, 503);
    this.portName = portName;
    this.errorCode = errorCode;
  }
}

export class ScaleTimeoutError extends ScaleError {
  constructor(portName, timeout) {
    super(`Scale reading timeout after ${timeout}ms`, portName, 'TIMEOUT');
    this.timeout = timeout;
  }
}

export class ScaleConnectionError extends ScaleError {
  constructor(portName, cause) {
    super(`Failed to connect to scale on port ${portName}`, portName, 'CONNECTION_FAILED');
    this.cause = cause;
  }
}

export class SoapConnectionError extends SoapError {
  constructor(url, cause) {
    super(`Failed to connect to SOAP service at ${url}`, null, 'CONNECTION_FAILED');
    this.url = url;
    this.cause = cause;
  }
}

export class SoapAuthenticationError extends SoapError {
  constructor(user) {
    super(`SOAP authentication failed for user: ${user}`, null, 'AUTH_FAILED');
    this.user = user;
  }
}