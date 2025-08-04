import cron from "node-cron";
import { SoapService } from './SoapService.js';
import { ScaleService } from './ScaleService.js';
import { logger } from './LoggerService.js';
import { AppError, ConfigurationError } from '../errors/CustomErrors.js';
import { ConfigValidator } from '../config/validation.js';

export class ApplicationService {
  constructor(config) {
    this.config = config;
    this.cronJob = null;
    this.isRunning = false;
    this.shutdownSignalReceived = false;
    
    // Initialize services
    this.soapService = new SoapService({
      isDev: config.isDev,
      soapUser: config.SOAP_USER,
      soapPassword: config.SOAP_PASSWORD,
      wsdlUrl: config.SOAP_URL,
      retries: 3,
      retryDelay: 1000
    });

    this.scaleService = new ScaleService({
      portName: config.SERIAL_PORT_NAME,
      baudRate: config.BAUD_RATE,
      readTimeout: 5000,
      connectionTimeout: 3000
    });

    this.setupProcessHandlers();
  }

  setupProcessHandlers() {
    // Graceful shutdown handlers
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    
    // Unhandled errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', error, 'ApplicationService');
      this.gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`, null, 'ApplicationService');
    });
  }

  async start() {
    try {
      logger.info('Starting Scale Pasarel Application', 'ApplicationService');
      
      await this.validateConfiguration();
      await this.initializeServices();
      this.startCronJob();
      
      this.isRunning = true;
      logger.info('Application started successfully', 'ApplicationService');
    } catch (error) {
      logger.error('Failed to start application', error, 'ApplicationService');
      throw error;
    }
  }

  async validateConfiguration() {
    try {
      const validationResult = ConfigValidator.validateFullConfiguration(this.config);
      const configSummary = ConfigValidator.getConfigSummary(this.config);
      
      logger.info('Configuration summary:', 'ApplicationService');
      logger.info(JSON.stringify(configSummary, null, 2), 'ApplicationService');
      
      return validationResult;
    } catch (error) {
      logger.error('Configuration validation failed', error, 'ApplicationService');
      throw error;
    }
  }

  async initializeServices() {
    try {
      // Initialize SOAP service
      await this.soapService.connect();
      
      // List available serial ports for debugging
      if (this.config.isDev || process.env.DEBUG_PORTS) {
        const ports = await ScaleService.listAvailablePorts();
        logger.info(`Available ports: ${ports.map(p => p.path).join(', ')}`, 'ApplicationService');
      }

      logger.info('Services initialized successfully', 'ApplicationService');
    } catch (error) {
      logger.error('Failed to initialize services', error, 'ApplicationService');
      throw error;
    }
  }

  startCronJob() {
    if (this.cronJob) {
      this.cronJob.stop();
    }

    // Run every 10 seconds
    this.cronJob = cron.schedule("*/10 * * * * *", async () => {
      if (this.shutdownSignalReceived) {
        return;
      }

      const startTime = Date.now();
      logger.debug(`Cron job started: ${new Date().toISOString()}`, 'ApplicationService');
      
      try {
        await this.processScaleRequest();
      } catch (error) {
        logger.error('Error processing scale request', error, 'ApplicationService');
      } finally {
        const duration = Date.now() - startTime;
        logger.debug(`Cron job completed in ${duration}ms`, 'ApplicationService');
      }
    }, {
      scheduled: true,
      timezone: "America/Santiago" // Adjust based on your timezone
    });

    logger.info('Cron job scheduled to run every 10 seconds', 'ApplicationService');
  }

  async processScaleRequest() {
    try {
      // Step 1: Check for pending scale requests in SAP
      const scaleRequest = await this.soapService.requestScaleReading(this.config.WORKSTATION_ID);
      
      if (!scaleRequest) {
        logger.debug('No pending scale requests', 'ApplicationService');
        return;
      }

      logger.info('Processing scale request from SAP', 'ApplicationService');

      // Step 2: Read weight from scale
      const scaleData = await this.scaleService.readWeightWithAutoConnect();
      
      if (!scaleData.weight) {
        await this.soapService.sendScaleResponse('E002', scaleRequest);
        logger.warn('No weight data received from scale', 'ApplicationService');
        return;
      }

      if (scaleData.weight && scaleData.weight === '000.000') {
        await this.soapService.sendScaleResponse('E003', scaleRequest);
        logger.warn('Scale is empty', 'ApplicationService');
        return;
      }

      logger.info(`Weight reading obtained: ${scaleData.weight}`, 'ApplicationService');

      // Step 3: Send response back to SAP
      await this.soapService.sendScaleResponse(scaleData, scaleRequest);
      
      logger.info('Scale request processed successfully', 'ApplicationService');
      
    } catch (error) {
      // Error handling is done by the caller (cron job)
      await this.soapService.sendScaleResponse('E001', scaleRequest);
      throw error;
    }
  }

  async gracefulShutdown(signal) {
    if (this.shutdownSignalReceived) {
      logger.warn('Shutdown already in progress', 'ApplicationService');
      return;
    }

    this.shutdownSignalReceived = true;
    logger.info(`Received ${signal}, starting graceful shutdown`, 'ApplicationService');

    try {
      // Stop cron job
      if (this.cronJob) {
        this.cronJob.stop();
        logger.info('Cron job stopped', 'ApplicationService');
      }

      // Disconnect services
      await this.soapService.disconnect();
      await this.scaleService.disconnect();
      
      this.isRunning = false;
      logger.info('Application shutdown completed', 'ApplicationService');
      
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', error, 'ApplicationService');
      process.exit(1);
    }
  }

  async getHealthStatus() {
    const soapHealth = await this.soapService.healthCheck();
    const scaleStatus = this.scaleService.getStatus();

    return {
      application: {
        status: this.isRunning ? 'running' : 'stopped',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      },
      soap: soapHealth,
      scale: {
        ...scaleStatus,
        status: scaleStatus.isConnected ? 'connected' : 'disconnected'
      },
      configuration: {
        workstationId: this.config.WORKSTATION_ID,
        isDev: this.config.isDev,
        serialPort: this.config.SERIAL_PORT_NAME,
        baudRate: this.config.BAUD_RATE
      }
    };
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      cronJobActive: this.cronJob ? this.cronJob.running : false,
      shutdownSignalReceived: this.shutdownSignalReceived,
      services: {
        soap: this.soapService.getStatus(),
        scale: this.scaleService.getStatus()
      }
    };
  }
}