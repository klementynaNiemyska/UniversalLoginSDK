import React from 'react';
import {Route, Redirect, RouteProps, RouteComponentProps} from 'react-router-dom';
import {getUrlFromWalletState} from '../../app/getUrlFromWalletState';
// import {WalletState} from '@universal-login/sdk';

export interface PrivateRouteProps extends RouteProps {
  authorized: boolean;
  render: ((props: RouteComponentProps<any>) => React.ReactNode);
}

export const PrivateRoute = ({authorized, render, ...restProps}: PrivateRouteProps) => (
  <Route
    {...restProps}
    render={props => (
      authorized
        ? render(props)
        : (
          <Redirect
            to={{
              pathname: '/welcome',
              state: {from: props.location},
            }}
          />
        )
    )}
  />
);

export interface WalletRouteProps extends RouteProps {
  walletState: any
  render: ((props: RouteComponentProps<any>) => React.ReactNode);
}

export const WalletRoute = ({walletState, render, ...restProps}: WalletRouteProps) => (
  <Route
    {...restProps}
    render={props =>
      props.location.pathname === getUrlFromWalletState(walletState.kind, props.location.pathname.toString())
      ? render(props)
      : (<Redirect
          to={{
            pathname: getUrlFromWalletState(walletState.kind, props.location.pathname.toString()),
            state: {from: props.location},
          }}
        />)}
  />
);