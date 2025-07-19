import consola from "consola";
import Transbank from "transbank-pos-sdk";
import { POSIntegrado as FakePOS } from "./fake-transbank-pos-sdk.js";
import { CONFIG } from "../config.js";
import { Log } from "./logger.js";
import { EMPTY_SALES_DETAILS } from '../helpers/constants.js';

let POS;
// Pos Instance
if (CONFIG.isDev) {
  POS = new FakePOS();
} else {
  POS = new Transbank.POSIntegrado();
}

class TransbankSalesDetailException extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

// Dictionary
const DICTIONARY = {
  "0800": () => POS.loadKeys(), // TRANSACCIÓN CARGA DE LLAVES
  "0100": () => POS.poll(), // TRANSACCIÓN DE POLLING
  "0250": () => POS.getLastSale(), // TRANSACCIÓN ÚLTIMA VENTA
  "0500": () => POS.closeDay(), // TRANSACCIÓN DE CIERRE
  "0700": () => POS.getTotals(), // DETALLE DE VENTAS
  "0300": () => POS.changeToNormalMode(), // CAMBIO DE MODALIDAD A POS NORMAL
  "0260": async (printOnPos) => {
    consola.info(`printOnPos: ${printOnPos}`);
    try {
      if (POS.waiting) {
        POS.waiting = false;
      }

      const posResult = await POS.salesDetail(printOnPos);

      POS.waiting = false;
      
      if (Array.isArray(posResult) && !posResult?.length) {
        return EMPTY_SALES_DETAILS;
      };

      return posResult;

    } catch (err) {
      Log(err.message, "salesDetail");

      if (err instanceof TransbankSalesDetailException) {
        consola.error(
          "Ocurrió un error en el método [salesDetail] de tipo [TransbankSalesDetailException]: ",
          err.message
        );
        return null;
      } else {
        consola.error(
          "Ocurrió un error en el método [salesDetail]",
          err.message
        );
        return null;
      }
    }
  }, // TRANSACCIÓN TOTALES
  "0200": (amount, ticket, sendStatus, callback) => {
    consola.info(
      `amount: ${amount}, ticket: ${ticket}, sendStatus: ${sendStatus}, callback: ${callback}`
    );
    return POS.sale(amount, ticket, sendStatus, callback);
  }, // TRANSACCIONES DE VENTA
  "1200": (operationId) => POS.refund(operationId), // TRANSACCIÓN ANULACIÓN VENTA
};

export { POS, DICTIONARY };
