import React from 'react';
import { Notifications } from '../../../pages/Notifications';

export const OperatorNotifications: React.FC = () => {
  return <Notifications portal="operator" />;
};

export { OperatorNotifications as Notifications };
