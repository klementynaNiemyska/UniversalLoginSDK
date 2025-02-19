import {TEST_ACCOUNT_ADDRESS, UnsignedMessage, calculateMessageSignature, DEFAULT_GAS_LIMIT_EXECUTION, DEFAULT_GAS_PRICE, GAS_FIXED} from '@universal-login/commons';
import {utils, Wallet, Contract} from 'ethers';
import {deployContract} from 'ethereum-waffle';
import MockContract from '../../build/MockContract.json';
import {encodeFunction, getExecutionArgs} from '../helpers/argumentsEncoding';
import Loop from '../../build/Loop.json';
import {calculatePaymentOptions, calculateGasBase} from '../../lib/estimateGas';

const {parseEther} = utils;

export const transferMessage = {
  to: TEST_ACCOUNT_ADDRESS,
  value: parseEther('1.0'),
  data: [],
  nonce: 0,
  gasPrice: DEFAULT_GAS_PRICE,
  gasCall: DEFAULT_GAS_LIMIT_EXECUTION,
  gasBase: utils.bigNumberify('7440').add(GAS_FIXED),
  gasToken: '0x0000000000000000000000000000000000000000',
};

export const failedTransferMessage = {
  to: TEST_ACCOUNT_ADDRESS,
  value: parseEther('10.0'),
  data: [],
  nonce: 0,
  gasPrice: DEFAULT_GAS_PRICE,
  gasCall: DEFAULT_GAS_LIMIT_EXECUTION,
  gasBase: utils.bigNumberify('7440').add(GAS_FIXED),
  gasToken: '0x0000000000000000000000000000000000000000',
};

const callMeMessageData = encodeFunction(MockContract, 'callMe');
export const callMessage = {
  to: TEST_ACCOUNT_ADDRESS,
  value: parseEther('0.0'),
  data: callMeMessageData,
  nonce: 0,
  gasPrice: DEFAULT_GAS_PRICE,
  gasCall: DEFAULT_GAS_LIMIT_EXECUTION,
  gasBase: utils.bigNumberify('8720').add(GAS_FIXED),
  gasToken: '0x0000000000000000000000000000000000000000',
};

const revertingFunctionMessageData = encodeFunction(MockContract, 'revertingFunction');
export const failedCallMessage = {
  to: TEST_ACCOUNT_ADDRESS,
  value: parseEther('0.0'),
  data: revertingFunctionMessageData,
  nonce: 0,
  gasPrice: DEFAULT_GAS_PRICE,
  gasCall: DEFAULT_GAS_LIMIT_EXECUTION,
  gasBase: utils.bigNumberify('8720').add(GAS_FIXED),
  gasToken: '0x0000000000000000000000000000000000000000',
};

type InfiniteCallOverrides = {
  from: string;
  gasToken?: string;
};

export const createInfiniteCallMessage = async (deployer: Wallet, overrides: InfiniteCallOverrides): Promise<UnsignedMessage> => {
  const loopContract = await deployContract(deployer, Loop);
  const loopMessageData = encodeFunction(Loop, 'loop');
  const msg = {
    to: loopContract.address,
    value: utils.parseEther('0'),
    data: loopMessageData,
    nonce: 0,
    gasPrice: 1,
    gasToken: '0x0',
    gasCall: utils.bigNumberify('240000'),
    gasBase: utils.bigNumberify(0).add(GAS_FIXED),
    ...overrides,
  };
  const gasBase = calculateGasBase(msg, 'constantinople', 'beta2');
  return {...msg, gasBase};
};

export const executeSetRequiredSignatures = async (proxyAsWalletContract: Contract, requiredSignatures: number, privateKey: string) => {
  const setRequiredSignaturesMessageData = proxyAsWalletContract.interface.functions.setRequiredSignatures.encode([requiredSignatures]);
  return selfExecute(proxyAsWalletContract, setRequiredSignaturesMessageData, privateKey);
};

export const executeAddKey = async (proxyAsWalletContract: Contract, newKey: string, privateKey: string) => {
  const addKeyMessageData = proxyAsWalletContract.interface.functions.addKey.encode([newKey]);
  return selfExecute(proxyAsWalletContract, addKeyMessageData, privateKey);
};

export const selfExecute = async (proxyAsWalletContract: Contract, data: string, privateKey: string) => {
  const msg = {
    from: proxyAsWalletContract.address,
    to: proxyAsWalletContract.address,
    data,
    value: parseEther('0.0'),
    nonce: await proxyAsWalletContract.lastNonce(),
    gasPrice: DEFAULT_GAS_PRICE,
    gasCall: DEFAULT_GAS_LIMIT_EXECUTION,
    gasBase: utils.bigNumberify(0).add(GAS_FIXED),
    gasToken: '0x0000000000000000000000000000000000000000',
  };
  const gasBase = utils.bigNumberify(calculateGasBase(msg, 'constantinople', 'beta2'));
  msg.gasBase = gasBase;
  const signature = calculateMessageSignature(privateKey, msg);
  return proxyAsWalletContract.executeSigned(...getExecutionArgs(msg), signature, calculatePaymentOptions(msg));
};
