import { ReadlineParser } from '@serialport/parser-readline';
import { SerialPort } from 'serialport';
import { ScaleError, ScaleTimeoutError, ScaleConnectionError } from '../errors/CustomErrors.js';
import { logger } from './LoggerService.js';

export class ScaleService {
  constructor(config = {}) {
    this.portName = config.portName;
    this.baudRate = config.baudRate;
    this.readTimeout = config.readTimeout || 5000;
    this.connectionTimeout = config.connectionTimeout || 3000;
    
    this.port = null;
    this.parser = null;
    this.isConnected = false;
    this.isReading = false;
  }

  async connect() {
    if (this.isConnected) {
      logger.warn('Scale already connected', 'ScaleService');
      return;
    }

    try {
      this.port = new SerialPort({
        path: this.portName,
        baudRate: Number(this.baudRate),
        autoOpen: false
      });

      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));
      
      await this.openPort();
      this.setupEventHandlers();
      this.isConnected = true;
      
      logger.info(`Connected to scale on port ${this.portName} at ${this.baudRate} baud`, 'ScaleService');
    } catch (error) {
      throw new ScaleConnectionError(this.portName, error);
    }
  }

  async openPort() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new ScaleTimeoutError(this.portName, this.connectionTimeout));
      }, this.connectionTimeout);

      this.port.open((error) => {
        clearTimeout(timeout);
        if (error) {
          reject(new ScaleConnectionError(this.portName, error));
        } else {
          resolve();
        }
      });
    });
  }

  setupEventHandlers() {
    this.port.on('error', (error) => {
      logger.error('Scale port error', error, 'ScaleService');
      this.isConnected = false;
    });

    this.port.on('close', () => {
      logger.info('Scale port closed', 'ScaleService');
      this.isConnected = false;
    });

    this.port.on('disconnect', () => {
      logger.warn('Scale disconnected', 'ScaleService');
      this.isConnected = false;
    });
  }

  async readWeight() {
    if (!this.isConnected) {
      throw new ScaleError('Scale not connected', this.portName);
    }

    if (this.isReading) {
      throw new ScaleError('Scale reading already in progress', this.portName);
    }

    this.isReading = true;
    const collectedData = [];

    try {
      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.isReading = false;
          reject(new ScaleTimeoutError(this.portName, this.readTimeout));
        }, this.readTimeout);

        const dataHandler = (data) => {
          const trimmedData = data.toString().trim();
          if (trimmedData) {
            collectedData.push(trimmedData);
            logger.debug(`Scale data received: ${trimmedData}`, 'ScaleService');
          }
        };

        this.parser.on('data', dataHandler);

        setTimeout(() => {
          clearTimeout(timeout);
          this.parser.removeListener('data', dataHandler);
          this.isReading = false;
          
          const result = this.processScaleData(collectedData);
          resolve(result);
        }, this.readTimeout);
      });
    } catch (error) {
      this.isReading = false;
      throw error;
    }
  }

  processScaleData(data) {
    if (!data || data.length === 0) {
      logger.warn('No data received from scale', 'ScaleService');
      return {
        weight: null,
        readings: [],
        readingsCount: 0
      };
    }

    // Get the last reading as the final weight
    const lastReading = data[data.length - 1];
    
    // Extract numeric weight from the reading
    // This assumes the weight is the first character/number in the reading
    // Adjust this logic based on your scale's data format
    const weight = this.extractWeight(lastReading);

    logger.info(`Scale reading completed: ${weight} (${data.length} readings)`, 'ScaleService');

    return {
      weight,
      readings: data,
      readingsCount: data.length,
      lastReading
    };
  }

  extractWeight(reading) {
    // This method should be customized based on your scale's data format
    // Current implementation matches the original logic (first character)
    if (!reading || typeof reading !== 'string') {
      return null;
    }
    
    // If the reading is a number, return it
    const numericWeight = parseFloat(reading);
    if (!isNaN(numericWeight)) {
      return numericWeight;
    }
    
    // If it's a string, extract the first character (original behavior)
    return reading;
  }

  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      if (this.port && this.port.isOpen) {
        await new Promise((resolve, reject) => {
          this.port.close((error) => {
            if (error) {
              reject(new ScaleError(`Failed to close port: ${error.message}`, this.portName));
            } else {
              resolve();
            }
          });
        });
      }
      
      this.isConnected = false;
      this.isReading = false;
      logger.info('Scale disconnected successfully', 'ScaleService');
    } catch (error) {
      logger.error('Error during scale disconnection', error, 'ScaleService');
      throw error;
    }
  }

  async readWeightWithAutoConnect() {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      const result = await this.readWeight();
      // TODO: Uncomment this after testing
      // await this.disconnect();
      
      return result;
    } catch (error) {
      // Ensure cleanup even if reading fails
      try {
        // TODO: Uncomment this after testing
        // await this.disconnect();
        console.log('readWeightWithAutoConnect', error);
      } catch (disconnectError) {
        logger.error('Failed to disconnect after read error', disconnectError, 'ScaleService');
      }
      throw error;
    }
  }

  // Static method to list available ports
  static async listAvailablePorts() {
    try {
      const ports = await SerialPort.list();
      return ports.map(port => ({
        path: port.path,
        manufacturer: port.manufacturer,
        serialNumber: port.serialNumber,
        pnpId: port.pnpId
      }));
    } catch (error) {
      throw new ScaleError('Failed to list serial ports', null, error);
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      isReading: this.isReading,
      portName: this.portName,
      baudRate: this.baudRate,
      readTimeout: this.readTimeout
    };
  }
}