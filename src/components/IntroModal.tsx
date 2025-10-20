import { X, Truck, Map, MessageSquare, Zap, Battery, Radio } from 'lucide-react';
import { useState, useEffect } from 'react';

interface IntroModalProps {
  onClose: () => void;
}

export function IntroModal({ onClose }: IntroModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const steps = [
    {
      icon: Truck,
      title: 'Autonomous Electric Fleet',
      description: 'This is a live demo of an AI-powered fleet management system for autonomous electric vehicles. Watch real-time telemetry, route optimization, and intelligent dispatch in action.'
    },
    {
      icon: Battery,
      title: 'Real-Time Telemetry',
      description: 'Monitor battery levels, motor temperature, power consumption, and autonomous mode status for each vehicle. All telemetry data updates in real-time to provide complete visibility.'
    },
    {
      icon: Map,
      title: 'Interactive Map & Controls',
      description: 'Use the navigation buttons at the top to access Warehouses, Routes, Vehicles, and Dispatch panels. Click on map markers to view details, and watch vehicles move along their assigned routes.'
    },
    {
      icon: MessageSquare,
      title: 'AI Assistant Control',
      description: 'Chat with the AI Assistant to manage your fleet using natural language. Ask about vehicle status, route efficiency, dispatch recommendations, or request telemetry data. The AI has complete access to all fleet information.'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl md:max-w-2xl max-h-[90vh] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-4 md:p-8 overflow-y-auto max-h-full">
          <div className="flex items-center justify-center mb-4 md:mb-6">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-lg">
              <Icon className="w-8 h-8 md:w-10 md:h-10" style={{ stroke: 'url(#grad-section-icon)' }} />
            </div>
          </div>

          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gradient-arkus mb-3 font-display">
              {currentStepData.title}
            </h2>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6 md:mb-8">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-arkus-black'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-4 md:px-6 py-2 md:py-3 bg-arkus-black text-white rounded-xl hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-sm md:text-base"
            >
              Previous
            </button>

            <button
              onClick={handleNext}
              className="px-6 md:px-8 py-2 md:py-3 bg-arkus-black text-white rounded-xl hover:shadow-xl transition-all font-medium shadow-lg text-sm md:text-base"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div
            className="h-full bg-arkus-black transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
