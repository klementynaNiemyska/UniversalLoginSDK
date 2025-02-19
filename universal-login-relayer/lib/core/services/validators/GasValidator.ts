import {SignedMessage, ensure, GAS_BASE, IMessageValidator} from '@universal-login/commons';
import {InsufficientGas, GasLimitTooHigh} from '../../utils/errors';
import {GasComputation} from '../GasComputation';
import {utils} from 'ethers';

export class GasValidator implements IMessageValidator {
  constructor(private MAX_GAS_LIMIT: number, private gasComputation: GasComputation) {}

  async validate(signedMessage: SignedMessage) {
    const {signature, ...unsignedMessage} = signedMessage;
    const expectedGasBase = utils.bigNumberify(await this.gasComputation.calculateGasBase(unsignedMessage));
    const actualGasBase = Number(signedMessage.gasBase);
    ensure(expectedGasBase.eq(actualGasBase), InsufficientGas, `Got GasBase ${actualGasBase} but should be ${expectedGasBase}`);
    ensure(GAS_BASE < signedMessage.gasCall, InsufficientGas, `Got gasCall ${signedMessage.gasCall} but should greater than ${GAS_BASE}`);

    const gasCall = Number(signedMessage.gasCall);
    const totalGasLimit = gasCall + actualGasBase;
    ensure(totalGasLimit <= this.MAX_GAS_LIMIT, GasLimitTooHigh, `Got ${totalGasLimit} but should be less than ${this.MAX_GAS_LIMIT}`);
  }
}
