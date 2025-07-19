import fs from 'node:fs';
import consola from 'consola';
import path from 'node:path';

const folderName = path.join(__dirname, '../../', 'logs');

const createLogFolder = () => {
	try {
		if (!fs.existsSync(folderName)) {
			fs.mkdirSync(folderName);
		}
	} catch (err) {
		console.error(err);
	}
}

export const Log = (message, mod, type = 'error') => {
	createLogFolder();
	const d = new Date();
	const date = `${d.toLocaleString('default', { day: '2-digit' })}${d.toLocaleString('default', { month: '2-digit' })}${d.getFullYear()}`;
	const hour = `${d.getHours()}:${d.toLocaleString('default', { minute: '2-digit' })}:${d.toLocaleString('default', { second: '2-digit' })}`
	message = `${message} | ${mod} | ${hour}\n`;
	consola.info(`Log registered: ${message}`);
	fs.writeFile(`${folderName}/log-${type}-${date}.log`, message, { flag: 'a+' }, err => {
		if (err)
			console.error('Error escribiendo Log', err.message);
	});
};
