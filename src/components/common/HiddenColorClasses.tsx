import React from 'react';

const colorClasses = [
  'text-purple-500',
  'text-blue-500',
  'text-yellow-500',
  'text-green-500'
];

export const HiddenColorClasses = () => {
  return (
    <div className="hidden">
      {colorClasses.map((colorClass, index) => (
        <div key={index} className={colorClass}></div>
      ))}
    </div>
  );
};

export const ensureColorClassesAreIncluded = () => {
  // This function doesn't actually do anything at runtime,
  // it's just here to make sure the color classes are included in the bundle
  return colorClasses.join(' ');
};