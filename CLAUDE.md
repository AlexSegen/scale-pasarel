# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run watch` - Development mode with mocks enabled (NODE_ENV=MOCKS)
- `npm run build` - Production build
- `npm run build:dev` - Development build with mocks enabled
- `npm start` - Build and run production application
- `npm start:dev` - Build and run development application with mocks

## Architecture Overview

This is a Node.js application that interfaces with industrial scales and SAP systems via SOAP web services. The application runs as a scheduled service that periodically checks for scale reading requests.

### Core Components

**Main Entry Point** (`src/index.js`):
- Initializes cron job that runs every 10 seconds to check for SOAP requests
- Downloads WSDL file in production mode
- Entry point for the entire application

**Configuration** (`src/config.js`):
- Environment-based configuration using dotenv
- Two modes: production (SOAP) and development (MOCKS)
- Manages serial port settings and SOAP credentials

**SOAP Client** (`src/modules/soap-client.js`):
- Main business logic handling SAP SOAP communication
- Uses `strong-soap` library for production, mock client for development
- Implements two SOAP operations:
  - `ZRFC_BALANZA_DIGITAL_REQUEST` - Gets scale reading requests from SAP
  - `ZRFC_BALANZA_DIGITAL_RESPONSE` - Sends scale readings back to SAP
- Integrates with PortReader for serial communication with scales

**Serial Port Communication** (`src/modules/port-reader.js`):
- `PortReader` class handles serial port communication with industrial scales
- Uses `serialport` library with readline parser
- Configurable port name and baud rate
- Collects data over 5-second intervals and returns the last reading

### Module Structure

All modules are exported through `src/modules/index.js`:
- `soap-client.js` - SAP SOAP integration
- `httpclient.js` - HTTP client utilities
- `logger.js` - Application logging
- `fake-soap.client.js` - Mock SOAP client for development
- `port-reader.js` - Serial port communication

### Environment Configuration

Required environment variables (see `.env.template`):
- `WORKSTATION_ID` - SAP workstation identifier
- `SOAP_USER` - SAP SOAP authentication username
- `SOAP_PASSWORD` - SAP SOAP authentication password
- `SOAP_URL` - SAP SOAP service URL
- `SERIAL_PORT_NAME` - Serial port for scale communication (default: COM2)
- `BAUD_RATE` - Serial communication baud rate (default: 9600)

### Development vs Production

Development mode (`NODE_ENV=MOCKS`):
- Uses fake SOAP client instead of real SAP connection
- Skips WSDL download
- Allows testing without physical scale or SAP connection

Production mode:
- Downloads WSDL file for SOAP operations
- Connects to actual SAP system
- Communicates with physical scales via serial port

### Build System

Uses Parcel bundler with library configuration:
- Entry point: `src/index.js`
- Output: `dist/main.js` (main), `dist/module.js` (module)
- Cross-environment support with `cross-env`