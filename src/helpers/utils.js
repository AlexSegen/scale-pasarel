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
