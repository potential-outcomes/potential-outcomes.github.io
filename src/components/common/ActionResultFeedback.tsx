import React from 'react';
import { ActionResult } from '@/contexts/SimulationContext/types';
import { Icons } from '../common/Icons';

interface ActionResultFeedbackProps {
  actionResult: ActionResult | null;
}

export const ActionResultFeedback: React.FC<ActionResultFeedbackProps> = ({ actionResult }) => {
  if (!actionResult) return null;

  const getFeedbackContent = () => {
    if (actionResult.error) {
      return {
        icon: <Icons.AlertTriangle size={5} />,
        message: actionResult.error,
        className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
      };
    }
    if (actionResult.warning) {
      return {
        icon: <Icons.AlertCircle size={5} />,
        message: actionResult.warning,
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
      };
    }
    return null;
  };

  const content = getFeedbackContent();

  if (!content) return null;

  return (
    <div className="mt-2">
      <div className={`flex items-center p-2 rounded-md ${content.className}`}>
        <span className="mr-2">{content.icon}</span>
        <span>{content.message}</span>
      </div>
    </div>
  );
};

export default ActionResultFeedback;