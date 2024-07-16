// ColumnHeader.tsx
import React from 'react';
import { Icons } from '../common/Icons';
import { Tooltip } from '../common/Tooltip';

interface ColumnHeaderProps {
  isEditing: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onClick: () => void;
  color: string;
}

export function ColumnHeader({
  isEditing,
  value,
  onChange,
  onBlur,
  onClick,
  color
}: ColumnHeaderProps) {
  return (
    <div className={`flex items-center justify-center h-full px-2 ${color}`}>
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
        <Tooltip content="Click to edit column name">
          <div className="flex items-center justify-center w-full cursor-pointer" onClick={onClick}>
            <span className="truncate text-center">{value}</span>
            <Icons.Edit className="ml-1 opacity-70 hover:opacity-100" />
          </div>
        </Tooltip>
      )}
    </div>
  );
}