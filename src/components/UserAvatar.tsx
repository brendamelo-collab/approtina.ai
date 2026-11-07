import React from 'react';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl'
  };

  const isImage = avatarUrl && (avatarUrl.startsWith('data:') || avatarUrl.startsWith('http') || avatarUrl.startsWith('/assets'));
  const isEmoji = avatarUrl && !isImage && avatarUrl.trim().length <= 4;

  return (
    <div
      className={`${sizeClasses[size]} rounded-2xl bg-[#EAE0D2] text-[#5C4F44] border border-[#D8C7B4] flex items-center justify-center font-bold shrink-0 overflow-hidden shadow-2xs ${className}`}
    >
      {isImage ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover rounded-2xl"
          onError={(e) => {
            // Fallback on image load error
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : isEmoji ? (
        <span className="select-none leading-none">{avatarUrl}</span>
      ) : (
        <span className="select-none">{name ? name.charAt(0).toUpperCase() : '?'}</span>
      )}
    </div>
  );
};
