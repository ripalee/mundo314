import React, { useState } from 'react';
import { Team } from '../../types/team';

interface TeamShieldProps {
  team?: Team;
  shield?: string;
  name?: string;
  primaryColor?: string;
  secondaryColor?: string;
  size?: number; // default 22
}

export const TeamShield: React.FC<TeamShieldProps> = ({
  team,
  shield,
  name,
  primaryColor = '#16a34a',
  secondaryColor = '#ffffff',
  size = 22,
}) => {
  const [imageError, setImageError] = useState(false);

  const shieldUrl = shield || team?.shield;
  const pColor = team?.primaryColor || primaryColor;
  const sColor = team?.secondaryColor || secondaryColor;
  const teamName = team?.name || name || 'Equipo';

  // Si tiene un escudo personalizado subido (Data URL, URL externa o ruta) y no dio error
  if (!imageError && shieldUrl && shieldUrl !== 'default' && (
    shieldUrl.startsWith('data:image') || 
    shieldUrl.startsWith('http://') || 
    shieldUrl.startsWith('https://') || 
    shieldUrl.startsWith('blob:') ||
    shieldUrl.startsWith('/')
  )) {
    return (
      <img
        src={shieldUrl}
        alt={teamName}
        width={size}
        height={size}
        onError={() => setImageError(true)}
        className="inline-block flex-shrink-0 object-contain drop-shadow-sm rounded-xs select-none"
        style={{ width: `${size}px`, height: `${size}px`, maxWidth: `${size}px`, maxHeight: `${size}px` }}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block flex-shrink-0 select-none drop-shadow-sm"
      aria-label={teamName}
    >
      {/* Forma de escudo clásico de fútbol */}
      <path
        d="M16 2L5 6V15C5 21.6 9.8 27.6 16 30C22.2 27.6 27 21.6 27 15V6L16 2Z"
        fill={pColor}
        stroke="#1c221e"
        strokeWidth="1.2"
      />
      {/* Mitad / franja del color secundario */}
      <path
        d="M16 2V30C22.2 27.6 27 21.6 27 15V6L16 2Z"
        fill={sColor}
        opacity="0.9"
      />
      {/* Borde interior del escudo */}
      <path
        d="M16 4.5L7 8V15C7 20.3 10.9 25.2 16 27.2C21.1 25.2 25 20.3 25 15V8L16 4.5Z"
        stroke="#ffffff"
        strokeWidth="0.8"
        strokeOpacity="0.4"
        fill="none"
      />
      {/* Balón estilizado en el centro */}
      <circle cx="16" cy="15" r="4.5" fill="#080a09" stroke="#ffffff" strokeWidth="0.8" />
      <polygon points="16,12.5 18.5,14 17.5,16.8 14.5,16.8 13.5,14" fill="#ffffff" opacity="0.9" />
    </svg>
  );
};
