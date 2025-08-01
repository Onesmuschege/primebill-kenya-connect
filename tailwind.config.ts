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

				// Modern Cyberpunk Tech Theme Colors
				'cyber-blue': {
					50: '#e0f7ff',
					100: '#b3ecff',
					200: '#80e0ff',
					300: '#4dd4ff',
					400: '#1ac8ff',
					500: '#0EA5E9', // Primary Electric Blue
					600: '#0c94d6',
					700: '#0a83c3',
					800: '#0872b0',
					900: '#06619d',
=======
				// Modern Cybersecurity & Tech Theme Colors
				'electric-blue': {
					50: '#f0f9ff',
					100: '#e0f2fe',
					200: '#bae6fd',
					300: '#7dd3fc',
					400: '#38bdf8',
					500: '#0ea5e9', // Primary Electric Blue
					600: '#0284c7',
					700: '#0369a1',
					800: '#075985',
					900: '#0c4a6e',
					950: '#082f49',
				},
				'neon-green': {
					50: '#f0fdf4',
					100: '#dcfce7',
					200: '#bbf7d0',
					300: '#86efac',
					400: '#4ade80',
					500: '#10b981', // Neon Tech Green
					600: '#059669',
					700: '#047857',
					800: '#065f46',
					900: '#064e3b',
					950: '#022c22',
				},
				'cyber-purple': {
					50: '#faf5ff',
					100: '#f3e8ff',
					200: '#e9d5ff',
					300: '#d8b4fe',
					400: '#c084fc',
					500: '#a855f7', // Electric Purple
					600: '#9333ea',
					700: '#7c3aed',
					800: '#6b21a8',
					900: '#581c87',
					950: '#3b0764',
				},
				'tech-gold': {
					50: '#fffbeb',
					100: '#fef3c7',
					200: '#fde68a',
					300: '#fcd34d',
					400: '#fbbf24',
					500: '#f59e0b', // Cyber Gold
					600: '#d97706',
					700: '#b45309',
					800: '#92400e',
					900: '#78350f',
					950: '#451a03',
				},
				'deep-navy': {
					50: '#f8fafc',
					100: '#f1f5f9',
					200: '#e2e8f0',
					300: '#cbd5e1',
					400: '#94a3b8',
					500: '#64748b',
					600: '#475569',
					700: '#334155',
					800: '#1e293b',
					900: '#0f172a', // Deep Tech Navy
					950: '#020617',
				},
				'matrix-green': {
					50: '#f0fdf4',
					100: '#dcfce7',
					200: '#bbf7d0',
					300: '#86efac',
					400: '#4ade80',
					500: '#22c55e',
					600: '#16a34a', // Matrix Green
					700: '#15803d',
					800: '#166534',
					900: '#14532d',
					950: '#052e16',
				},
				
				// Professional ISP theme colors (preserved for compatibility)
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
				'cyber-purple': {
					50: '#f3e8ff',
					100: '#e9d5ff',
					200: '#d8b4ff',
					300: '#c084fc',
					400: '#a855f7',
					500: '#8B5CF6', // Electric Purple
					600: '#7c3aed',
					700: '#6d28d9',
					800: '#5b21b6',
					900: '#4c1d95',
				},
				'cyber-orange': {
					50: '#fff7ed',
					100: '#ffedd5',
					200: '#fed7aa',
					300: '#fdba74',
					400: '#fb923c',
					500: '#F97316', // Cyber Orange
					600: '#ea580c',
					700: '#c2410c',
					800: '#9a3412',
					900: '#7c2d12',
				},
				'cyber-black': {
					50: '#f8fafc',
					100: '#f1f5f9',
					200: '#e2e8f0',
					300: '#cbd5e1',
					400: '#94a3b8',
					500: '#0A0D14', // Deep Space Black
					600: '#1F2937',
					700: '#374151',
					800: '#4B5563',
					900: '#6B7280',
				},
				'cyber-gray': {
					50: '#f9fafb',
					100: '#f3f4f6',
					200: '#e5e7eb',
					300: '#d1d5db',
					400: '#9ca3af',
					500: '#6B7280', // Cyber Gray
					600: '#4B5563',
					700: '#374151',
					800: '#1F2937',
					900: '#111827',
				},
				'cyber-green': {
					50: '#ecfdf5',
					100: '#d1fae5',
					200: '#a7f3d0',
					300: '#6ee7b7',
					400: '#34d399',
					500: '#10B981', // Cyber Green
					600: '#059669',
					700: '#047857',
					800: '#065f46',
					900: '#064e3b',
				},
				'cyber-red': {
					50: '#fef2f2',
					100: '#fee2e2',
					200: '#fecaca',
					300: '#fca5a5',
					400: '#f87171',
					500: '#EF4444', // Neon Red
					600: '#dc2626',
					700: '#b91c1c',
					800: '#991b1b',
					900: '#7f1d1d',
				},
				
				// Enhanced ISP colors
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
				
				// Existing shadcn colors (preserved for compatibility)
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
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
				sans: ['Inter', 'Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				mono: ['JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'monospace'],
				heading: ['DM Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				display: ['Manrope', 'DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				tech: ['Orbitron', 'JetBrains Mono', 'monospace'],
			},
			boxShadow: {
				'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
				'medium': '0 4px 25px -3px rgba(0, 0, 0, 0.1), 0 8px 15px -1px rgba(0, 0, 0, 0.06)',
				'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 8px -2px rgba(0, 0, 0, 0.1)',
				'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
				'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
				'cyber': '0 4px 20px rgba(10, 13, 20, 0.3), 0 2px 10px rgba(14, 165, 233, 0.1)',
				'glow': '0 0 20px rgba(14, 165, 233, 0.3), 0 0 40px rgba(14, 165, 233, 0.1)',
				'cyber-glow': '0 0 30px rgba(139, 92, 246, 0.4), 0 0 60px rgba(139, 92, 246, 0.2)',
				'cyber': '0 4px 20px rgba(10, 25, 47, 0.4), 0 2px 10px rgba(14, 165, 233, 0.15)',
				'tech': '0 8px 32px rgba(14, 165, 233, 0.12), 0 4px 16px rgba(16, 185, 129, 0.08)',
				'glow': '0 0 20px rgba(14, 165, 233, 0.3), 0 0 40px rgba(14, 165, 233, 0.1)',
				'electric': '0 0 10px rgba(14, 165, 233, 0.4), 0 0 20px rgba(14, 165, 233, 0.2), 0 0 30px rgba(14, 165, 233, 0.1)',
				'neon': '0 0 10px rgba(16, 185, 129, 0.4), 0 0 20px rgba(16, 185, 129, 0.2), 0 0 30px rgba(16, 185, 129, 0.1)',
				'cyber-glow': '0 0 15px rgba(168, 85, 247, 0.3), 0 0 30px rgba(168, 85, 247, 0.15)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'2xl': '1rem',
				'3xl': '1.5rem',
				'4xl': '2rem',
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
					'0%, 100%': { boxShadow: '0 0 20px rgba(14, 165, 233, 0.3)' },
					'50%': { boxShadow: '0 0 30px rgba(14, 165, 233, 0.6), 0 0 40px rgba(14, 165, 233, 0.3)' }
				},
				'cyber-pulse': {
					'0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
					'50%': { boxShadow: '0 0 30px rgba(139, 92, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.3)' }
					'0%, 100%': { 
						boxShadow: '0 0 20px rgba(14, 165, 233, 0.3)' 
					},
					'50%': { 
						boxShadow: '0 0 30px rgba(14, 165, 233, 0.6), 0 0 40px rgba(14, 165, 233, 0.3)' 
					}
				},
				'electric-pulse': {
					'0%, 100%': { 
						boxShadow: '0 0 15px rgba(14, 165, 233, 0.4), 0 0 30px rgba(14, 165, 233, 0.2)' 
					},
					'50%': { 
						boxShadow: '0 0 25px rgba(14, 165, 233, 0.7), 0 0 50px rgba(14, 165, 233, 0.4), 0 0 75px rgba(14, 165, 233, 0.2)' 
					}
				},
				'neon-pulse': {
					'0%, 100%': { 
						boxShadow: '0 0 15px rgba(16, 185, 129, 0.4), 0 0 30px rgba(16, 185, 129, 0.2)' 
					},
					'50%': { 
						boxShadow: '0 0 25px rgba(16, 185, 129, 0.7), 0 0 50px rgba(16, 185, 129, 0.4)' 
					}
				},
				'matrix-rain': {
					'0%': { transform: 'translateY(-100%)', opacity: '0' },
					'10%': { opacity: '1' },
					'90%': { opacity: '1' },
					'100%': { transform: 'translateY(100vh)', opacity: '0' }
				},
				'cyber-scan': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.4s ease-out',
				'slide-up': 'slide-up 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'dropdown-open': 'dropdown-open 0.15s ease-out',
				'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
				'cyber-pulse': 'cyber-pulse 2s ease-in-out infinite'
				'electric-pulse': 'electric-pulse 1.5s ease-in-out infinite',
				'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
				'matrix-rain': 'matrix-rain 3s linear infinite',
				'cyber-scan': 'cyber-scan 2s ease-in-out infinite'
			},
			backgroundImage: {
				'tech-grid': 'linear-gradient(rgba(14, 165, 233, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.05) 1px, transparent 1px)',
				'cyber-gradient': 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(16, 185, 129, 0.05) 50%, rgba(168, 85, 247, 0.1) 100%)',
				'matrix-gradient': 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, transparent 50%, rgba(16, 185, 129, 0.05) 100%)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;