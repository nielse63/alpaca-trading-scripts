const MOCK_ACCOUNT = require('../__fixtures__/account');

const alpaca = jest.createMockFromModule('../alpaca');
alpaca.getAccount = () => Promise.resolve(MOCK_ACCOUNT);

module.exports = alpaca;
