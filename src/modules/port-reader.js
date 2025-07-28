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

  processCollectedData(data) {
    if (data?.length === 0) {
        consola.info('⏰ Escuchando datos de la balanza...');
        return {
          data: [],
          lastValue: null,
        };
      }
      console.log('🔄 Procesando datos de los últimos 5 segundos:');
      const lastValue = data[data.length - 1];
      return {
        data,
        lastValue
      };
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
        resolve(callback(this.collectedData));
      });
    });
  }

  async onError(callback) {
    this.port.on('error', callback);
  }

  async onOpen(callback) {
      return new Promise((resolve, reject) => {
        this.port.on('open', () => {
          console.log(`Conectado al puerto ${this.PORT_NAME} / ${this.BAUD_RATE} baud.`);

          setInterval(() => {
            const { data, lastValue, error } = this.processCollectedData(this.collectedData);
            this.collectedData = [];
            resolve(callback({data, lastValue, error}));
          }, 10000);
        });
      });
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