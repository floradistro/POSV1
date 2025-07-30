// Flora Distro POS - Shared Style Constants
// Based on Flora Distro's luxury cannabis brand aesthetic

// Section styles
export const sectionStyles = {
  base: "relative overflow-hidden",
  withBackground: "relative bg-background-secondary overflow-hidden",
  darkBackground: "relative bg-background-dark overflow-hidden",
  glass: "relative flora-glass overflow-hidden",
};

// Button styles matching Flora's aesthetic
export const buttonStyles = {
  primary: "flora-btn-primary group relative inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-luxury-base transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-flora hover:shadow-flora-lg focus:outline-none focus:ring-0 select-none overflow-hidden",
  secondary: "flora-btn-secondary group relative inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-luxury-base transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-flora hover:shadow-flora-lg focus:outline-none focus:ring-0 select-none overflow-hidden",
  ghost: "text-text-secondary hover:text-text-primary transition-colors duration-300 underline underline-offset-4 decoration-text-tertiary hover:decoration-text-secondary",
  icon: "p-3 flora-glass hover:bg-background-tertiary rounded-lg transition-all duration-300 hover:scale-105 active:scale-95",
};

// Card styles with Flora's glass morphism
export const cardStyles = {
  base: "flora-glass rounded-lg p-4 transition-all duration-500 hover:shadow-flora-lg",
  product: "flora-glass rounded-lg p-6 transition-all duration-500 hover:shadow-flora-xl hover:scale-[1.02]",
  compact: "flora-glass rounded-lg p-3 transition-all duration-300 hover:shadow-flora",
  elevated: "bg-gradient-to-br from-background-secondary to-background-tertiary border border-border-default rounded-lg p-6 shadow-flora-lg hover:shadow-flora-xl transition-all duration-500",
};

// Text styles matching Flora's luxury typography
export const textStyles = {
  heading: "text-text-primary font-light text-luxury-2xl tracking-luxury-normal mb-3 hover:text-secondary transition-colors duration-500 cursor-default",
  subheading: "text-text-secondary font-light text-luxury-lg tracking-luxury-normal mb-2",
  body: "text-text-primary font-light text-luxury-base leading-relaxed",
  caption: "text-text-tertiary font-light text-luxury-sm tracking-luxury-wide",
  label: "text-text-secondary font-medium text-luxury-sm tracking-luxury-normal uppercase",
  price: "text-secondary font-semibold text-luxury-lg tracking-luxury-tight",
  muted: "text-text-tertiary font-light text-luxury-sm tracking-luxury-wide italic hover:text-text-secondary transition-colors duration-300",
};

// Animation classes
export const animationStyles = {
  fadeIn: "opacity-0 animate-fade-in",
  fadeInUp: "opacity-0 animate-fade-in-up",
  slideIn: "animate-slide-in",
  subtleGlow: "animate-subtle-glow",
};

// Layout styles
export const layoutStyles = {
  container: "container mx-auto px-4 md:px-6",
  maxWidth: "max-w-4xl mx-auto",
  maxWidthLarge: "max-w-6xl mx-auto",
  centered: "flex items-center justify-center",
  grid: "grid gap-4 md:gap-6",
  flexBetween: "flex items-center justify-between",
};

// Input styles matching Flora's aesthetic
export const inputStyles = {
  base: "w-full px-4 py-3 bg-background-secondary border border-border-default rounded-lg text-text-primary placeholder-text-tertiary focus:border-secondary focus:ring-0 focus:outline-none transition-colors duration-300",
  search: "w-full px-4 py-3 pl-10 bg-background-secondary border border-border-default rounded-lg text-text-primary placeholder-text-tertiary focus:border-secondary focus:ring-0 focus:outline-none transition-colors duration-300",
  select: "w-full px-4 py-3 bg-background-secondary border border-border-default rounded-lg text-text-primary focus:border-secondary focus:ring-0 focus:outline-none transition-colors duration-300 appearance-none cursor-pointer",
};

// Status colors matching Flora's palette
export const statusColors = {
  success: "text-success border-success bg-success/10",
  error: "text-error border-error bg-error/10",
  warning: "text-warning border-warning bg-warning/10",
  info: "text-secondary border-secondary bg-secondary/10",
};

// Flora specific gradients
export const floraGradients = {
  primary: "bg-gradient-to-br from-background-secondary to-background-tertiary",
  secondary: "bg-gradient-to-br from-secondary to-secondary-dark",
  cannabis: "bg-gradient-to-br from-cannabis-sage to-cannabis-forest",
  luxury: "bg-gradient-to-br from-luxury-gold to-luxury-charcoal",
  glass: "bg-gradient-to-br from-white/8 to-white/3 hover:from-white/12 hover:to-white/6",
};

// Spacing system
export const spacing = {
  xs: "0.5rem",
  sm: "0.75rem", 
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  "3xl": "4rem",
};

// Flora POS specific component styles
export const posStyles = {
  sidebar: "w-64 bg-background-secondary border-r border-border-default flex flex-col",
  header: "h-16 bg-background-secondary border-b border-border-default flex items-center justify-between px-6",
  main: "flex-1 bg-background p-6 overflow-auto",
  productGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6",
  cartPanel: "w-80 bg-background-secondary border-l border-border-default flex flex-col",
};

// Utility function to combine classes
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
}; 