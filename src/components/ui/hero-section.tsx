import React from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Globe, Zap, Clock, Award, ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted?: () => void;
  onLearnMore?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onGetStarted,
  onLearnMore,
}) => {
  const features = [
    {
      icon: Shield,
      title: 'Cybersecurity First',
      description: 'Military-grade encryption & threat protection',
    },
    {
      icon: Zap,
      title: 'Ultra-Fast Speeds',
      description: 'Up to 1Gbps fiber connectivity across Kenya',
    },
    {
      icon: Clock,
      title: '24/7 Local Support',
      description: 'Kenyan-based support team available round-the-clock',
    },
    {
      icon: Award,
      title: 'ISO Certified',
      description: 'ISO 27001 certified security standards',
    },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with Kenyan tech overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyber-navy-500 via-cyber-navy-600 to-ocean-blue-800">
        {/* Nairobi skyline silhouette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-cyber-navy-500/80 to-transparent"></div>
        
        {/* Tech grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-[linear-gradient(rgba(0,119,182,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(0,119,182,0.3)_1px,transparent_1px)]" style={{ backgroundSize: '50px 50px' }}></div>
        </div>
        
        {/* Floating tech elements */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-ocean-blue-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-forest-green-400 rounded-full animate-pulse animation-delay-300"></div>
        <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-sand-gold-400 rounded-full animate-pulse animation-delay-700"></div>
        <div className="absolute bottom-20 right-1/3 w-1 h-1 bg-ocean-blue-300 rounded-full animate-pulse animation-delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          {/* Brand Badge */}
          <div className="inline-flex items-center space-x-2 bg-ocean-blue-500/20 backdrop-blur-sm border border-ocean-blue-400/30 rounded-full px-4 py-2">
            <Shield className="h-4 w-4 text-ocean-blue-400" />
            <span className="text-sm font-medium text-ocean-blue-200">
              Kenya's Cybersecurity ISP Leader
            </span>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-white leading-tight">
              Secure Internet for
              <br />
              <span className="bg-gradient-to-r from-sand-gold-400 via-sand-gold-500 to-sand-gold-600 bg-clip-text text-transparent">
                Modern Kenya
              </span>
            </h1>
            <p className="text-lg md:text-xl text-ocean-blue-200 max-w-3xl mx-auto leading-relaxed">
              Experience ultra-fast, secure internet connectivity with our cutting-edge 
              cybersecurity infrastructure. Proudly serving homes and businesses across Kenya 
              with 24/7 local support.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              variant="default" 
              size="xl" 
              onClick={onGetStarted}
              className="group"
            >
              Get Started Today
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="xl" 
              onClick={onLearnMore}
              className="border-ocean-blue-400/50 text-ocean-blue-200 hover:bg-ocean-blue-400/10"
            >
              <Globe className="h-5 w-5 mr-2" />
              Coverage Areas
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="pt-8">
            <p className="text-sm text-ocean-blue-300 mb-6">
              Trusted by 10,000+ customers across Kenya
            </p>
            <div className="flex flex-wrap justify-center items-center space-x-8 text-ocean-blue-400">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span className="text-sm">CA Licensed</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4" />
                <span className="text-sm">ISO 27001</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span className="text-sm">99.9% Uptime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-white/10 backdrop-blur-sm border border-ocean-blue-400/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-ocean-blue-500 to-ocean-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:shadow-glow transition-all duration-200">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-ocean-blue-200 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  );
};