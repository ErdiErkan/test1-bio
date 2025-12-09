'use client';

import { useState, useTransition, useOptimistic } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { recordInteraction } from '@/actions/analytics';

interface BoostButtonProps {
    celebrityId: string;
    initialBoosts?: number; // Optional, if we want to show count
    locale: string;
}

export function BoostButton({ celebrityId, initialBoosts = 0, locale }: BoostButtonProps) {
    const [isPending, startTransition] = useTransition();
    // We can track local clicks purely for visual feedback or use optimistic state if we had a total count
    // Since real-time total count comes from server periodically, we'll just optimistically show animation

    const handleBoost = () => {
        // 1. Visual Feedback (Confetti)
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF4500'], // Gold/Orange/Red theme
            zIndex: 9999,
        });

        // 2. Server Action
        startTransition(async () => {
            await recordInteraction({
                celebrityId,
                type: 'boost',
                locale,
                // We could pass category/zodiac if we had them in props, 
                // but for now the action schema makes them optional.
                // If we want accurate category ranking, we should pass them.
                // Assuming parent might not always pass detailed taxonomy for a simple button.
            });
        });
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBoost}
            disabled={isPending}
            className={`
        relative overflow-hidden group
        bg-gradient-to-r from-yellow-400 to-orange-500
        text-white font-bold py-2 px-6 rounded-full shadow-lg
        flex items-center gap-2
        hover:shadow-orange-500/50 transition-shadow duration-300
      `}
            aria-label="Boost this celebrity"
        >
            <span className="text-xl">🚀</span>
            <span className="uppercase tracking-wider text-sm">Boost</span>

            {/* Ripple Effect or Shine optional */}
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
        </motion.button>
    );
}
