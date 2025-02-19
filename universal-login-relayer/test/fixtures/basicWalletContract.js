import {utils} from 'ethers';
import {EMPTY_DATA, TEST_ACCOUNT_ADDRESS, DEFAULT_GAS_LIMIT, DEFAULT_GAS_PRICE} from '@universal-login/commons';
import {encodeFunction} from '@universal-login/contracts/testutils';
import WalletContract from '@universal-login/contracts/build/Wallet.json';

const gasPrice = utils.bigNumberify(DEFAULT_GAS_PRICE);
const gasLimit = utils.bigNumberify(DEFAULT_GAS_LIMIT);

export const transferMessage = {
  to: TEST_ACCOUNT_ADDRESS,
  value: utils.parseEther('0.5'),
  data: EMPTY_DATA,
  nonce: '0',
  gasPrice,
  gasLimit,
  gasToken: '0x0000000000000000000000000000000000000000',
};

const addKeyMessageDataField = encodeFunction(WalletContract, 'addKey', ['0x63FC2aD3d021a4D7e64323529a55a9442C444dA0']);
export const addKeyMessage = {
  to: '0x0000000000000000000000000000000000000000',
  value: utils.parseEther('0.0'),
  data: addKeyMessageDataField,
  nonce: 0,
  gasPrice,
  gasLimit,
  gasToken: '0x0000000000000000000000000000000000000000',
};

const removeKeyMessageDataField = encodeFunction(WalletContract, 'removeKey', ['0x63FC2aD3d021a4D7e64323529a55a9442C444dA0']);
export const removeKeyMessage = {
  to: '0x0000000000000000000000000000000000000000',
  value: utils.parseEther('0.0'),
  data: removeKeyMessageDataField,
  nonce: 1,
  gasPrice,
  gasLimit,
  gasToken: '0x0000000000000000000000000000000000000000',
};
