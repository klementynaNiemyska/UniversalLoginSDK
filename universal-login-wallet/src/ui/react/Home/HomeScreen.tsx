import {join} from 'path';
import React, {useEffect} from 'react';
import {Route, Switch, useHistory} from 'react-router';
import {Funds, Devices, BackupCodes, Notice, TopUp} from '@universal-login/react';
import {Header} from './Header';
import {useServices} from '../../hooks';
import ModalTransfer from '../Modals/Transfer/ModalTransfer';

const HomeScreen = () => {
  const basePath = '/wallet';
  const {walletService, walletPresenter} = useServices();

  const deployedWallet = walletService.getDeployedWallet();
  const notice = deployedWallet.sdk.getNotice();

  useEffect(() => deployedWallet.subscribeDisconnected(() => walletService.disconnect()), []);

  const history = useHistory();

  return (
    <>
      <div className="dashboard">
        <Header />
        <div className="dashboard-content">
          <div className="dashboard-content-box">
            <Notice message={notice} />
            <p className="dashboard-ens-name">{walletPresenter.getName()}</p>
            <Switch>
              <Route path={basePath} exact>
                <Funds
                  deployedWallet={deployedWallet}
                  onTopUpClick={() => history.push(join(basePath, 'topUp'))}
                  onSendClick={() => history.push(join(basePath, 'transfer'))}
                  onDeviceMessageClick={() => history.push(join(basePath, 'devices', 'approveDevice'))}
                  className="jarvis-styles"
                />
              </Route>
              <Route path={join(basePath, 'devices')}>
                <Devices
                  walletService={walletService}
                  onAccountDisconnected={() => history.push('/welcome')}
                  basePath={join(basePath, 'devices')}
                  className="jarvis-styles"
                />
              </Route>
              <Route path={join(basePath, 'backup')}>
                <BackupCodes
                  deployedWallet={deployedWallet}
                  className="jarvis-backup"
                />
              </Route>
              <Route path={join(basePath, 'topUp')}>
                <TopUp
                  sdk={deployedWallet.sdk}
                  contractAddress={deployedWallet.contractAddress}
                  topUpClassName="jarvis-styles"
                  isDeployment={false}
                  logoColor="black"
                  hideModal={() => history.push('/wallet')}
                />
              </Route>
              <Route
                path={join(basePath, 'transfer')}
                render={() => <ModalTransfer basePath={join(basePath, 'transfer')} />}
              />
            </Switch>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeScreen;
