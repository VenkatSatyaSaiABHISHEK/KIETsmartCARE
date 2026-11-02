// Design tokens shared across web and student app
export const SPACING = {
    1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48,
};
export const RADIUS = {
    sm: 8, md: 12, lg: 16, xl: 20,
};
export const DURATION = {
    fast: 150, base: 200, slow: 300,
};
export const EASING = 'cubic-bezier(0.2, 0, 0, 1)';
export const COLORS = {
    student: {
        bg: '#FFFFFF',
        text: '#121212',
        textSecondary: '#555555',
        card: '#0A0A0A',
        cardText: '#FFFFFF',
        divider: '#EBEBEB',
        green: '#166534',
        red: '#991B1B',
        border: '#E5E5E5',
    },
    doctor: {
        bg: '#FFFFFF',
        surface: '#F8FAFC',
        border: '#E8EDF2',
        text: '#0F172A',
        textSecondary: '#475569',
        accent: '#2563EB',
        accentHover: '#1D4ED8',
        red: '#DC2626',
        amber: '#B45309',
    },
};
export const TYPOGRAPHY = {
    student: {
        fontFamily: 'Plus Jakarta Sans',
        sizes: {
            xs: 11, sm: 13, base: 15, lg: 17, xl: 20, '2xl': 24, '3xl': 30,
        },
    },
    web: {
        fontFamily: 'Inter',
        serifFamily: 'Source Serif 4',
        sizes: {
            xs: 11, sm: 13, base: 15, lg: 17, xl: 20, '2xl': 24, '3xl': 30, display: 38,
        },
    },
};
// Tap target minimum
export const MIN_TAP_TARGET = 48;
