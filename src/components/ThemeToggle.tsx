import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const handleToggle = () => {
    // Si on essaie de passer en light mode, afficher une notification
    if (theme === 'dark') {
      toast({
        title: '⏳ Theme light désactivé pour l\'instant',
        description: 'Le mode clair sera bientôt disponible.',
        variant: 'default',
      });
      return;
    }
    // Sinon on peut basculer (vers le dark mode)
    toggleTheme();
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleToggle} 
      title={theme === 'dark' ? 'Mode light à venir' : 'Changer le thème'}
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
