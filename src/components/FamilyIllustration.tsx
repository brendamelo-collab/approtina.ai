import React from 'react';

interface FamilyIllustrationProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showDetails?: boolean;
  className?: string;
}

export const FamilyIllustration: React.FC<FamilyIllustrationProps> = ({
  size = 'md',
  showDetails = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-11 h-11',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
    hero: 'w-32 h-32 sm:w-36 sm:h-36'
  };

  return (
    <div className={`relative flex flex-col items-center justify-center shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full border-2 border-[#EADFCF] bg-[#FAF5EE] shadow-[0_4px_16px_rgba(140,122,107,0.12)] select-none`}
        style={{
          backgroundImage: `url('/assets/aistudio/Rotina.ai__Organize_Seu_Dia-2_fb07cded.png')`,
          backgroundSize: '390% auto',
          backgroundPosition: '5.2% 6.6%',
          backgroundRepeat: 'no-repeat'
        }}
        role="img"
        aria-label="Mãe Brenda com os filhos Bryan e Benício"
      />

      {showDetails && (
        <div className="mt-2 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#F4EDE2] text-[#6E5D4F] text-[11px] font-semibold">
            <span>Família Moura</span>
            <span className="text-[#B78A58]">♡</span>
          </div>
        </div>
      )}
    </div>
  );
};
