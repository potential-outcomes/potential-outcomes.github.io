import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        light: {
          background: {
            DEFAULT: '#FFFFFF',
            secondary: '#F3F4F6',
            tertiary: '#E5E7EB',
          },
          text: {
            primary: '#1F2937',
            secondary: '#4B5563',
            tertiary: '#6B7280',
          },
          primary: {
            DEFAULT: '#0284C7',
            light: '#38BDF8',
            dark: '#0369A1',
          },
          secondary: {
            DEFAULT: '#7C3AED',
            light: '#A78BFA',
            dark: '#6D28D9',
          },
          accent: {
            DEFAULT: '#F59E0B',
            light: '#FCD34D',
            dark: '#D97706',
          },
          success: {
            DEFAULT: '#10B981',
            light: '#34D399',
            dark: '#059669',
          },
          error: {
            DEFAULT: '#EF4444',
            light: '#F87171',
            dark: '#DC2626',
          },
          warning: {
            DEFAULT: '#F59E0B',
            light: '#FBBF24',
            dark: '#D97706',
          },
        },
        dark: {
          background: {
            DEFAULT: '#1F2937',
            secondary: '#111827',
            tertiary: '#374151',
          },
          text: {
            primary: '#F9FAFB',
            secondary: '#E5E7EB',
            tertiary: '#D1D5DB',
          },
          primary: {
            DEFAULT: '#38BDF8',
            light: '#7DD3FC',
            dark: '#0284C7',
          },
          secondary: {
            DEFAULT: '#A78BFA',
            light: '#C4B5FD',
            dark: '#7C3AED',
          },
          accent: {
            DEFAULT: '#FBBF24',
            light: '#FDE68A',
            dark: '#F59E0B',
          },
          success: {
            DEFAULT: '#34D399',
            light: '#6EE7B7',
            dark: '#10B981',
          },
          error: {
            DEFAULT: '#F87171',
            light: '#FCA5A5',
            dark: '#EF4444',
          },
          warning: {
            DEFAULT: '#FBBF24',
            light: '#FDE68A',
            dark: '#F59E0B',
          },
        },
      },
      backdropFilter: {
        'none': 'none',
        'grayscale': 'grayscale(1)',
      },
      borderWidth: {
        '1': '1px',
        '3': '3px',
        '5': '5px',
        '6': '6px',
        '7': '7px',
        '9': '9px',
        '10': '10px',
        '11': '11px',
        '12': '12px',
        '13': '13px',
        '14': '14px',
        '15': '15px',
      },
    },
  },
  variants: {
    backdropFilter: ['responsive'],
    borderWidth: ['responsive', 'hover', 'focus'],
  },
  plugins: [
    require('tailwindcss-filters'),
    require("tailwindcss-inner-border"),
  ],
};

export default config;