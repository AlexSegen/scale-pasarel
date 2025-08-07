// Legacy exports - kept for backward compatibility
export * from './httpclient.js';
export * from './fake-soap.client.js';

// Legacy logger export for backward compatibility  
export { Log } from './logger.js';

// Download WSDL function (still used by new architecture)
export { downloadWSDL } from './httpclient.js';

// Re-export new services for easy access
export { ApplicationService } from '../services/ApplicationService.js';
export { SoapService } from '../services/SoapService.js';
export { ScaleService } from '../services/ScaleService.js';
export { logger, LoggerService } from '../services/LoggerService.js';

// Error classes export
export * from '../errors/CustomErrors.js';

// Configuration validation
export { ConfigValidator } from '../config/validation.js';