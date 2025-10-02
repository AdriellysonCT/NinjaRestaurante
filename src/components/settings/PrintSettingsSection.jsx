import React from 'react';
import { Modal } from '../ui/Modal';
import { PrintSettings } from './PrintSettings';

export const PrintSettingsSection = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurações de Impressão"
      size="lg"
    >
      <PrintSettings />
    </Modal>
  );
};

export default PrintSettingsSection;