import React from 'react';
import { motion } from 'framer-motion';
import { InterviewState } from '@/lib/types';

interface VoiceInterfaceProps {
    state: InterviewState;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ state }) => {
    return (
        <div className="w-full h-20 flex items-center justify-center">
            {state === 'idle' && (
                <div className="text-[#6b6b70] text-xs">Ready</div>
            )}

            {state === 'listening' && (
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <motion.div
                            key={i}
                            className="w-1.5 bg-red-500 rounded-full"
                            animate={{
                                height: [8, 28, 8],
                            }}
                            transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.08,
                            }}
                        />
                    ))}
                </div>
            )}

            {state === 'processing' && (
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-t-orange-500 border-r-orange-500 border-b-transparent border-l-transparent rounded-full"
                />
            )}

            {state === 'speaking' && (
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <motion.div
                            key={i}
                            className="w-1.5 bg-orange-400 rounded-full"
                            animate={{ height: [6, 24, 6] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08 }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default VoiceInterface;