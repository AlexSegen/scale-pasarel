# Scale Pasarel

A Node.js middleware service that bridges industrial weighing scales with SAP ERP systems via SOAP web services. The application has been **completely refactored** from a monolithic structure to a modern, modular service-oriented architecture, providing better error handling, logging, and maintainability. It automatically polls SAP for scale reading requests, communicates with physical scales through serial port connections, and sends weight measurements back to SAP.

## Features

- **SAP Integration**: Connects to SAP via custom SOAP web services (`ZRFC_BALANZA_DIGITAL_REQUEST` and `ZRFC_BALANZA_DIGITAL_RESPONSE`)
- **Serial Communication**: Interfaces with industrial scales through configurable serial port connections
- **Scheduled Polling**: Runs automated checks every 10 seconds using cron jobs
- **Development Mode**: Mock mode for testing without physical hardware or SAP connections
- **Logging**: Structured JSON logging with automatic rotation and configurable levels
- **Error Handling**: Hierarchical custom error system with typed errors and retry logic
- **Service-Oriented Architecture**: Modular design with dedicated services for each responsibility

## Recent Refactorization

The application has undergone a complete architectural refactorization, transforming from a monolithic codebase to a modern service-oriented architecture:

- **Separation of Concerns**: Each service (`ApplicationService`, `SoapService`, `ScaleService`, `LoggerService`) has a single responsibility
- **Promise-Based APIs**: Eliminated callback hell with 100% Promise-based serial communication
- **Typed Error Handling**: Custom error classes (`SoapError`, `ScaleError`, `ConfigurationError`) for better debugging
- **Configuration Validation**: Comprehensive startup validation with environment-specific requirements
- **Resource Management**: Proper connection pooling, graceful shutdown, and cleanup procedures
- **Observability**: Structured logging with JSON format and automatic log rotation

## Prerequisites

- **Node.js** (v16 or higher recommended)
- **Industrial Scale** with serial port connectivity
- **SAP System** with custom SOAP web services configured
- **Serial Port Access** (COM port on Windows, /dev/tty* on Linux/Mac)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd scale-pasarel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.template .env
   ```
   
   Edit the `.env` file with your specific configuration:
   ```env
   WORKSTATION_ID=your_workstation_id
   SOAP_USER=your_sap_username
   SOAP_PASSWORD=your_sap_password
   SOAP_URL=your_sap_soap_endpoint
   SERIAL_PORT_NAME=COM2
   BAUD_RATE=9600
   ```

4. **Verify WSDL file**
   Ensure `service.wsdl` is present in the project root for SOAP operations.

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `WORKSTATION_ID` | SAP workstation identifier | - | Yes (always) |
| `SOAP_USER` | SAP SOAP service username | - | Yes (production only) |
| `SOAP_PASSWORD` | SAP SOAP service password | - | Yes (production only) |
| `SOAP_URL` | SAP SOAP service endpoint URL | - | Yes (production only) |
| `SERIAL_PORT_NAME` | Serial port for scale communication | `COM2` | No |
| `BAUD_RATE` | Serial communication baud rate | `9600` | No |

**Note**: SOAP credentials are only required in production mode. Development mode (`NODE_ENV=MOCKS`) uses mock SOAP responses and can run without SAP connectivity.

### Serial Port Configuration

Common serial port names:
- **Windows**: `COM1`, `COM2`, `COM3`, etc.
- **Linux**: `/dev/ttyUSB0`, `/dev/ttyS0`, etc.
- **macOS**: `/dev/cu.usbserial-*`, `/dev/tty.usbserial-*`

## Usage

### Development Mode (with Mocks)

For testing without physical hardware or SAP connection:

```bash
# Build and run with mocks
npm run start:dev

# Or watch mode for development
npm run watch
```

### Production Mode

For live operation with actual SAP and scale hardware:

```bash
# Build and run production
npm start
```

### Available Scripts

- `npm run watch` - Development mode with file watching and mocks
- `npm run build` - Production build
- `npm run build:dev` - Development build with mocks
- `npm start` - Build and run production application
- `npm start:dev` - Build and run with development mocks

## How It Works

1. **Initialization**: Application starts and sets up a cron job to run every 10 seconds
2. **SAP Polling**: Calls `ZRFC_BALANZA_DIGITAL_REQUEST` to check for pending scale reading requests
3. **Scale Communication**: If a request is found, opens serial port connection to the physical scale
4. **Data Collection**: Collects weight data over a 5-second period and captures the final reading
5. **Response**: Sends the weight measurement back to SAP via `ZRFC_BALANZA_DIGITAL_RESPONSE`
6. **Cleanup**: Closes serial port connection and waits for the next scheduled check

## Architecture

```
┌─────────────┐    SOAP     ┌─────────────┐    Serial    ┌─────────────┐
│             │◄──────────► │             │◄────────────►│             │
│ SAP System  │             │Scale Pasarel│              │Industrial   │
│             │   Requests  │             │   Commands   │Scale        │
└─────────────┘             └─────────────┘              └─────────────┘
```

### Key Components (Post-Refactorization)

- **ApplicationService** (`src/services/ApplicationService.js`): Main orchestrator managing cron job lifecycle and service coordination
- **SoapService** (`src/services/SoapService.js`): Handles SAP integration with connection reuse and retry logic
- **ScaleService** (`src/services/ScaleService.js`): Manages serial port communication with Promise-based API
- **LoggerService** (`src/services/LoggerService.js`): Structured JSON logging with automatic rotation
- **Configuration Validation** (`src/config/validation.js`): Comprehensive startup validation with custom error classes
- **Custom Error System** (`src/errors/CustomErrors.js`): Hierarchical error handling for better debugging

## Troubleshooting

### Common Issues

**Serial Port Access Denied**
- Ensure the user has permission to access the serial port
- Check if another application is using the port
- Verify the correct port name in your environment configuration

**SOAP Connection Failed**
- Verify SAP system accessibility and credentials
- Check network connectivity to the SOAP endpoint
- Ensure the WSDL file is present and valid

**Scale Not Responding**
- Verify physical connection between computer and scale
- Check serial port settings (baud rate, port name)
- Test the scale with terminal software to confirm it's working

**Permission Errors on Linux/Mac**
```bash
# Add user to dialout group for serial port access
sudo usermod -a -G dialout $USER
# Log out and log back in for changes to take effect
```

### Logging

Application logs are stored in the `logs/` directory. Check these files for detailed error information and debugging.

### Development Testing

Use development mode to test the application flow without physical hardware:
```bash
npm run start:dev
```

This mode uses mock SOAP responses and simulates scale communication for testing purposes.

## License

ISC