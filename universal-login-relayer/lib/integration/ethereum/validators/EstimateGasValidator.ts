import {Wallet, providers, utils} from 'ethers';
import {SignedMessage, ensure, calculateMessageHash, IMessageValidator} from '@universal-login/commons';
import {messageToTransaction} from '../../../core/utils/messages/serialisation';
import {NotEnoughGas} from '../../../core/utils/errors';

export default class EstimateGasValidator implements IMessageValidator {
  constructor(private wallet: Wallet) {}

  async validate(signedMessage: SignedMessage) {
    ensure(utils.bigNumberify(signedMessage.gasPrice).gt(0), NotEnoughGas);
    const transactionReq: providers.TransactionRequest = messageToTransaction(signedMessage);
    let messageHash;
    try {
      messageHash = await this.wallet.provider.call({...transactionReq, from: this.wallet.address}); // TODO estimate gas
    } catch (e) {
      throw new NotEnoughGas();
    }
    const calculatedMessageHash = calculateMessageHash(signedMessage);
    ensure(messageHash === calculatedMessageHash, NotEnoughGas);
  }
}
