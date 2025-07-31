import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				// Modern Tech + Kenyan Accent + Cybersecurity Theme Colors
				'ocean-blue': {
					50: '#e6f4ff',
					100: '#bae0ff',
					200: '#91ccff',
					300: '#69b8ff',
					400: '#40a4ff',
					500: '#0077B6', // Primary Ocean Blue
					600: '#006ba3',
					700: '#005c8f',
					800: '#004d7a',
					900: '#003d66',
				},
				'forest-green': {
					50: '#e8f5e8',
					100: '#c3e6c3',
					200: '#9dd69d',
					300: '#78c678',
					400: '#52b652',
					500: '#2E8B57', // Accent Forest Green
					600: '#297d4e',
					700: '#246f44',
					800: '#1f613b',
					900: '#1a5331',
				},
				'cyber-navy': {
					50: '#e6ecf5',
					100: '#bfd1e6',
					200: '#99b6d6',
					300: '#729bc7',
					400: '#4c80b7',
					500: '#0A192F', // Dark Base Cyber Navy
					600: '#09172a',
					700: '#081425',
					800: '#061220',
					900: '#050f1a',
				},
				'sand-gold': {
					50: '#fefaf5',
					100: '#fcf2e6',
					200: '#f9e9d6',
					300: '#f7e1c7',
					400: '#f5d8b7',
					500: '#F4A460', // Card Accent Sand Gold
					600: '#f19440',
					700: '#ee8320',
					800: '#eb7300',
					900: '#d66700',
				},
				'charcoal-grey': {
					50: '#f5f5f5',
					100: '#e8e8e8',
					200: '#dadada',
					300: '#cdcdcd',
					400: '#bfbfbf',
					500: '#1F1F1F', // Text Charcoal Grey
					600: '#1c1c1c',
					700: '#191919',
					800: '#161616',
					900: '#131313',
				},
				'light-grey': {
					50: '#fdfdfd',
					100: '#fcfcfc',
					200: '#fafafa',
					300: '#f9f9f9',
					400: '#f8f8f8',
					500: '#F8F9FA', // Background Light Grey
					600: '#e0e1e3',
					700: '#c7c9cc',
					800: '#afb0b4',
					900: '#96989d',
				},
				'alert-red': {
					50: '#fff5f5',
					100: '#ffe0e0',
					200: '#ffcccc',
					300: '#ffb3b3',
					400: '#ff9999',
					500: '#FF4C4C', // Alert/Errors Red
					600: '#e63333',
					700: '#cc1a1a',
					800: '#b30000',
					900: '#990000',
				},
				
				// Professional ISP theme colors (preserved for compatibility)
				'isp-blue': {
					50: '#eff6ff',
					100: '#dbeafe',
					200: '#bfdbfe',
					300: '#93c5fd',
					400: '#60a5fa',
					500: '#1e40af', // Deep blue primary
					600: '#1d4ed8',
					700: '#1e3a8a',
					800: '#1e3a8a',
					900: '#1e293b',
					950: '#0f172a',
				},
				'isp-teal': {
					50: '#f0fdfa',
					100: '#ccfbf1',
					200: '#99f6e4',
					300: '#5eead4',
					400: '#2dd4bf',
					500: '#14b8a6', // Teal accent
					600: '#0d9488',
					700: '#0f766e',
					800: '#115e59',
					900: '#134e4a',
				},
				'isp-coral': {
					50: '#fef2f2',
					100: '#fee2e2',
					200: '#fecaca',
					300: '#fca5a5',
					400: '#f87171',
					500: '#ef4444', // Coral accent
					600: '#dc2626',
					700: '#b91c1c',
					800: '#991b1b',
					900: '#7f1d1d',
				},
				'isp-gray': {
					50: '#f8fafc',
					100: '#f1f5f9',
					200: '#e2e8f0',
					300: '#cbd5e1',
					400: '#94a3b8',
					500: '#64748b', // Light gray
					600: '#475569',
					700: '#334155',
					800: '#1e293b',
					900: '#0f172a',
				},
				
				// Existing shadcn colors (preserved for compatibility)
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			fontFamily: {
				sans: ['Poppins', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
				heading: ['DM Sans', 'Poppins', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				display: ['Manrope', 'DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
			},
			boxShadow: {
				'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
				'medium': '0 4px 25px -3px rgba(0, 0, 0, 0.1), 0 8px 15px -1px rgba(0, 0, 0, 0.06)',
				'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 8px -2px rgba(0, 0, 0, 0.1)',
				'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
				'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
				'cyber': '0 4px 20px rgba(10, 25, 47, 0.3), 0 2px 10px rgba(0, 119, 182, 0.1)',
				'glow': '0 0 20px rgba(0, 119, 182, 0.3), 0 0 40px rgba(0, 119, 182, 0.1)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'2xl': '1rem',
				'3xl': '1.5rem',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-up': {
					'0%': { opacity: '0', transform: 'translateY(30px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					'0%': { opacity: '0', transform: 'scale(0.95)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'dropdown-open': {
					'0%': { opacity: '0', transform: 'translateY(-10px) scale(0.95)' },
					'100%': { opacity: '1', transform: 'translateY(0) scale(1)' }
				},
				'glow-pulse': {
					'0%, 100%': { boxShadow: '0 0 20px rgba(0, 119, 182, 0.3)' },
					'50%': { boxShadow: '0 0 30px rgba(0, 119, 182, 0.6), 0 0 40px rgba(0, 119, 182, 0.3)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.4s ease-out',
				'slide-up': 'slide-up 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'dropdown-open': 'dropdown-open 0.15s ease-out',
				'glow-pulse': 'glow-pulse 2s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
