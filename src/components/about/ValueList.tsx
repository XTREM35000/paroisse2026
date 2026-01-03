// src/components/about/ValueList.tsx
import React from 'react';
import { AboutSection } from '@/hooks/useAboutPage';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, Heart, Users, Shield, Handshake } from 'lucide-react';

// Mapper les noms d'icônes aux composants réels
const iconMap: Record<string, LucideIcon> = {
  heart: Heart,
  users: Users,
  shield: Shield,
  handshake: Handshake,
  // Ajoute d'autres icônes au besoin
};

interface ValueListProps {
  section: AboutSection;
}

interface ValueItem {
  icon: string;
  text: string;
}

const ValueList: React.FC<ValueListProps> = ({ section }) => {
  const items = (section.metadata as Record<string, unknown>)?.items as ValueItem[] || [];
  
  return (
    <section className="py-12">
      <h2 className="text-3xl font-bold mb-8 text-center">{section.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item: ValueItem, index: number) => {
          const IconComponent = iconMap[item.icon] || Heart;
          
          return (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <p className="font-medium text-lg">{item.text}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default ValueList;