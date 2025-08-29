import React, { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export interface SparklineProps {
    color?: string;
    data?: Array<{ day: number; value: number }>;
    className?: string;
}

export function Sparkline({ color = '#28a745', data, className = '' }: SparklineProps) {
    const chartData = useMemo(() => {
        if (data) return data;
        return Array.from({ length: 30 }, (_, i) => ({
            day: i,
            value: Math.random() * 200 + 800
        }));
    }, [data]);

    return (
        <div className={`h-16 w-full ${className}`}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
