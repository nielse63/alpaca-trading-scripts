require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const getBars = require('../src/bars');

const DATA_FILE = path.resolve(__dirname, '../data/bars.json');

const main = async () => {
  const data = await getBars();
  await fs.writeJSON(DATA_FILE, data, { spaces: 2 });
};

main().catch(console.error);
