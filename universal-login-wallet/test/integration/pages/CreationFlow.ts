import {ReactWrapper} from 'enzyme';
import {waitForUI} from '../helpers/utils';
import GasModePage from './GasModePage';

export default class CreationFlow {
  constructor(
    private wrapper: ReactWrapper,
    private gasModePage: GasModePage,
  ) {}

  chooseTopUpMethod() {
    this.wrapper.find('label#topup-btn-crypto').simulate('click');
  }

  getAddress() {
    return this.wrapper.find('#contract-address').prop('defaultValue');
  }

  async waitAndGoToWallet(timeout?: number) {
    await waitForUI(this.wrapper, () => this.wrapper.text().includes('Go to your wallet'), timeout);
    this.wrapper.find('a.modal-success-btn').simulate('click', {button: 0});
  }

  selectGasMode() {
    return this.gasModePage.selectGasMode();
  }

  waitForGasMode() {
    return this.gasModePage.waitForGasMode();
  }
}
