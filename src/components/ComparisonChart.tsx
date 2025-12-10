// ============================================
// Comparison Chart Component
// Visualizing vehicle specs
// ============================================

'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import type { NormalizedSpec } from '@/types/vehicle';
import { clsx } from 'clsx';
import { useState } from 'react';

interface ComparisonChartProps {
    vehicles: NormalizedSpec[];
    className?: string;
}

export function ComparisonChart({ vehicles, className }: ComparisonChartProps) {
    const [metric, setMetric] = useState<'hp' | 'torque' | 'mpg' | 'price'>('hp');

    if (vehicles.length === 0) return null;

    // Prepare data
    const data = vehicles.map(v => ({
        name: `${v.make} ${v.model}`,
        hp: v.horsepower || 0,
        torque: v.torque || 0,
        mpg: v.fuelCombinedMpg || 0,
        price: v.basePrice || 0,
    }));

    const metrics = {
        hp: { label: 'Horsepower', color: '#3b82f6' },
        torque: { label: 'Torque (lb-ft)', color: '#f59e0b' },
        mpg: { label: 'Combined MPG', color: '#10b981' },
        price: { label: 'Base Price ($)', color: '#ec4899' },
    };

    return (
        <div className={clsx(
            'neo-card p-6',
            className
        )}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-black uppercase">Visual Comparison</h3>

                {/* Metric Selector */}
                <div className="flex gap-2">
                    {(Object.keys(metrics) as Array<keyof typeof metrics>).map((key) => (
                        <button
                            key={key}
                            onClick={() => setMetric(key)}
                            className={clsx(
                                'px-3 py-1.5 font-bold uppercase text-sm border-2 border-black transition-all shadow-[2px_2px_0px_0px_black]',
                                metric === key
                                    ? 'bg-black text-white hover:bg-gray-800'
                                    : 'bg-white text-black hover:bg-gray-100 hover:translate-x-[-1px] hover:translate-y-[-1px]'
                            )}
                        >
                            {key.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="w-full min-w-0 border-2 border-black bg-gray-50 p-4 shadow-inner">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            tick={{ fill: '#000000', fontSize: 12, fontWeight: 700 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#ffffff',
                                borderColor: '#000000',
                                borderWidth: '2px',
                                borderRadius: '0px',
                                color: '#000000',
                                boxShadow: '4px 4px 0px 0px #000000'
                            }}
                            itemStyle={{ color: '#000000', fontWeight: 'bold' }}
                            cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                        />
                        <Bar
                            dataKey={metric}
                            fill={metrics[metric].color}
                            stroke="#000000"
                            strokeWidth={2}
                            radius={[0, 4, 4, 0]}
                            barSize={32}
                            name={metrics[metric].label}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
