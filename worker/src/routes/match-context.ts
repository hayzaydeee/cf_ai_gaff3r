import type { Env } from '../types/env';
import type { MatchContextResponse } from '../types/api';
import { fetchMatchContext } from '../services/match-context';
import { createRedisClient } from '../services/redis';

export async function handleGetMatchContext(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const fixtureId = Number.parseInt(url.searchParams.get('fixtureId') ?? '', 10);
  const gameweek = Number.parseInt(url.searchParams.get('gameweek') ?? '', 10);
  const competitionCode = (url.searchParams.get('competitionCode') ?? 'PL').toUpperCase();

  if (!Number.isInteger(fixtureId) || fixtureId <= 0) {
    return errorResponse('fixtureId must be a positive integer', 400);
  }
  if (!Number.isInteger(gameweek) || gameweek < 1 || gameweek > 38) {
    return errorResponse('gameweek must be an integer between 1 and 38', 400);
  }

  const context = await fetchMatchContext(
    competitionCode,
    fixtureId,
    gameweek,
    createRedisClient(env),
    env,
    ctx,
  );

  const response: MatchContextResponse = context.type === 'pl'
    ? {
        fixture: {
          id: context.fixture.id,
          homeTeam: context.fixture.homeTeam,
          awayTeam: context.fixture.awayTeam,
          competition: context.fixture.competition,
          competitionCode: 'PL',
          matchDate: context.fixture.matchDate,
          matchday: context.fixture.matchday,
        },
        dataSource: 'fpl',
        fplDifficulty: context.fplDifficulty,
        homeTeam: {
          name: context.homeTeam.name,
          leaguePosition: context.homeTeam.leaguePosition,
          points: context.homeTeam.points,
          played: context.homeTeam.played,
          won: context.homeTeam.won,
          drawn: context.homeTeam.drawn,
          lost: context.homeTeam.lost,
          goalsFor: context.homeTeam.goalsFor,
          goalsAgainst: context.homeTeam.goalsAgainst,
          goalDifference: context.homeTeam.goalDifference,
          form: context.homeTeam.form,
          formSummary: context.homeTeam.formSummary,
          recentResults: context.homeTeam.recentResults,
          keyPlayers: context.homeTeam.keyPlayers,
          injuries: context.homeTeam.injuries,
        },
        awayTeam: {
          name: context.awayTeam.name,
          leaguePosition: context.awayTeam.leaguePosition,
          points: context.awayTeam.points,
          played: context.awayTeam.played,
          won: context.awayTeam.won,
          drawn: context.awayTeam.drawn,
          lost: context.awayTeam.lost,
          goalsFor: context.awayTeam.goalsFor,
          goalsAgainst: context.awayTeam.goalsAgainst,
          goalDifference: context.awayTeam.goalDifference,
          form: context.awayTeam.form,
          formSummary: context.awayTeam.formSummary,
          recentResults: context.awayTeam.recentResults,
          keyPlayers: context.awayTeam.keyPlayers,
          injuries: context.awayTeam.injuries,
        },
      }
    : {
        fixture: {
          id: context.fixture.id,
          homeTeam: context.fixture.homeTeam,
          awayTeam: context.fixture.awayTeam,
          competition: context.fixture.competition,
          competitionCode: context.fixture.competitionCode,
          matchDate: context.fixture.matchDate,
          matchday: context.fixture.matchday,
        },
        dataSource: 'football-data',
        homeTeam: {
          name: context.homeTeam.name,
          leaguePosition: context.homeTeam.leaguePosition,
          points: context.homeTeam.points,
          played: context.homeTeam.played,
          won: context.homeTeam.won,
          drawn: context.homeTeam.drawn,
          lost: context.homeTeam.lost,
          goalsFor: context.homeTeam.goalsFor,
          goalsAgainst: context.homeTeam.goalsAgainst,
          goalDifference: context.homeTeam.goalDifference,
          form: context.homeTeam.form,
          formSummary: context.homeTeam.formSummary,
          recentResults: context.homeTeam.recentResults,
        },
        awayTeam: {
          name: context.awayTeam.name,
          leaguePosition: context.awayTeam.leaguePosition,
          points: context.awayTeam.points,
          played: context.awayTeam.played,
          won: context.awayTeam.won,
          drawn: context.awayTeam.drawn,
          lost: context.awayTeam.lost,
          goalsFor: context.awayTeam.goalsFor,
          goalsAgainst: context.awayTeam.goalsAgainst,
          goalDifference: context.awayTeam.goalDifference,
          form: context.awayTeam.form,
          formSummary: context.awayTeam.formSummary,
          recentResults: context.awayTeam.recentResults,
        },
      };

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
