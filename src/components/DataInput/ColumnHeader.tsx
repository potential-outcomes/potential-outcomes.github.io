import React from 'react';
import { Icons } from '../common/Icons';
import { Tooltip } from '../common/Tooltip';

interface ColumnHeaderProps {
  isEditing: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onClick: () => void;
  removeColumn: () => void;
  removable: boolean;
  color: string;
}

export function ColumnHeader({
  isEditing,
  value,
  onChange,
  onBlur,
  onClick,
  removeColumn,
  removable,
  color
}: ColumnHeaderProps) {
  return (
    <div className={`relative flex items-center justify-center h-full px-2 ${color}`}>
      {isEditing ? (
        <input
          type="text"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`w-full bg-transparent text-center border-b-2 focus:outline-none ${color}`}
          autoFocus
        />
      ) : (
        <>
          <div className="flex items-center">
            <span 
              className="truncate cursor-text"
              onClick={onClick}
            >
              {value}
            </span>
            { removable && 
            <Tooltip content="Delete column" position="bottom" className='w-5 h-5'>
              <button 
                onClick={removeColumn}
                className={`ml-1 ${color} hover:text-light-error dark:hover:text-dark-error focus:outline-none`}
                aria-label="Delete column"
              >
                <Icons.Clear/>
              </button>
            </Tooltip>
            }
          </div>
        </>
      )}
    </div>
  );
}