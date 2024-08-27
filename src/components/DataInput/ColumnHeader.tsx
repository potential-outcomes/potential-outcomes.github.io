import React from 'react';
import { Icons } from '../common/Icons';
import { Tooltip } from '../common/Tooltip';
import '@/styles/globals.css';

interface ColumnHeaderProps {
  isEditing: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onClick: () => void;
  removeColumn: () => void;
  removable: boolean;
  color: string;
  disabled?: boolean;
}

export function ColumnHeader({
  isEditing,
  value,
  onChange,
  onBlur,
  onClick,
  removeColumn,
  removable,
  color,
  disabled = false
}: ColumnHeaderProps) {
  const handleClick = (event: React.MouseEvent) => {
    if (!disabled) {
      onClick();
    }
    event.preventDefault();
  };

  const handleRemove = (event: React.MouseEvent) => {
    if (!disabled) {
      removeColumn();
    }
    event.preventDefault();
  };

  return (
    <div className={`relative flex items-center justify-center h-full px-2 ${color} ${disabled ? 'opacity-90' : ''}`}>
      {isEditing ? (
        <input
          type="text"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`w-full bg-transparent truncate text-center border-b-2 focus:outline-none ${color}`}
          autoFocus
          disabled={disabled}
        />
      ) : (
        <div className="flex items-center">
          <span 
            className={`truncate ${disabled ? 'cursor-default' : 'cursor-text'} !${color}`}
            onClick={handleClick}
          >
            {value}
          </span>
          {removable && !disabled && 
            <Tooltip content="Delete column" position="bottom" className='w-5 h-5'>
              <button 
                onClick={handleRemove}
                className={`ml-1 ${color} hover:!text-light-error dark:hover:!text-dark-error focus:outline-none`}
                aria-label="Delete column"
              >
                <Icons.Clear/>
              </button>
            </Tooltip>
          }
        </div>
      )}
    </div>
  );
}