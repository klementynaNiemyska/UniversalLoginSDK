import {utils} from 'ethers';
import {ContractJSON, KeyPair, SignedMessage} from '@universal-login/commons';
import {WalletContractInterface} from './interfaces';

export type EnsDomainData = {
  ensAddress: string;
  registrarAddress: string;
  resolverAddress: string;
};

export const encodeInitializeWithENSData = (args: string[]) => WalletContractInterface.functions.initializeWithENS.encode(args);

export const encodeInitializeData = (args: string[]) => WalletContractInterface.functions.initialize.encode(args);

const {executeSigned} = WalletContractInterface.functions;

export const encodeDataForExecuteSigned = (message: SignedMessage) =>
  executeSigned.encode([
    message.to,
    message.value,
    message.data,
    message.gasPrice,
    message.gasToken,
    message.gasCall,
    message.gasBase,
    message.signature,
  ]);

export const getDeployData = (contractJSON: ContractJSON, args: any[]) =>
  new utils.Interface(contractJSON.interface).deployFunction.encode(`0x${contractJSON.bytecode}`, args);

type SetupInitializeWithENSArgs = {
  keyPair: KeyPair;
  ensDomainData: EnsDomainData;
  name?: string;
  domain?: string;
  gasPrice: string;
  gasToken: string;
};

export function setupInitializeWithENSArgs({keyPair, ensDomainData, gasPrice, gasToken, name = 'name', domain = 'mylogin.eth'}: SetupInitializeWithENSArgs) {
  const ensName = `${name}.${domain}`;
  const hashLabel = utils.keccak256(utils.toUtf8Bytes(name));
  const node = utils.namehash(ensName);
  const args = [keyPair.publicKey, hashLabel, ensName, node, ensDomainData.ensAddress, ensDomainData.registrarAddress, ensDomainData.resolverAddress, gasPrice, gasToken];
  return args;
}
