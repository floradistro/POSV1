import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sf-pro': ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        'sans': ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        'graffiti': ['DonGraffiti', 'Impact', 'Arial Black', 'sans-serif'],
      },
      colors: {
        // VSCode Dark Theme Colors
        vscode: {
          bg: '#1E1E1E',           // Main background
          bgSecondary: '#252526',   // Secondary background  
          bgTertiary: '#2D2D30',    // Tertiary background
          sidebar: '#333333',       // Sidebar background
          panel: '#3C3C3C',         // Panel background
          border: '#454545',        // Border color
          text: '#CCCCCC',          // Primary text
          textSecondary: '#969696', // Secondary text
          textMuted: '#6A6A6A',     // Muted text
          accent: '#F14C4C',        // Subtle red accent
          accentHover: '#FF6B6B',   // Red accent hover
          accentDark: '#D32F2F',    // Darker red
        },
        // Keep luxury colors for compatibility but update to VSCode theme
        luxury: {
          gold: '#F14C4C',      // Changed to red accent
          platinum: '#CCCCCC',   // VSCode text color
          charcoal: '#1E1E1E',   // VSCode main bg
          cream: '#F5F5F5',      // Light text
          sage: '#87A96B',       // Keep for cannabis context
        },
        cannabis: {
          forest: '#355E3B',
          sage: '#87A96B',
          mint: '#98FB98',
        },
        // POS specific colors updated to VSCode theme
        primary: {
          DEFAULT: '#1E1E1E',    // VSCode main bg
          dark: '#252526',       // VSCode secondary bg
          light: '#2D2D30',      // VSCode tertiary bg
        },
        secondary: {
          DEFAULT: '#F14C4C',    // Red accent
          dark: '#D32F2F',       // Darker red
          light: '#FF6B6B',      // Lighter red
        },
        success: '#4CAF50',      // Green success
        error: '#F14C4C',        // Red error
        warning: '#FF9800',      // Orange warning
        background: {
          DEFAULT: '#1E1E1E',    // VSCode main bg
          secondary: '#252526',   // VSCode secondary bg
          tertiary: '#2D2D30',    // VSCode tertiary bg
          dark: '#181818',        // Even darker
          sidebar: '#333333',     // VSCode sidebar
          panel: '#3C3C3C',       // VSCode panel
        },
        text: {
          DEFAULT: '#CCCCCC',              // VSCode primary text
          secondary: '#969696',            // VSCode secondary text
          tertiary: '#6A6A6A',            // VSCode muted text
        },
        border: {
          DEFAULT: '#454545',              // VSCode border
          light: '#3E3E3E',               // Lighter border
          hover: '#5A5A5A',               // Hover border
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 1s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out',
        'subtle-glow': 'subtleGlow 3s ease-in-out infinite',
        'gradient-flash': 'gradientFlash 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        subtleGlow: {
          '0%': { opacity: '0.6' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.6' },
        },
        gradientFlash: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'vscode': '0 2px 8px rgba(0,0,0,0.3)',
        'vscode-lg': '0 4px 16px rgba(0,0,0,0.4)',
        'vscode-xl': '0 8px 32px rgba(0,0,0,0.5)',
      }
    },
  },
  plugins: [],
}
export default config 