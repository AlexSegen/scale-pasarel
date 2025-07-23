import { ReadlineParser } from '@serialport/parser-readline';
import { SerialPort } from 'serialport';
import { CONFIG } from '../config.js';

class PortReader {
  constructor() {
    this.port = undefined;
    this.parser = undefined;
  }

  init() {
    this.port = new SerialPort({
        path: CONFIG.SERIAL_PORT_NAME,
        baudRate: Number(CONFIG.BAUD_RATE),
    });

    this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));
  }

  async open() {
    await this.port.open();
  }

  async close() {
    await this.port.close();
  }

  async onData(callback) {
    this.parser.on('data', callback);
  }

  async onError(callback) {
    this.port.on('error', callback);
  }

  async onOpen(callback) {
    this.port.on('open', callback);
  }

  async onClose(callback) {
    this.port.on('close', callback);
  }

  async onDisconnect(callback) {
    this.port.on('disconnect', callback);
  }

  async onTimeout(callback) {
    this.port.on('timeout', callback);
  }
}

export { PortReader };