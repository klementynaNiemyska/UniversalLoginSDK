import React, {useState} from 'react';
import {DeployedWallet} from '@universal-login/sdk';
import {TransferDetails, TokenDetails, DEFAULT_GAS_LIMIT, TokenDetailsWithBalance, GasParameters} from '@universal-login/commons';
import '../styles/transfer.sass';
import '../styles/transferDefaults.sass';
import {getStyleForTopLevelComponent} from '../../core/utils/getStyleForTopLevelComponent';
import {FooterSection} from '../commons/FooterSection';
import {GasPrice} from '../commons/GasPrice';
import {TransferAmount} from './Amount/TransferAmount';
import {TransferRecipient} from './Recipient/TransferRecipient';
import {TransferDropdown} from './Amount/TransferDropdown';

export interface TransferProps {
  deployedWallet: DeployedWallet;
  transferDetails: Partial<TransferDetails>;
  updateTransferDetailsWith: (transferDetails: Partial<TransferDetails>) => void;
  tokenDetailsWithBalance: TokenDetailsWithBalance[];
  tokenDetails: TokenDetails;
  onSendClick: () => Promise<void>;
  transferClassName?: string;
}

interface ErrorsProps {
  amountError: boolean;
  recipientError: boolean;
}

export const Transfer = ({deployedWallet, transferDetails, updateTransferDetailsWith, tokenDetailsWithBalance, tokenDetails, onSendClick, transferClassName}: TransferProps) => {
  const [errors, setErrors] = useState<ErrorsProps>({amountError: false, recipientError: false});

  const onTransferClick = async () => {
    try {
      await onSendClick();
    } catch (error) {
      setErrors({
        amountError: error.errorType !== 'InvalidAddressOrEnsName' && true,
        recipientError: error.errorType !== 'InvalidAmount' && true,
      });
    }
  };

  return (
    <div className="universal-login-transfer">
      <div className={getStyleForTopLevelComponent(transferClassName)}>
        <div className="transfer">
          <TransferDropdown
            sdk={deployedWallet.sdk}
            tokenDetailsWithBalance={tokenDetailsWithBalance}
            tokenDetails={tokenDetails}
            setToken={(token: TokenDetails) => updateTransferDetailsWith({transferToken: token.address})}
            className={transferClassName}
          />
          <TransferAmount
            deployedWallet={deployedWallet}
            updateTransferDetailsWith={updateTransferDetailsWith}
            tokenDetails={tokenDetails}
            setAmountError={(isAmountInvalid: boolean) => setErrors({...errors, amountError: isAmountInvalid})}
            amountError={errors.amountError}
          />
          <TransferRecipient
            updateTransferDetailsWith={updateTransferDetailsWith}
            recipientError={errors.recipientError}
            setRecipientError={(isRecipientInvalid: boolean) => setErrors({...errors, recipientError: isRecipientInvalid})}
          />
        </div>
        <FooterSection className={transferClassName}>
          <GasPrice
            isDeployed={true}
            deployedWallet={deployedWallet}
            gasLimit={DEFAULT_GAS_LIMIT}
            onGasParametersChanged={(gasParameters: GasParameters) => updateTransferDetailsWith({gasParameters})}
            className={transferClassName}
          />
          <div className="footer-buttons-row">
            <button id="send-button" onClick={onTransferClick} className="footer-approve-btn" disabled={!transferDetails.gasParameters}>Send</button>
          </div>
        </FooterSection>
      </div>
    </div>
  );
};
