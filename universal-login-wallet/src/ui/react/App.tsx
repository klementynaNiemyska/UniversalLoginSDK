import React from 'react';
import {Route, Switch} from 'react-router-dom';
import {useModalService, useProperty} from '@universal-login/react';
import HomeScreen from './Home/HomeScreen';
import NotFound from './NotFound';
import {PrivateRoute, WalletRoute} from './PrivateRoute';
import {useServices} from '../hooks';
import {WelcomeScreen} from './Home/WelcomeScreen';
import {TermsAndConditionsScreen} from './Home/TermsAndConditionsScreen';
import {ConnectAccount} from './ConnectAccount/ConnectAccount';
import {WalletModalContext, WalletModalPropType, WalletModalType} from '../../core/entities/WalletModalContext';
import {PrivacyPolicy} from './Home/PrivacyPolicy';
import {CreateFlow} from './CreateAccount/CreateFlow';

const App = () => {
  const modalService = useModalService<WalletModalType, WalletModalPropType>();
  const {walletService} = useServices();
  const walletState = useProperty(walletService.stateProperty);

  return (
    <WalletModalContext.Provider value={modalService}>
      <Switch>
        {console.log(walletState.kind)}
        <WalletRoute
          exact
          path="/welcome"
          walletState={walletState}
          render={() => <WelcomeScreen />}
        />
        <WalletRoute
          exact
          path="/terms"
          walletState={walletState}
          render={() => <TermsAndConditionsScreen />}
        />
        <Route
          exact
          path="/privacy"
          walletState={walletState}
          render={() => <PrivacyPolicy />}
        />
        <Route
          exact
          path="/create"
          walletState={walletState}
          render={() => <CreateFlow />}
        />
        <WalletRoute
          exact
          path="/connect"
          walletState={walletState}
          render={() =>
            <div className="main-bg">
              <div className="box-wrapper">
                <div className="box">
                  <ConnectAccount />
                </div>
              </div>
            </div>}
        />
        <WalletRoute
          walletState={walletState}
          path="/"
          render={() => <HomeScreen />}
        />
        <Route component={NotFound} />
      </Switch>
    </WalletModalContext.Provider>
  );
};

export default App;
