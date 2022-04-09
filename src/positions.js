require('dotenv').config();
const alpaca = require('./alpaca');

const getPositions = async () => {
  const positions = await alpaca.getPositions();
  return positions;
};

const getPosition = async (symbol) => {
  const positions = await getPositions();
  return positions.find((position) => position.symbol === symbol);
};

const hasPosition = async (symbol) => {
  const position = await getPosition(symbol);
  return !!position;
};

exports.getPositions = getPositions;
exports.getPosition = getPosition;
exports.hasPosition = hasPosition;
