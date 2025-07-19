import { getMockData } from '../helpers/utils.js'

export class POSIntegrado {
    connected;
    constructor() {
        this.connected = false
        this.ackTimeout = 2000
        this.posTimeout = 150000
        this.port = null
        this.waiting = false

        this.responseCallback = function () {
        }
        this.ackCallback = function () {
        }
     }

    isConnected() {
        return this.connected
    }

    loadKeys() {
        return new Promise((resolve) => resolve({terminalId: 1}));
    }

    setDebug(debug) {
        console.log(`setDebug result, debug: ${debug}`);
    }

    autoconnect() {
        this.connected = true;
        return new Promise((resolve) => resolve({
            path: "autoconnect result",
        }));
    }

    sale(amount, ticket, sendStatus, callback) {
        console.log(`[sale] params - amount: ${amount}, ticket: ${ticket}, sendStatus: ${sendStatus}, callback: ${callback}`)
        return new Promise((resolve) => resolve("sale result"));
    }

    getLastSale() {
        return getMockData('getLastSale', 'pos');
    }

    getTotals() {
        return new Promise((resolve) => resolve("getTotals result"));
    }

    salesDetail(printOnPos) {
        console.log(`[salesDetail] params - printOnPos: ${printOnPos}`);
        return getMockData('salesDetail', 'pos');
    }
}
