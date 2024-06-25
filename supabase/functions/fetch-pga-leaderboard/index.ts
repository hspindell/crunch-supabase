import { gql, GraphQLClient } from 'graphql'
import { corsHeaders } from 'shared/cors.ts'

interface GraphResponse {
  leaderboardV3: {
    players: Array<GraphGolferScore>;
    tournamentStatus: string;
  };
}

interface GraphGolferScore {
  id: string;
  leaderboardSortOrder: number;
  scoringData: ScoringData;
}

interface ScoringData {
  total: string; // player's score even if they missed the cut. "-" if withdrawn
  score: string; // player's score if still in the tournament, "-" if either withdrawn or missed cut
  rounds: Array<string>;
  playerState: string;
}

interface TournamentStateResponse {
  status: string;
  leaderboard: { 
    [key: string]: GolferScoreResponse
  }
}

interface GolferScoreResponse {
  golferId: string;
  golferStatus: GolferStatus | string;
  place: number;
  score: string; // display score before WD/CUT
  adjustedScore: number; // numeric score used for pool leaderboard calculation
}

enum GolferStatus {
  WD = "WITHDRAWN",
  Cut = "CUT",
  Complete = "COMPLETE"
}

// TODO move to env or some shared constants file
const PGA_GRAPHQL_ENDPOINT = "https://orchestrator.pgatour.com/graphql"
const INCOMPLETE_ROUND_SCORE = 8


function parseScore(score: string): number {
  if (score === "E") { return 0 }
  return parseInt(score.replace("+", ""))
}

function adjustedScore(scoringData: ScoringData, golferStatus: GolferStatus | string): number {
  switch (golferStatus) {
    case GolferStatus.WD:
      return INCOMPLETE_ROUND_SCORE * 4
    case GolferStatus.Cut:
      return parseScore(scoringData.total) + (INCOMPLETE_ROUND_SCORE * 2)
    default:
      return parseScore(scoringData.total)
  }
}


  // player is done, if cut missed then each incomplete round is treated as +8
  // let incompleteRounds = scoringData.rounds.filter((r) => r === "-").length

// // TODO how does this algorithm hold up during a live tourney?
// function totalStrokes(rounds: Array<string>): number {
//   const roundScores = rounds.map((score) => score === "-" ? 80 : parseInt(score))
//   return roundScores.reduce((total, a) => total + a, 0)
// }

function processGolferStatus(scoringData: ScoringData): GolferStatus | string {
  if (scoringData.score === "-" && scoringData.playerState !== "WITHDRAWN") {
    return GolferStatus.Cut
  } else {
    return scoringData.playerState
  }
}


console.log(`Function "fetch-pga-leaderboard" up and running!`)

Deno.serve(async (req) => {
  const graphQLClient = new GraphQLClient(PGA_GRAPHQL_ENDPOINT, {
    headers: {
      "x-api-key": Deno.env.get('PGA_X_API_KEY') ?? '',
    },
  })
  const { tournamentId } : { tournamentId: string } = await req.json()

  const query = gql`
    {
      leaderboardV3(id: "` + tournamentId + `") {
        players {
            ... on PlayerRowV3 {
                scoringData {
                    total
                    playerState
                    score
                }
                id
                leaderboardSortOrder
            }
        }
        tournamentStatus
      }
    }
  `;

  const response: GraphResponse = await graphQLClient.request(query)
  const tournamentState: TournamentStateResponse = { 
    status: response.leaderboardV3.tournamentStatus, 
    leaderboard: {}
  };

    response.leaderboardV3.players.forEach((p) => {
      if (Object.keys(p).length === 0) { return }
      let golferStatus = processGolferStatus(p.scoringData)
      tournamentState.leaderboard[p.id] = {
        golferId: p.id,
        golferStatus: golferStatus,
        place: p.leaderboardSortOrder,
        score: p.scoringData.total,
        adjustedScore: adjustedScore(p.scoringData, golferStatus)
      }
    })

  try {
    return new Response(JSON.stringify(tournamentState), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fetch-pga-leaderboard' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{ "tournamentId":"R2024033" }'

*/

