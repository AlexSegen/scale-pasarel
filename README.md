# Scale Pasarel

A Node.js middleware service that bridges industrial weighing scales with SAP ERP systems via SOAP web services. The application automatically polls SAP for scale reading requests, communicates with physical scales through serial port connections, and sends weight measurements back to SAP.

## Features

- **SAP Integration**: Connects to SAP via custom SOAP web services (`ZRFC_BALANZA_DIGITAL_REQUEST` and `ZRFC_BALANZA_DIGITAL_RESPONSE`)
- **Serial Communication**: Interfaces with industrial scales through configurable serial port connections
- **Scheduled Polling**: Runs automated checks every 10 seconds using cron jobs
- **Development Mode**: Mock mode for testing without physical hardware or SAP connections
- **Logging**: Comprehensive logging system for monitoring and debugging
- **Error Handling**: Robust error handling for both SOAP and serial communication failures

## Prerequisites

- **Node.js** (v14 or higher recommended)
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
| `WORKSTATION_ID` | SAP workstation identifier | - | Yes |
| `SOAP_USER` | SAP SOAP service username | - | Yes |
| `SOAP_PASSWORD` | SAP SOAP service password | - | Yes |
| `SOAP_URL` | SAP SOAP service endpoint URL | - | Yes |
| `SERIAL_PORT_NAME` | Serial port for scale communication | `COM2` | No |
| `BAUD_RATE` | Serial communication baud rate | `9600` | No |

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

### Key Components

- **SOAP Client** (`src/modules/soap-client.js`): Handles SAP communication
- **Port Reader** (`src/modules/port-reader.js`): Manages serial port communication
- **Configuration** (`src/config.js`): Environment-based settings management
- **Logger** (`src/modules/logger.js`): Application logging system

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