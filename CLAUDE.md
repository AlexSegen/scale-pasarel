# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run watch` - Development mode with mocks enabled (NODE_ENV=MOCKS)
- `npm run build` - Production build
- `npm run build:dev` - Development build with mocks enabled
- `npm start` - Build and run production application
- `npm start:dev` - Build and run development application with mocks

## Architecture Overview

**Scale Pasarel** is a Node.js middleware service that bridges industrial weighing scales with SAP ERP systems via SOAP web services. The application has been **completely refactored** from a monolithic structure to a modern, modular service-oriented architecture.

### Business Flow
1. **SAP Polling**: Every 10 seconds, polls SAP via `ZRFC_BALANZA_DIGITAL_REQUEST` for pending scale reading requests
2. **Scale Communication**: Opens serial port connection to industrial scale to read weight data
3. **Data Processing**: Collects weight measurements over a configured time period
4. **SAP Response**: Sends weight data back to SAP via `ZRFC_BALANZA_DIGITAL_RESPONSE`
5. **Cleanup**: Closes connections and waits for next scheduled check

### Modern Service Architecture (Post-Refactorization)

**Application Entry Point** (`src/index.js`):
- Clean entry point with `Application` class for initialization
- Graceful shutdown handling (SIGTERM, SIGINT)
- Environment-based logging level configuration
- Delegates all business logic to ApplicationService

**ApplicationService** (`src/services/ApplicationService.js`) - **Main Orchestrator**:
- Coordinates all service interactions
- Manages cron job lifecycle (every 10 seconds)
- Handles graceful startup/shutdown with proper resource cleanup
- Configuration validation at startup
- Process signal handling and error recovery

**SoapService** (`src/services/SoapService.js`) - **SAP Integration**:
- Singleton SOAP client with connection reuse
- Retry logic with exponential backoff
- Specific methods: `requestScaleReading()`, `sendScaleResponse()`
- Health check endpoints for monitoring
- Robust authentication and error handling

**ScaleService** (`src/services/ScaleService.js`) - **Serial Communication**:
- 100% Promise-based API (eliminates callback hell)
- Configurable timeouts and connection parameters
- Auto-connect/disconnect with `readWeightWithAutoConnect()`
- Proper event handling and resource management
- Static method `listAvailablePorts()` for debugging

**LoggerService** (`src/services/LoggerService.js`) - **Structured Logging**:
- JSON formatted logs with configurable levels (ERROR, WARN, INFO, DEBUG)
- Automatic log rotation by date and level
- Context-aware logging for traceability
- Compatibility layer for legacy `Log()` function

### Error Handling & Validation

**Custom Error System** (`src/errors/CustomErrors.js`):
- Hierarchical error classes: `AppError` (base), `SoapError`, `ScaleError`, `ConfigurationError`
- Specific errors: `ScaleTimeoutError`, `SoapConnectionError`, `SoapAuthenticationError`
- Structured error information for debugging and monitoring

**Configuration Validation** (`src/config/validation.js`):
- `ConfigValidator` class with comprehensive startup validation
- Serial port format validation (Windows COM ports, Unix /dev/ paths)
- Baud rate validation against standard rates
- URL format validation for SOAP endpoints
- Environment-specific validation (dev vs production requirements)

### Module Exports & Compatibility

**New Services** exported through `src/modules/index.js`:
- All new services (`ApplicationService`, `SoapService`, `ScaleService`, `LoggerService`)
- Custom error classes
- Configuration validator
- **Legacy compatibility** maintained for existing integrations

### Environment Configuration

Required variables validated at startup (see `.env.template`):
- `WORKSTATION_ID` - SAP workstation identifier (always required)
- `SOAP_USER` - SAP SOAP username (production only)
- `SOAP_PASSWORD` - SAP SOAP password (production only)
- `SOAP_URL` - SAP SOAP service URL (production only)
- `SERIAL_PORT_NAME` - Serial port path (default: COM2)
- `BAUD_RATE` - Communication baud rate (default: 9600, validated against standard rates)

### Development vs Production Modes

**Development Mode** (`NODE_ENV=MOCKS`):
- Uses `fake-soap.client.js` for SAP simulation
- Skips WSDL download and SAP connectivity validation
- DEBUG level logging enabled
- Can test complete flow without physical hardware

**Production Mode**:
- Downloads WSDL file via `downloadWSDL()` from `httpclient.js`
- Validates SAP connectivity and authentication
- INFO level logging (configurable)
- Full validation of serial ports and hardware requirements

### Key Architectural Improvements

1. **Separation of Concerns**: Each service has single responsibility
2. **Error Resilience**: Typed errors, retry logic, graceful degradation
3. **Observability**: Structured JSON logs, health checks, configuration summaries
4. **Resource Management**: Proper connection pooling, graceful shutdown, cleanup
5. **Testability**: Services are injectable and mockable
6. **Configuration**: Rigorous validation with descriptive error messages

### Legacy Compatibility

The refactored architecture maintains 100% backward compatibility:
- All npm scripts work unchanged
- Environment variables unchanged
- SOAP protocol and data structures unchanged
- Serial communication protocol unchanged