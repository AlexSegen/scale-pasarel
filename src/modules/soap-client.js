import { soap as Soap } from "strong-soap";
import { soap as fakeSoap } from "./fake-soap.client.js";
import consola from "consola";
import { CONFIG } from "../config.js";
import { Log } from './logger.js';
import { PortReader } from './port-reader.js';

let soap;

//Soap Client
if (CONFIG.isDev) {
  soap = fakeSoap;
} else {
  soap = Soap;
}

const checkRequest = () => {
  const { SOAP_USER, SOAP_PASSWORD, WORKSTATION_ID } = CONFIG;

  const url = "./service.wsdl";
  const requestArgs = {
    PARAMID: WORKSTATION_ID,
  };

  const portReader = new PortReader();

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
        posResult, // peso char
        { PARAMID, DATUM, UZEIT }
      ) {
        const args = {
          RESPONSE: {
            PARAMID,
            DATUM,
            UZEIT,
            RESPONSE: posResult
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
          // consola.success("ZRFC_BALANZA_DIGITAL_REQUEST exitoso", await result);
    
          const { REQUEST, SUBRC } = await result;
    
          if (SUBRC !== 0) return;
          
                   
          if(portReader.port?.isOpen) {
            consola.warn('Puerto ya está abierto');
            return;
          }

          portReader.init(CONFIG.SERIAL_PORT_NAME, CONFIG.BAUD_RATE);
 
          let posResult = '';
          let error = '';

          await portReader.onOpen(({data, lastValue, error}) => {
            console.log('portReader onOpen:', {data, lastValue, error});
            posResult = lastValue;
          });

          await portReader.onData((data) => {
            console.log('portReader onData:', data);
          });

          await portReader.onError((err) => {
            error = err;
            console.log('portReader onError:', err);
          });


          // Escuchar balanza.
          // Si llega valor de la balanza se envía
          // validar si nunca llega valor a través de timeout. Ej 15seg
          // Si supera el timeout, se debe enviar un error al soap.
          // validar en caso de error, enviar error al soap.
    
          
          if (!posResult || error) {
            portReader?.close();
            consola.warn('No se pudo obtener el peso de la balanza', error || '');
            return;
          }
    
          consola.info("Peso de la balanza:", posResult);
          portReader?.close();
    
          // processData(posResult, REQUEST);
    
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
