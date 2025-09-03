module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'pht-gold': 'var(--pht-gold)',
        'pht-gold-600': 'var(--pht-gold-600)',
        'pht-charcoal': 'var(--pht-charcoal)',
        'pht-ink': 'var(--pht-ink)',
        'pht-paper': 'var(--pht-paper)',
        'pht-accent': 'var(--pht-accent)'
      }
    }
  },
  plugins: []
};
