require('dotenv').config();
const alpaca = require('./alpaca');

const getAccount = async () => {
  const account = await alpaca.getAccount();
  return account;
};

const getCash = async () => {
  const { cash } = await getAccount();
  return parseFloat(cash);
};

exports.getAccount = getAccount;
exports.getCash = getCash;
