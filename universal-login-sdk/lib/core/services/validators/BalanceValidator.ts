import {ensure, TransferDetails, ETHER_NATIVE_TOKEN} from '@universal-login/commons';
import {utils} from 'ethers';
import {DeployedWallet} from '../../../api/DeployedWallet';
import {InsufficientBalance} from '../../utils/errors';

export class BalanceValidator {
  constructor(private deployedWallet: DeployedWallet) {}

  async validate(
    {transferToken, amount, gasParameters}: TransferDetails,
    gasLimit: utils.BigNumberish,
  ) {
    const gasFee = utils.bigNumberify(gasParameters.gasPrice.toString()).mul(gasLimit);
    if (transferToken === gasParameters.gasToken) {
      const aggregateAmount = gasFee.add(this.getAmount(amount, transferToken));
      await this.checkBalance(transferToken, aggregateAmount);
    }
  }

  private getAmount(amount: string, tokenAddress: string) {
    return tokenAddress === ETHER_NATIVE_TOKEN.address ? utils.parseEther(amount) : amount;
  }

  private async checkBalance(
    token: string,
    amount: utils.BigNumberish,
  ) {
    const balance = await this.deployedWallet.getBalance(token);
    ensure(balance.gte(amount), InsufficientBalance);
  }
}
