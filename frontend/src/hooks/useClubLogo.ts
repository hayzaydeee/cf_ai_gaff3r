import { useMemo } from 'react';
import { resolveClubLogo, type TeamLogoRef } from '../utils/team-logo';

export function useClubLogo(ref: TeamLogoRef): string | undefined {
  return useMemo(
    () => resolveClubLogo(ref),
    [ref.fplTeamId, ref.fplName, ref.fplShortName, ref.fdTeamId, ref.fdName, ref.fdShortName]
  );
}
