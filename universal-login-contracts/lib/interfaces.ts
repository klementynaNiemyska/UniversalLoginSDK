import {utils} from 'ethers';
import WalletContract from '../build/Wallet.json';
import UpgradedWallet from '../build/UpgradedWallet.json';
import MockWalletMaster from '../build/MockWalletMaster.json';
import WalletProxyFactory from '../build/WalletProxyFactory.json';
import IERC20 from '../build/IERC20.json';
import WalletProxy from '../build/WalletProxy.json';

import FIFSRegistrar from '../build/FIFSRegistrar.json';
import PublicResolver from '../build/PublicResolver.json';
import ReverseRegistrar from '../build/ReverseRegistrar.json';
import ENS from '../build/ENS.json';

export const WalletContractInterface = new utils.Interface(WalletContract.interface);
export const UpgradedWalletInterface = new utils.Interface(UpgradedWallet.interface);
export const MockWalletMasterInterface = new utils.Interface(MockWalletMaster.interface);
export const WalletProxyFactoryInterface = new utils.Interface(WalletProxyFactory.interface);
export const IERC20Interface = new utils.Interface(IERC20.interface);
export const FIFSRegistrarInterface = new utils.Interface(FIFSRegistrar.interface);
export const ReverseRegistrarInterface = new utils.Interface(ReverseRegistrar.interface);
export const PublicResolverInterface = new utils.Interface(PublicResolver.interface);
export const ENSInterface = new utils.Interface(ENS.interface);
export const WalletProxyInterface = new utils.Interface(WalletProxy.interface);
