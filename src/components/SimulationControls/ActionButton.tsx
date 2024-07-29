import React from 'react';

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  primary?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ onClick, icon, label, primary = false }) => {
  const baseClasses = "px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 flex items-center space-x-2";
  const colorClasses = primary
    ? "bg-light-primary dark:bg-dark-primary text-light-background dark:text-dark-background hover:bg-light-primary-dark dark:hover:bg-dark-primary-light focus:ring-light-primary-dark dark:focus:ring-dark-primary-light"
    : "bg-light-secondary dark:bg-dark-secondary text-light-background dark:text-dark-background hover:bg-light-secondary-dark dark:hover:bg-dark-secondary-light focus:ring-light-secondary-dark dark:focus:ring-dark-secondary-light";

  return (
    <button onClick={onClick} className={`${baseClasses} ${colorClasses}`} aria-label={label || 'button'}>
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
};