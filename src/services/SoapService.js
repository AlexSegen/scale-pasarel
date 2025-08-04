import { soap as Soap } from "strong-soap";
import { soap as fakeSoap } from "../modules/fake-soap.client.js";
import { SoapError, SoapConnectionError, SoapAuthenticationError } from '../errors/CustomErrors.js';
import { logger } from './LoggerService.js';
import { cleanScaleData } from '../helpers/utils.js';

export class SoapService {
  constructor(config = {}) {
    this.config = config;
    this.client = null;
    this.isConnected = false;
    this.connectionRetries = config.retries || 3;
    this.retryDelay = config.retryDelay || 1000;
    
    // Choose between real SOAP or mock based on environment
    this.soapLib = config.isDev ? fakeSoap : Soap;
  }

  async connect() {
    if (this.isConnected && this.client) {
      return this.client;
    }

    const maxRetries = this.connectionRetries;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Attempting SOAP connection (${attempt}/${maxRetries})`, 'SoapService');
        
        this.client = await this.createClient();
        this.setupAuthentication();
        this.isConnected = true;
        
        logger.info('SOAP client connected successfully', 'SoapService');
        return this.client;
      } catch (error) {
        lastError = error;
        logger.warn(`SOAP connection attempt ${attempt} failed: ${error.message}`, 'SoapService');
        
        if (attempt < maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw new SoapConnectionError(this.config.wsdlUrl || './service.wsdl', lastError);
  }

  async createClient() {
    return new Promise((resolve, reject) => {
      // TODO: Uncomment this after testing
      const url = "./service.wsdl" //this.config.wsdlUrl || "./service.wsdl";
      const options = this.config.soapOptions || {};

      this.soapLib.createClient(url, options, (err, client) => {
        if (err) {
          reject(new SoapConnectionError(url, err));
        } else {
          resolve(client);
        }
      });
    });
  }

  setupAuthentication() {
    if (!this.client) {
      throw new SoapError('Client not initialized');
    }

    if (this.config.soapUser && this.config.soapPassword) {
      try {
        const security = new this.soapLib.BasicAuthSecurity(
          this.config.soapUser, 
          this.config.soapPassword
        );
        this.client.setSecurity(security);
        logger.debug('SOAP authentication configured', 'SoapService');
      } catch (error) {
        throw new SoapAuthenticationError(this.config.soapUser);
      }
    }
  }

  async requestScaleReading(workstationId) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const requestArgs = {
        PARAMID: workstationId,
      };

      logger.debug(`Requesting scale reading for workstation: ${workstationId}`, 'SoapService');

      const result = await this.callSoapMethod('ZRFC_BALANZA_DIGITAL_REQUEST', requestArgs);
      
      if (!result) {
        throw new SoapError('Empty response from ZRFC_BALANZA_DIGITAL_REQUEST', 'ZRFC_BALANZA_DIGITAL_REQUEST');
      }

      const { REQUEST, SUBRC } = result;

      if (SUBRC !== 0) {
        logger.info(`No scale reading request pending (SUBRC: ${SUBRC})`, 'SoapService');
        return null;
      }

      logger.info('Scale reading request received from SAP', 'SoapService');
      return REQUEST;
    } catch (error) {
      if (error instanceof SoapError) {
        throw error;
      }
      throw new SoapError(error.message, 'ZRFC_BALANZA_DIGITAL_REQUEST');
    }
  }

  async sendScaleResponse(scaleData, requestData) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const { PARAMID, DATUM, UZEIT } = requestData;
      
      const responseArgs = {
        RESPONSE: {
          PARAMID,
          DATUM,
          UZEIT,
          RESPONSE: scaleData.weight ? cleanScaleData(scaleData.weight) : scaleData
        },
      };

      logger.debug(`Sending scale response: ${JSON.stringify(responseArgs.RESPONSE)}`, 'SoapService');

      await this.callSoapMethod('ZRFC_BALANZA_DIGITAL_RESPONSE', responseArgs);
      
      logger.info('Scale response sent to SAP successfully', 'SoapService');
      return true;
    } catch (error) {
      if (error instanceof SoapError) {
        throw error;
      }
      throw new SoapError(error.message, 'ZRFC_BALANZA_DIGITAL_RESPONSE');
    }
  }

  async callSoapMethod(methodName, args) {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new SoapError('Client not connected'));
        return;
      }

      if (!this.client[methodName]) {
        reject(new SoapError(`SOAP method ${methodName} not found`));
        return;
      }

      this.client[methodName](args, (err, result) => {
        if (err) {
          reject(new SoapError(err.message, methodName));
        } else {
          resolve(result);
        }
      });
    });
  }

  async disconnect() {
    if (this.client) {
      // Most SOAP clients don't have explicit disconnect methods
      // But we can clean up our references
      this.client = null;
      this.isConnected = false;
      logger.info('SOAP client disconnected', 'SoapService');
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      isDev: this.config.isDev,
      wsdlUrl: this.config.wsdlUrl || './service.wsdl',
      user: this.config.soapUser
    };
  }

  // Health check method
  async healthCheck() {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return {
        status: 'healthy',
        connected: this.isConnected,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}