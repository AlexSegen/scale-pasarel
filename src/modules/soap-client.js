import { soap as Soap } from "strong-soap";
import { soap as fakeSoap } from "./fake-soap.client.js";
import consola from "consola";
import { DICTIONARY } from "./pos.js";
import { getArgs, handlePOSResult } from "../helpers/utils.js";
import { CONFIG } from "../config.js";
import { Log } from './logger.js';

let soap;

//Soap Client
if (CONFIG.isDev) {
  soap = fakeSoap;
} else {
  soap = Soap;
}

const checkRequest = (data) => {
  const { VKORG, WERKS, SOAP_USER, SOAP_PASSWORD } = CONFIG;

  const url = "./service.wsdl";
  const requestArgs = {
    VKORG,
    WERKS,
    DATA: data,
  };

  const options = {};

  try {
    soap.createClient(url, options, (err, client) => {
      if (err) {
        console.error("Error creando cliente SOAP:", err);
        Log(err.message, 'createClient');
        return;
      }
  
      client.setSecurity(new soap.BasicAuthSecurity(SOAP_USER, SOAP_PASSWORD));
  
      function processData(
        posResult,
        { WERKS, VKORG, UNAME, POSID, DATUM, UZEIT, FUNC }
      ) {
        const args = {
          RESPONSE: {
            item: handlePOSResult(
              { WERKS, VKORG, UNAME, POSID, DATUM, UZEIT, FUNC },
              posResult
            ),
          },
        };
  
        console.log("ZRFC_BALANZA_DIGITAL_RESPONSE args", args.RESPONSE);
  
        client.ZRFC_BALANZA_DIGITAL_RESPONSE(args, async (err, _) => {
          try {
            
            if (err) {
              consola.error("Error en ZRFC_BALANZA_DIGITAL_RESPONSE:", err);
              Log(err.message, 'ZRFC_BALANZA_DIGITAL_RESPONSE');
              return;
            }
            consola.success("ZRFC_BALANZA_DIGITAL_RESPONSE exitoso");
  
            return;
  
          } catch (err) {
            consola.error('Ocurrió un error durante la ejecución de ZRFC_BALANZA_DIGITAL_RESPONSE', error);
            Log(err.message, 'ZRFC_BALANZA_DIGITAL_RESPONSE');
            return
          }
        });
      }
  
      client.ZRFC_BALANZA_DIGITAL_REQUEST(requestArgs, async (err, result) => {
        try {
          if (err) {
            consola.error("Error en ZRFC_BALANZA_DIGITAL_REQUEST:", err);
            Log(err.message, 'ZRFC_BALANZA_DIGITAL_REQUEST');
            return;
          }
          consola.success("ZRFC_BALANZA_DIGITAL_REQUEST exitoso", await result);
    
          const { REQUEST, SUBRC } = await result;
    
          if (SUBRC !== 0) return;
    
          if (!DICTIONARY[REQUEST.FUNC]) {
            consola.error("Código inválido: " + REQUEST.FUNC, err);
            return;
          }
    
          const postargs = getArgs(REQUEST.REQUEST);
    
          const posResult = await DICTIONARY[REQUEST.FUNC](...postargs);
          
          if (!posResult) {
            console.warn('El método del POS no arrojó resultados');
            return;
          }
    
          consola.info("___POS_RESULT___", posResult);
    
          processData(posResult, REQUEST);
    
          return;
          
        } catch (err) {
          consola.error('Ocurrió un error durante la ejecución de ZRFC_BALANZA_DIGITAL_REQUEST', err);
          Log(err.message, 'ZRFC_BALANZA_DIGITAL_REQUEST');
          return;
        }
      });
    });
    return;

  } catch (err) {
    consola.error('Error en [checkRequest]', err);
    return;
  }
};

export { checkRequest };
