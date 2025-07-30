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
  ExternalLink
} from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const supportLinks = [
    { name: 'Help Center', href: '/help' },
    { name: 'Contact Support', href: '/support' },
    { name: 'Network Status', href: '/status' },
    { name: 'Service Areas', href: '/coverage' },
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
    { name: 'Acceptable Use', href: '/acceptable-use' },
  ];

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
  ];

  return (
    <footer className="bg-isp-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-heading font-bold text-isp-blue-700 mb-4">
                PrimeBill ISP
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Reliable internet service provider delivering high-speed connectivity 
                and exceptional customer service across Kenya.
              </p>
            </div>
            
            {/* Contact Information */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-isp-blue-600" />
                <span>+254 700 123 456</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-isp-blue-600" />
                <span>support@primebill.co.ke</span>
              </div>
              <div className="flex items-start space-x-3 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-isp-blue-600 mt-0.5" />
                <span>Nairobi, Kenya<br />Business Center, 5th Floor</span>
              </div>
            </div>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Support</h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-isp-blue-600 transition-colors duration-200 flex items-center group"
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
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-isp-blue-600 transition-colors duration-200 flex items-center group"
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
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-3 mb-6">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-isp-blue-600 transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>

            {/* Social Media Links */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Follow Us</h4>
              <div className="flex space-x-3">
                {socialLinks.map((social) => (
                  <Button
                    key={social.name}
                    variant="ghost"
                    size="sm"
                    className="p-2 text-gray-600 hover:text-isp-blue-600 hover:bg-isp-blue-50"
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
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-600">
              © {currentYear} PrimeBill ISP. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>Licensed by Communications Authority of Kenya</span>
              <span>•</span>
              <span>ISO 9001:2015 Certified</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};