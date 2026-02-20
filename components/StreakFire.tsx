
import React from 'react';
import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    streak: number;
    level: 'orange' | 'blue' | 'purple';
    size?: number;
}

const StreakFire: React.FC<Props> = ({ streak, level, size = 24 }) => {
    // Define color mappings
    const configs = {
        orange: {
            color: '#FF6B00',
            glow: 'rgba(255, 107, 0, 0.4)',
            label: 'Chillar Rookie'
        },
        blue: {
            color: '#00D1FF',
            glow: 'rgba(0, 209, 255, 0.4)',
            label: 'Savings Pro'
        },
        purple: {
            color: '#CC00FF',
            glow: 'rgba(204, 0, 255, 0.4)',
            label: 'Wealth Master'
        }
    };

    const config = configs[level] || configs.orange;

    return (
        <div className="flex items-center gap-2">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: 1
                }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    repeatType: "reverse"
                }}
                className="relative"
            >
                {/* Glow Effect */}
                <div
                    className="absolute inset-0 blur-[12px] opacity-60 rounded-full"
                    style={{ backgroundColor: config.color }}
                />

                {/* Fire Icon */}
                <Flame
                    size={size}
                    fill={config.color}
                    stroke={config.color}
                    className="relative z-10 drop-shadow-lg"
                    style={{ strokeWidth: 1.5 }}
                />
            </motion.div>

            <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter leading-none" style={{ color: config.color }}>
                    {streak}
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Day Streak</span>
            </div>
        </div>
    );
};

export default StreakFire;
