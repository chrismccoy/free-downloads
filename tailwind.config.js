/**
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ["./views/**/*.ejs"],

  theme: {
    extend: {
      colors: {
        'dark': '#0f172a',    // Primary background/border color (Slate-900)
        'primary': '#fef08a', // Accent yellow (Yellow-200)
        
        slate: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0', // Main background gray
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a', // Main text/border color
        },
        cyan: {
            400: '#22d3ee', // Primary action buttons (Cyan)
            500: '#06b6d4',
        },
        fuchsia: {
            500: '#d946ef', // Secondary action buttons (Pink)
            600: '#c026d3',
        },
        lime: {
            400: '#a3e635', // Tag buttons (Green)
        }
      },

      fontFamily: {
        'mono': [
            'ui-monospace', 
            'SFMono-Regular', 
            'Menlo', 
            'Monaco', 
            'Consolas', 
            "Liberation Mono", 
            "Courier New", 
            'monospace'
        ],
      },
    },
  },

  plugins: [
    require('@tailwindcss/typography'),
  ],
};
