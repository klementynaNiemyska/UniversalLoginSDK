import React, {useEffect, useState} from 'react';
import logo from '../../assets/logo.svg';
import {useServices} from '../../hooks';
import {Link, NavLink} from 'react-router-dom';

export function Header() {
  const {sdk, walletService} = useServices();
  const [newNotifications, setNewNotifications] = useState(false);
  const {contractAddress, privateKey} = walletService.getDeployedWallet();

  const updateNotifications = (notifications: Notification[]) => setNewNotifications(notifications.length !== 0);

  useEffect(() => sdk.subscribeAuthorisations(contractAddress, privateKey, updateNotifications), []);

  const {walletPresenter} = useServices();

  return (
    <div className="header">
      <Link className="header-logo-link" to="/wallet">
        <img className="header-logo" src={logo} />
      </Link>
      <div className="header-row">
        <ul className="header-list">
          <li className="header-list-item">
            <NavLink exact to="/wallet" className="header-btn header-funds-btn">Funds</NavLink>
          </li>
          <li className="header-list-item">
            <NavLink
              to="/wallet/devices"
              id="devicesButton"
              className="header-btn devices-btn"
            >
              Devices
              {newNotifications && <div className="new-notifications" />}
            </NavLink>
          </li>
          <li className="header-list-item">
            <NavLink to="/wallet/backup" className="header-btn header-backup-btn">Backup</NavLink>
          </li>
        </ul>
        <p className="header-user-name">{walletPresenter.getName()}</p>
      </div>
    </div>
  );
}
