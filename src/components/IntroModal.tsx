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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-arkus rounded-2xl flex items-center justify-center shadow-lg">
              <Icon className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-arkus bg-clip-text text-transparent mb-3">
              {currentStepData.title}
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-gradient-arkus'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
            >
              Previous
            </button>

            <button
              onClick={handleNext}
              className="px-8 py-3 bg-gradient-arkus text-white rounded-xl hover:shadow-xl transition-all font-medium shadow-lg"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div
            className="h-full bg-gradient-arkus transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
