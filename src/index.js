import cron from "node-cron";
import consola from "consola";
import { SerialPort } from 'serialport';

import { CONFIG } from "./config.js";
import { checkRequest, downloadWSDL, Log } from "./modules";

const { isDev } = CONFIG;

function startApp() {
  try {

    if (!isDev) downloadWSDL();

   /*  SerialPort.list().then(ports => {
      consola.info('Puertos detectados:', ports.map(p => p.path));
    }); */

   cron.schedule("*/10 * * * * *", async () => {
    consola.info("CRON ejecutado:", new Date().toISOString());
    checkRequest();
  });

  } catch (err) {
    consola.error("startApp error", err.message);
    Log(err.message, "startApp");
    return;
  }
}

startApp();
