import {LocalizationConfig, SafelloConfig, RampConfig, WyreConfig} from './onRamp';
import {IPGeolocationApiConfig} from './IPGeolocationApiConfig';

export interface SupportedToken {
  address: string;
  minimalAmount: string;
}

export interface ChainSpec {
  ensAddress: string;
  chainId: number;
  name: string;
}

export interface ContractWhiteList {
  wallet: string[];
  proxy: string[];
}

export interface OnRampConfig {
  safello: SafelloConfig;
  ramp: RampConfig;
  wyre: WyreConfig;
}

export interface PublicRelayerConfig {
  supportedTokens: SupportedToken[];
  factoryAddress: string;
  chainSpec: ChainSpec;
  contractWhiteList: ContractWhiteList;
  localization: LocalizationConfig;
  onRampProviders: OnRampConfig;
  maxGasLimit: number;
  ipGeolocationApi: IPGeolocationApiConfig;
}
