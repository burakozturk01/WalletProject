import React from 'react';

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm p-4 ${className}`}>
      {title && (
        <div className="mb-3 text-sm text-gray-500">{title}</div>
      )}
      {children}
    </div>
  );
}
