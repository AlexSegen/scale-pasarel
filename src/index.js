import cron from "node-cron";
import consola from "consola";
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

import { CONFIG } from "./config.js";
import { checkRequest } from "./modules/soap-client.js";
import { downloadWSDL } from "./modules/httpclient.js";
import { Log } from "./modules/logger.js";

// serial
const portName = 'COM2';  // Cambia esto por tu puerto COM
const baudRate = 9600;    // Ajusta esto a la tasa de baudios de tu dispositivo (velocidad)

const port = new SerialPort({
  path: portName,
  baudRate: baudRate,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

function startListener() {
  if (CONFIG.isDev) {
    consola.info("--------- RUNNING MOCKS ---------");
  }

  try {
    port.on('open', () => {
      consola.success(`Conectado al puerto ${portName} / ${baudRate} baud.`);
    });

    parser.on('data', (data) => {
      consola.info(`Datos recibidos`, data);
      // checkRequest(data);
    });

    port.on('error', (err) => {
      consola.error('Error de conexión:', err.message);
      Log(err.message, "port on error");
    });

  } catch (err) {
    consola.error("Ocurrió un error", err);
    Log(err.message, "startApp");
  }
}

function startApp() {
  try {

    if (!CONFIG.isDev) downloadWSDL();

    cron.schedule("*/5 * * * * *", async () => {
      consola.info("CRON ejecutado:", new Date().toISOString());
      if (port.isOpen()) {
        console.success("App listening...");
        return;
      };

      SerialPort.list().then(ports => {
        consola.info('Puertos detectados:', ports.map(p => p.path));
      });

      startListener();
    });

  } catch (err) {
    console.log("startApp error", err.message);
    Log(err.message, "startApp");
    return;
  }
}

startApp();
