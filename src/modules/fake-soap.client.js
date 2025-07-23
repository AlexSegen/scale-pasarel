import { getMockData } from '../helpers/utils';
class Client {
    constructor() { }
    
    setSecurity = (args) => {};

    ZRFC_BALANZA_DIGITAL_REQUEST = (_, callback) => {
        callback(null, getMockData('request', 'soap'));
    }

    ZRFC_BALANZA_DIGITAL_RESPONSE = (_, callback) => {
        callback(null, {});
    }
}

class BasicAuthSecurity {
    constructor() {}
};

export class Soap {
    
    client;
    url;
    options;
    BasicAuthSecurity;
    
    constructor() { 
        this.client = null;
        this.url = '';
        this.options = {}  
        this.BasicAuthSecurity = BasicAuthSecurity;
    }

    createClient = (url, options, callback) => {
        callback(null, new Client());
    }
}

export const soap = new Soap();
