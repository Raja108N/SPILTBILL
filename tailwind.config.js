/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: 'var(--color-bg)',
                surface: 'var(--color-surface)',
                'surface-hover': 'var(--color-surface-hover)',
                primary: 'var(--color-primary)',
                'primary-dim': 'var(--color-primary-dim)',
                accent: 'var(--color-accent)',
                text: 'var(--color-text)',
                muted: 'var(--color-text-muted)',
                border: 'var(--color-border)',
                danger: 'var(--color-danger)',
                success: 'var(--color-success)',
            },
            borderRadius: {
                md: 'var(--radius-md)',
                lg: 'var(--radius-lg)',
                full: 'var(--radius-full)',
            },
            boxShadow: {
                glow: 'var(--shadow-glow)',
                'glow-accent': 'var(--shadow-glow-accent)',
            },
        },
    },
    plugins: [],
}
