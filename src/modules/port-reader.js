import { ReadlineParser } from '@serialport/parser-readline';
import { SerialPort } from 'serialport';
import consola from "consola";

class PortReader {

  constructor() {
    this.port;
    this.parser;
    this.isOpen = false;
    this.collectedData = [];
    this.PORT_NAME;
    this.BAUD_RATE;
  }

  init(PORT_NAME, BAUD_RATE) {
    this.port = new SerialPort({
        path: PORT_NAME,
        baudRate: Number(BAUD_RATE),
    });

    this.PORT_NAME = PORT_NAME;
    this.BAUD_RATE = BAUD_RATE;

    this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));
  }

  async open() {
    await this.port.open();
    this.isOpen = true;
  }

  async close() {
    await this.port.close();
    this.isOpen = false;
  }

  async onData(callback) {
    return new Promise((resolve, reject) => {
      this.parser.on('data', (data) => {
        this.collectedData.push(data.toString().trim());
      });

      return setTimeout(() => {
        const { data, lastValue } = this.processCollectedData(this.collectedData);
        this.collectedData = [];
        return resolve(callback({data, lastValue}));
      }, 5000);
    });
  }

  processCollectedData = data => {
    if (!data || data?.length === 0) {
      consola.warn('Sin datos de la balanza...');
      return {
        data: [],
        lastValue: null,
      };
    }
    const lastValue = data[data.length - 1];
    return {
      data,
      lastValue: lastValue[0]
    };
  }

  async onOpen(callback) {
    return new Promise((resolve, reject) => {
      this.port.on('open', (err) => {
        consola.info(`⏰Escuchando balanza digital en puerto ${this.PORT_NAME} / ${this.BAUD_RATE} baud.`);
        resolve({ error: err });
      });
    });
  }

  async onError(callback) {
    this.port.on('error', callback);
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