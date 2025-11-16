
import React from 'react';
import { useTheme } from '../App';

const AuthIllustration: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const colors = {
        bg: isDark ? '#111111' : '#FFFFFF',
        primary: '#3B82F6',
        stool: '#2563EB',
        skin: '#FDBA74',
        hair: '#1F2937',
        shirt: '#1F2937',
        pants: '#374151',
        shoes: '#4B5563',
        plantPot: '#2563EB',
        plantLeaves: isDark ? '#60A5FA' : '#1E40AF',
        laptop: isDark ? '#4B5563' : '#E5E7EB',
        phone: '#374151',
        uiWindow: isDark ? '#1F2937' : '#F9FAFB',
        uiWindowBorder: isDark ? '#374151' : '#E5E7EB',
        textLight: isDark ? '#9CA3AF' : '#6B7280',
        textDark: isDark ? '#F9FAFB' : '#1F2937',
        codeBg: isDark ? '#374151' : '#E5E7EB'
    };
    
    return (
        <svg viewBox="0 0 350 350" xmlns="http://www.w3.org/2000/svg">
            <g>
                {/* Background elements */}
                <rect x="250" y="270" width="80" height="40" rx="5" fill={colors.codeBg} opacity="0.5"/>
                <rect x="250" y="220" width="80" height="40" rx="5" fill={colors.codeBg} opacity="0.5"/>

                {/* Stool */}
                <rect x="90" y="230" width="80" height="20" rx="10" fill={colors.stool} />
                <rect x="95" y="250" width="10" height="60" fill={colors.stool} />
                <rect x="155" y="250" width="10" height="60" fill={colors.stool} />
                
                {/* Person */}
                <g>
                    {/* Legs */}
                    <path d="M160 235 Q 170 270 180 300 L 190 310 L 170 315 L 160 280 Z" fill={colors.pants} />
                    <rect x="175" y="305" width="25" height="15" fill={colors.shoes} />
                    <path d="M100 235 Q 90 270 80 300 L 70 310 L 90 315 L 100 280 Z" fill={colors.pants} />
                    <rect x="65" y="305" width="25" height="15" fill={colors.shoes} />

                    {/* Torso & Head */}
                    <path d="M95 160 C 90 200, 170 200, 165 160 L 160 130 C 150 100, 110 100, 100 130 Z" fill={colors.shirt} />
                    <circle cx="130" cy="115" r="30" fill={colors.skin} />
                    <path d="M110 90 C 120 80, 140 80, 150 90 A 30 30 0 0 1 110 90 Z" fill={colors.hair} />
                    <circle cx="120" cy="115" r="2" fill={colors.hair} />
                    <circle cx="140" cy="115" r="2" fill={colors.hair} />
                    <path d="M128 128 Q 130 132 132 128" stroke={colors.hair} strokeWidth="1.5" fill="none" strokeLinecap="round"/>

                    {/* Arms & Laptop */}
                    <path d="M95 160 L 70 190 L 110 205 L 130 170" fill={colors.shirt} />
                    <rect x="100" y="195" width="80" height="50" rx="5" transform="rotate(-15 140 220)" fill={colors.laptop}/>
                    <rect x="105" y="200" width="70" height="40" rx="2" transform="rotate(-15 140 220)" fill={colors.uiWindow} />
                </g>
                
                {/* Plant */}
                <rect x="260" y="230" width="50" height="50" rx="5" fill={colors.plantPot} />
                <path d="M285 230 C 260 180, 330 180, 305 230" fill={colors.plantLeaves} />
                <path d="M285 230 C 270 190, 310 190, 295 230" fill={colors.plantLeaves} />
                <path d="M285 230 C 280 200, 295 200, 290 230" fill={colors.plantLeaves} />

                {/* Floating UI: Login Window */}
                <g>
                    <rect x="170" y="50" width="140" height="90" rx="8" fill={colors.uiWindow} stroke={colors.uiWindowBorder} strokeWidth="2"/>
                    <circle cx="182" cy="62" r="3" fill="#EF4444" />
                    <circle cx="192" cy="62" r="3" fill="#FBBF24" />
                    <circle cx="202" cy="62" r="3" fill="#10B981" />
                    <path d="M230 75 a 10 10 0 0 1 20 0 v 5 a 2 2 0 0 1 -2 2 h -16 a 2 2 0 0 1 -2 -2 z" fill={colors.primary} />
                    <path d="M235 72 a 5 5 0 0 1 10 0 v 5 h -10 z" stroke={colors.uiWindow} strokeWidth="1.5" fill="none"/>
                    <rect x="185" y="95" width="110" height="8" rx="4" fill={colors.codeBg} />
                    <rect x="185" y="110" width="110" height="8" rx="4" fill={colors.codeBg} />
                </g>

                {/* Floating UI: Code Entry */}
                <g>
                    <rect x="180" y="160" width="120" height="50" rx="8" fill={colors.uiWindow} stroke={colors.uiWindowBorder} strokeWidth="2"/>
                    <text x="240" y="175" textAnchor="middle" fontSize="6" fontWeight="bold" fill={colors.textLight}>ENTER CODE</text>
                    <rect x="190" y="182" width="15" height="20" rx="3" fill={colors.codeBg} />
                    <rect x="210" y="182" width="15" height="20" rx="3" fill={colors.codeBg} />
                    <rect x="230" y="182" width="15" height="20" rx="3" fill={colors.codeBg} />
                    <rect x="250" y="182" width="15" height="20" rx="3" fill={colors.codeBg} />
                    <rect x="270" y="182" width="15" height="20" rx="3" fill={colors.codeBg} />
                </g>

                {/* Floating UI: Phone with code */}
                <g>
                    <path d="M60 150 L 50 170 A 10 10 0 0 0 60 180 L 110 180 A 10 10 0 0 0 120 170 L 110 150 Z" fill={colors.phone} />
                    <rect x="55" y="120" width="60" height="30" rx="5" fill={colors.uiWindow} />
                    <text x="85" y="128" textAnchor="middle" fontSize="4" fill={colors.textLight}>YOUR CODE</text>
                    <text x="85" y="142" textAnchor="middle" fontSize="10" fontWeight="bold" fill={colors.primary} letterSpacing="1">64370</text>
                </g>

                {/* Floating UI: Shield */}
                <g opacity="0.5">
                    <path d="M40 70 L 40 100 C 40 120, 80 130, 80 130 C 80 130, 120 120, 120 100 L 120 70 L 80 50 Z" fill={colors.codeBg}/>
                    <circle cx="80" cy="90" r="12" fill={colors.bg} />
                    <path d="M80 85 v 8 M76 95 a 4 4 0 0 1 8 0" stroke={colors.textLight} strokeWidth="2" fill="none" />
                </g>
            </g>
        </svg>
    );
};

export default AuthIllustration;
