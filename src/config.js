import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
    isDev: process.env.NODE_ENV === 'MOCKS',
    VKORG:  process.env.VKORG,
    WERKS:  process.env.WERKS,
    SOAP_USER: process.env.SOAP_USER,
    SOAP_PASSWORD: process.env.SOAP_PASSWORD,
    SOAP_URL: process.env.SOAP_URL,
};
