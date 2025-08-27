import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export interface DonutProps {
  percent: number;
  size?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
}

export function Donut({ 
  percent, 
  size = 112, 
  color = '#17a2b8', 
  backgroundColor = '#e5e7eb',
  className = '' 
}: DonutProps) {
  const data = [
    { name: 'done', value: percent },
    { name: 'rest', value: 1 - percent },
  ];

  const innerRadius = size * 0.3;
  const outerRadius = size * 0.5;

  return (
    <div className={className} style={{ height: size, width: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie 
            data={data} 
            dataKey="value" 
            innerRadius={innerRadius} 
            outerRadius={outerRadius} 
            startAngle={90} 
            endAngle={-270}
          >
            <Cell fill={color} />
            <Cell fill={backgroundColor} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
