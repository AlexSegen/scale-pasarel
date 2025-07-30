import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
    isDev: process.env.NODE_ENV === 'MOCKS',
    WORKSTATION_ID:  process.env.WORKSTATION_ID,
    SOAP_USER: process.env.SOAP_USER,
    SOAP_PASSWORD: process.env.SOAP_PASSWORD,
    SOAP_URL: process.env.SOAP_URL,
    SERIAL_PORT_NAME: process.env.SERIAL_PORT_NAME || 'COM2', // Default to COM2 if not set
    BAUD_RATE: process.env.BAUD_RATE || 9600, // Default to 9600 if not set
};
