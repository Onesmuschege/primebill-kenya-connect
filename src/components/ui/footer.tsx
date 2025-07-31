import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  ExternalLink,
  Shield,
  Globe
} from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const supportLinks = [
    { name: 'Help Center', href: '/help' },
    { name: 'Contact Support', href: '/support' },
    { name: 'Network Status', href: '/status' },
    { name: 'Service Coverage', href: '/coverage' },
  ];

  const companyLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
    { name: 'Partners', href: '/partners' },
  ];

  const legalLinks = [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Service Agreement', href: '/agreement' },
    { name: 'Data Protection', href: '/data-protection' },
  ];

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: 'https://facebook.com/primebillkenya' },
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/primebillkenya' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/primebill-kenya' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/primebillkenya' },
  ];

  return (
    <footer className="footer-cyber">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Information */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-ocean-blue-500 to-ocean-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-heading font-bold text-white">
                  PrimeBill Kenya
                </h3>
              </div>
              <p className="text-sm text-ocean-blue-200 mb-4 leading-relaxed">
                Kenya's leading cybersecurity-focused ISP delivering ultra-fast, 
                secure internet connectivity with 24/7 support across major cities.
              </p>
            </div>
            
            {/* Contact Information */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-ocean-blue-100">
                <Phone className="h-4 w-4 text-ocean-blue-400" />
                <span>+254 700 PRIME (77463)</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-ocean-blue-100">
                <Mail className="h-4 w-4 text-ocean-blue-400" />
                <span>support@primebill.co.ke</span>
              </div>
              <div className="flex items-start space-x-3 text-sm text-ocean-blue-100">
                <MapPin className="h-4 w-4 text-ocean-blue-400 mt-0.5" />
                <span>
                  Westlands, Nairobi<br />
                  ABC Place, 6th Floor<br />
                  Waiyaki Way
                </span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-ocean-blue-100">
                <Globe className="h-4 w-4 text-ocean-blue-400" />
                <span>Available 24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 font-heading">Support</h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-ocean-blue-200 hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    {link.name}
                    <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 font-heading">Company</h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-ocean-blue-200 hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    {link.name}
                    <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Social */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 font-heading">Legal & Connect</h4>
            <ul className="space-y-3 mb-6">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-ocean-blue-200 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>

            {/* Social Media Links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 font-heading">Follow Us</h4>
              <div className="flex space-x-3">
                {socialLinks.map((social) => (
                  <Button
                    key={social.name}
                    variant="ghost"
                    size="sm"
                    className="p-2 text-ocean-blue-200 hover:text-white hover:bg-ocean-blue-500/20 rounded-lg transition-all duration-200"
                    asChild
                  >
                    <a 
                      href={social.href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      aria-label={social.name}
                    >
                      <social.icon className="h-4 w-4" />
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-ocean-blue-400/20">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-ocean-blue-200">
              © {currentYear} PrimeBill Kenya Ltd. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-ocean-blue-200">
              <span className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>CA Licensed</span>
              </span>
              <span>•</span>
              <span>ISO 27001 Certified</span>
              <span>•</span>
              <span>Kenyan Owned</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};