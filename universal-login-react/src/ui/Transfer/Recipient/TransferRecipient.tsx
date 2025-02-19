import React from 'react';
import {TransferDetails} from '@universal-login/commons';

export interface TransferRecipientProps {
  updateTransferDetailsWith: (transferDetails: Partial<TransferDetails>) => void;
  recipientError: boolean;
  setRecipientError: (isRecipientInvalid: boolean) => void;
}

export const TransferRecipient = ({updateTransferDetailsWith, recipientError, setRecipientError}: TransferRecipientProps) => {
  const onChange = (recipient: string) => {
    setRecipientError(false);
    updateTransferDetailsWith({to: recipient});
  };

  return (
    <>
      <div className="transfer-recipient-row">
        <label className="transfer-recipient-label" htmlFor="input-recipient">Recipient</label>
      </div>
      <div className="transfer-recipient-input-wrapper">
        <div className="transfer-recipient-input-content">
          <input
            id="input-recipient"
            className="transfer-recipient-input"
            onChange={event => onChange(event.target.value)}
          />
        </div>
        {recipientError && <div className="hint transfer-recipient-hint">Invalid recipient</div>}
      </div>
    </>
  );
};
