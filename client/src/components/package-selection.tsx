import { useState } from 'react';
import { CheckCircle, Star } from 'lucide-react';
import { MobileCard, MobileButton } from '@/components/mobile-layout';

interface PackageOption {
  type: string;
  title: string;
  price: number;
  priceDisplay: string;
  period: string;
  popular?: boolean;
  features: string[];
  subtitle: string;
  color: string;
}

const packageOptions: PackageOption[] = [
  {
    type: 'basic',
    title: '🟢 Basic Package',
    price: 35,
    priceDisplay: '$35',
    period: '/month',
    popular: true,
    features: ['1x per week trash pickup', 'Up to 6 trash bags', '1 bag of recycling', 'Non-commercial trash only'],
    subtitle: 'Ideal for small households',
    color: 'border-green-500'
  },
  {
    type: 'clean-carry',
    title: '🔵 Clean & Carry Package',
    price: 60,
    priceDisplay: '$60',
    period: '/month',
    popular: false,
    features: ['1x per week trash pickup', 'Up to 6 trash bags', '1 bag of recycling', '1 furniture item included', 'Weekly trash can power washing'],
    subtitle: 'Great for families or shared homes',
    color: 'border-blue-500'
  },
  {
    type: 'heavy-duty',
    title: '🟣 Heavy Duty Package',
    price: 75,
    priceDisplay: '$75',
    period: '/month',
    popular: false,
    features: ['2x per week trash pickup', 'Up to 6 bags per pickup', '1 bag recycling per pickup', '1 furniture item per week', 'Weekly power washing'],
    subtitle: 'Ideal for larger homes or heavy waste output',
    color: 'border-purple-500'
  },
  {
    type: 'premium',
    title: '🔴 Premium Property Package',
    price: 150,
    priceDisplay: '$150',
    period: '/month',
    popular: false,
    features: ['2x per week trash pickup', 'Up to 6 bags per pickup', '1 bag recycling per pickup', '1 furniture item per week', 'Weekly power washing', 'Monthly lawn mowing (¼ acre)'],
    subtitle: 'Perfect for homeowners wanting full outdoor upkeep',
    color: 'border-red-500'
  }
];

interface PackageSelectionProps {
  selectedPackage: string;
  onPackageSelect: (packageType: string, price: number) => void;
}

export default function PackageSelection({ selectedPackage, onPackageSelect }: PackageSelectionProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold mb-2">Choose Your Package</h2>
        <p className="text-sm text-muted-foreground">
          Select the subscription package that best fits your needs
        </p>
      </div>

      <div className="space-y-3">
        {packageOptions.map((pkg) => (
          <div
            key={pkg.type}
            className={`relative cursor-pointer transition-all p-3 sm:p-4 rounded-lg border ${
              selectedPackage === pkg.type 
                ? `${pkg.color} border-2 bg-opacity-5` 
                : 'border hover:shadow-md'
            }`}
            onClick={() => onPackageSelect(pkg.type, pkg.price)}
          >
            {pkg.popular && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedPackage === pkg.type 
                      ? 'bg-primary border-primary' 
                      : 'border-gray-300'
                  }`}>
                    {selectedPackage === pkg.type && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold">{pkg.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{pkg.subtitle}</p>
                  </div>
                </div>
                
                <div className="flex items-baseline mb-2 ml-7">
                  <span className="text-xl sm:text-2xl font-bold">{pkg.priceDisplay}</span>
                  <span className="text-muted-foreground ml-1 text-sm">{pkg.period}</span>
                </div>
                
                <ul className="space-y-1 ml-7">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-xs sm:text-sm">
                      <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mt-4">
        <p className="text-xs sm:text-sm text-blue-700">
          <strong>Note:</strong> All packages include professional pickup service, 
          email confirmations, and ability to cancel anytime.
        </p>
      </div>
    </div>
  );
}