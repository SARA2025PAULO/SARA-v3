import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Inter', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        sara: {
          primary: '#4F46E5', // Un azul/púrpura vibrante
          secondary: '#6366F1', // Un tono ligeramente más claro
          accent: '#A78BFA', // Un tono púrpura más claro para acentos
          text: '#1F2937', // Color de texto oscuro general
          background: '#F9FAFB', // Fondo muy claro
          white: '#FFFFFF', // Blanco puro
          gray: {
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#9CA3AF',
            500: '#6B7280',
            600: '#4B5563',
            700: '#374151',
            800: '#1F2937',
            900: '#111827',
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
         // Animaciones personalizadas para la landing page
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        hoverPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        rotateIcon: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        notificationPop: {
          '0%': { opacity: '0', transform: 'scale(0.8) translateY(10px)' },
          '70%': { opacity: '1', transform: 'scale(1.05) translateY(-5px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        mockupAnimation: {
          '0%': { transform: 'translateY(0) scale(1)' },
          '25%': { transform: 'translateY(-5px) scale(1.01)' },
          '50%': { transform: 'translateY(0) scale(1)' },
          '75%': { transform: 'translateY(-5px) scale(1.01)' },
          '100%': { transform: 'translateY(0) scale(1)' },
        },
        contractExpand: {
          '0%': { width: '50px', opacity: '0' },
          '100%': { width: '200px', opacity: '1' },
        },
        calendarGrowth: {
          '0%': { height: '20px', opacity: '0' },
          '100%': { height: '150px', opacity: '1' },
        },
        cursorMove: {
          '0%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(10px, 10px)' },
          '100%': { transform: 'translate(0, 0)' },
        },
        cursorClick: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.8)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        fadeInUp: 'fadeInUp 0.6s ease-out forwards',
        scaleIn: 'scaleIn 0.5s ease-out forwards',
        hoverPulse: 'hoverPulse 1s infinite',
        slideInLeft: 'slideInLeft 0.7s ease-out forwards',
        slideInRight: 'slideInRight 0.7s ease-out forwards',
        rotateIcon: 'rotateIcon 0.8s ease-in-out',
        notificationPop: 'notificationPop 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards',
        mockupAnimation: 'mockupAnimation 4s ease-in-out infinite',
        contractExpand: 'contractExpand 0.8s ease-out forwards',
        calendarGrowth: 'calendarGrowth 0.8s ease-out forwards',
        cursorMove: 'cursorMove 2s ease-in-out infinite',
        cursorClick: 'cursorClick 0.3s ease-in-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
