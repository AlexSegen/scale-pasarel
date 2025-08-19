
# Scale Pasarel

Esta es una aplicación que conecta balanzas industriales con sistemas SAP ERP mediante servicios web SOAP. Consulta automáticamente SAP para obtener solicitudes de lectura de balanza, se comunica con balanzas físicas mediante conexiones de puerto serie y envía las mediciones de peso a SAP.

## Pre requisitos

-  **Node.js** (mínimo versión 20)   ([Descargar](https://nodejs.org/es/download))
  

## Instalación


1.  **Descargar Aplicación**

- [Descargar última versión ZIP de Scale Pasarel aquí](https://github.com/AlexSegen/scale-pasarel/releases)
- Descromprimir zip descargado

2.  **Instalar dependencias**

- Con un terminal, ir a  la raíz del proyecto.
- ejecutar el comando:

```bash

`npm install`

```

3.  **Configurar variables de entorno**

- Duplicar archivo de configuración ejecutando el comando:
- 
```bash

cp .env.template .env

```

- Edite el nuevo archivo `.env` con la configuración específica:

```env

WORKSTATION_ID=your_workstation_id

SOAP_USER=usuario_sap

SOAP_PASSWORD=contraseña_sap

SOAP_URL=url_sap

SERIAL_PORT_NAME=COM2 (por defecto COM2)

BAUD_RATE=9600

```

  

4.  **Verificar que exista el archivo WSDL**

Asegúrese de que el archivo `service.wsdl` está presente en la raíz de la aplicación para ejecutar las operaciones SOAP.

  

## Configuración

  

### Environment Variables

  

| Variable | Descripción | Valor pod defecto| Requerido |

|----------|-------------|---------|----------|

|  `WORKSTATION_ID`  | Identificador único del PC para SAP |  -  | Sí(siempre) |

|  `SOAP_USER`  | SAP SOAP usuario |  -  | Sí (en producción) |

|  `SOAP_PASSWORD`  | SAP SOAP contraseña |  -  | Sí (en producción)  |

|  `SOAP_URL`  | SAP SOAP endpoint URL |  -  | Sí (en producción)  |

|  `SERIAL_PORT_NAME`  | Puerto seríal para comunicación con balanza |  `COM2`  | No |

|  `BAUD_RATE`  | Velocidad del puerto serial |  `9600`  | No |



### Configuración Puerto Serial 
  

Nombres de puertos de serial más comunes:

-  **Windows**: `COM1`, `COM2`, `COM3`, etc.

-  **Linux**: `/dev/ttyUSB0`, `/dev/ttyS0`, etc.

-  **macOS**: `/dev/cu.usbserial-*`, `/dev/tty.usbserial-*`

  

## Usage



### Producción

Para comenzar la ejecución de la aplicación, ejecute el siguiente comando:

```bash

# Build and run production

npm  start

```
 

## Cómo funciona

  

1.  **Initialization**: La Aplicación comienza y setea un Cron Job cada 10 segundos.

2.  **SAP Polling**: Consulta a SAP a través del método `ZRFC_BALANZA_DIGITAL_REQUEST` para verificar si hay solicitudes pendientes.

3.  **Scale Communication**:  Si hay una solicitud, se realiza una conexión hacia la balanza a través del puerto serial configurado.

4.  **Data Collection**: Recolecta la data de la balanza.

5.  **Response**: Envía el peso obtenido nuevamente hacia SAP a través del método `ZRFC_BALANZA_DIGITAL_RESPONSE`.

6.  **Cleanup**: Cierra conexión y espera para realizar nuevamente la siguiente verificación a través del Cron Job.