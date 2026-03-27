import { useState } from 'react';
import { useClubLogo } from '../../hooks/useClubLogo';
import { getTeamInitials, type TeamLogoRef } from '../../utils/team-logo';

interface ClubLogoProps {
  teamName: string;
  size?: number;
  className?: string;
  fallbackClassName?: string;
  refData?: TeamLogoRef;
}

export default function ClubLogo({
  teamName,
  size = 24,
  className,
  fallbackClassName,
  refData,
}: ClubLogoProps) {
  const src = useClubLogo({
    fplName: teamName,
    fdName: teamName,
    ...refData,
  });
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <span
        className={fallbackClassName}
        style={{ width: size, height: size }}
        aria-label={`${teamName} crest fallback`}
      >
        {getTeamInitials(teamName)}
      </span>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={`${teamName} crest`}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}
