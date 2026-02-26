"use client";

import { useTheme } from "next-themes";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { getHourlySales } from "@/lib/data";

export default function SalesChart() {
    const { theme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState<{ name: string; sales: number }[]>([]);

    useEffect(() => {
        setMounted(true);
        const loadData = async () => {
            const hourlySales = await getHourlySales();
            setData(hourlySales);
        };
        loadData();
    }, []);

    if (!mounted) return <div className="h-[300px] w-full mt-4 flex items-center justify-center text-slate-400">Loading chart...</div>;

    const currentTheme = theme === "system" ? systemTheme : theme;
    const isDark = currentTheme === "dark";

    if (data.length === 0) {
        return (
            <div className="h-[300px] w-full mt-4 flex items-center justify-center text-text-tertiary text-sm">
                No sales data for today yet.
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4276fa" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#4276fa" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#e2e8f0"} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }}
                        tickFormatter={(val) => `₱${val}`}
                        dx={-10}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: isDark ? "#0f172a" : "#ffffff",
                            borderColor: isDark ? "#1e293b" : "#e2e8f0",
                            borderRadius: "12px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                        }}
                        itemStyle={{ color: "#4276fa", fontWeight: "bold" }}
                        formatter={(value: string | number | (string | number)[] | undefined) => [`₱${Number(value ?? 0).toLocaleString()}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#4276fa" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
