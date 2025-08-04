import { readFile } from 'node:fs/promises';

export const getMock = (f, m) => `./__mocks__/${m}/${f}.json`

export async function getMockData(f, m) {
  try {
      const data = JSON.parse(await readFile(getMock(f, m), 'utf8'));
      return data;
    } catch (err) {
      console.error(`Error reading JSON file: ${err}`);
    }
}

export const cleanScaleArrayData = (arr) => (arr.map(cleanScaleData));

export const cleanScaleData = (str) => {
  const clean = str.replace(/[^0-9.]/g, '');
  const match = clean.match(/\d{3}\.\d{3}/);
  return match ? match[0] : null;
}

export const validateFormatNNNdotNNN = (str) => (
  /\d{3}\.\d{3}/.test(str)
);

