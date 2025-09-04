import React, { useState, useEffect } from 'react';
import { X, Users, CheckCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getAndClearLastClassCode } from '../utils/classDeepLink';
import { motion, AnimatePresence } from 'framer-motion';

interface ClassJoinBannerProps {
  /** Called when banner is dismissed */
  onDismiss?: () => void;
  /** Called when user wants to set up class joining */
  onSetupClass?: (classCode: string) => void;
}

export function ClassJoinBanner({ onDismiss, onSetupClass }: ClassJoinBannerProps) {
  const [classCode, setClassCode] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for stored class code from deep link
    const storedClassCode = getAndClearLastClassCode();
    if (storedClassCode) {
      setClassCode(storedClassCode);
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleSetupClass = () => {
    if (classCode) {
      onSetupClass?.(classCode);
      setIsVisible(false);
    }
  };

  if (!classCode || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
      >
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl border-0">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 rounded-full p-2 flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">Ready to join class!</h3>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    QR Code
                  </Badge>
                </div>
                
                <p className="text-blue-100 text-sm mb-3">
                  You've been invited to join class with code{' '}
                  <span className="font-mono bg-white/20 px-2 py-1 rounded text-white font-bold">
                    {classCode}
                  </span>
                </p>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleSetupClass}
                    size="sm"
                    className="bg-white text-blue-600 hover:bg-blue-50 flex items-center gap-1"
                    data-testid="join-class-button"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Set Up Profile & Join
                  </Button>
                  
                  <Button
                    onClick={handleDismiss}
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                    data-testid="dismiss-class-banner"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}