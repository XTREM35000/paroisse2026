/**
 * Sélecteur de méthode de paiement avec animation 3D et dégradés
 */
import React, { useState } from 'react';
import { CreditCard, Smartphone, DollarSign, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { PaymentMethod } from '@/hooks/useDonationMethods';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethodSelectorProps {
  methods: PaymentMethod[];
  selectedMethod: string | null;
  onSelect: (methodCode: string) => void;
  loading?: boolean;
}

const getIconComponent = (iconName?: string) => {
  switch (iconName) {
    case 'CreditCard':
      return <CreditCard className="h-10 w-10" />;
    case 'Smartphone':
      return <Smartphone className="h-10 w-10" />;
    case 'DollarSign':
      return <DollarSign className="h-10 w-10" />;
    default:
      return <CreditCard className="h-10 w-10" />;
  }
};

// Gradient et couleurs par méthode
const getMethodStyle = (code: string) => {
  switch (code) {
    case 'card':
      return {
        gradient: 'from-blue-600 via-blue-500 to-purple-600',
        icon: 'text-white',
        badge: 'En conception',
        inConstruction: true,
      };
    case 'mobile_money':
      return {
        gradient: 'from-orange-600 via-orange-500 to-red-500',
        icon: 'text-white',
        badge: 'En conception',
        inConstruction: true,
      };
    case 'cash':
      return {
        gradient: 'from-green-600 via-emerald-500 to-teal-600',
        icon: 'text-white',
        badge: 'Disponible',
        inConstruction: false,
      };
    default:
      return {
        gradient: 'from-gray-600 to-gray-700',
        icon: 'text-white',
        badge: '',
        inConstruction: false,
      };
  }
};

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  methods,
  selectedMethod,
  onSelect,
  loading = false,
}) => {
  const { toast } = useToast();
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);

  const handleCardClick = (method: PaymentMethod) => {
    const style = getMethodStyle(method.code);
    
    if (style.inConstruction && method.code !== 'cash') {
      toast({
        title: '⚙️ En conception',
        description: 'Cette méthode de paiement sera disponible après validation.',
        variant: 'default',
      });
      return;
    }
    
    onSelect(method.code);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>, methodCode: string) => {
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateX = (y / rect.height - 0.5) * 10;
    const rotateY = (x / rect.width - 0.5) * -10;

    setRotateX(rotateX);
    setRotateY(rotateY);
    setHoveredMethod(methodCode);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setHoveredMethod(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {methods.map((method) => {
        const style = getMethodStyle(method.code);
        const isSelected = selectedMethod === method.code;
        const isHovered = hoveredMethod === method.code;

        return (
          <motion.button
            key={method.code}
            onClick={() => handleCardClick(method)}
            onMouseMove={(e: any) => handleMouseMove(e, method.code)}
            onMouseLeave={handleMouseLeave}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="relative perspective h-64 rounded-2xl overflow-hidden"
            style={{
              transformStyle: 'preserve-3d',
              transform: isHovered
                ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
                : 'rotateX(0deg) rotateY(0deg)',
              transition: 'transform 0.2s ease-out',
            } as any}
          >
            {/* Gradient Background */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-90 transition-all duration-300`}
            />

            {/* Shine effect on hover */}
            {isHovered && (
              <motion.div
                className="absolute inset-0 bg-white/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}

            {/* Selection border */}
            {isSelected && (
              <motion.div
                className="absolute inset-0 border-4 border-white rounded-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                layoutId="selectedBorder"
              />
            )}

            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center gap-4 text-white p-6">
              {/* Icon */}
              <motion.div
                animate={{
                  y: isHovered ? -5 : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                {getIconComponent(method.icon)}
              </motion.div>

              {/* Label */}
              <motion.h3
                className="font-bold text-xl text-center"
                animate={{
                  y: isHovered ? -10 : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                {method.label}
              </motion.h3>

              {/* Description */}
              <p className="text-sm text-white/90 text-center leading-relaxed">
                {method.description}
              </p>

              {/* Badge */}
              <motion.div
                className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white border border-white/30"
                animate={{
                  y: isHovered ? -2 : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                {style.inConstruction && method.code !== 'cash' && (
                  <AlertCircle className="h-3 w-3" />
                )}
                {style.badge}
              </motion.div>

              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  layoutId="selectedIndicator"
                >
                  <motion.div
                    className="w-2 h-2 bg-white rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                  <span className="text-xs font-semibold">Sélectionné</span>
                </motion.div>
              )}
            </div>

            {/* Disabled overlay */}
            {loading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                <div className="loader"></div>
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default PaymentMethodSelector;
