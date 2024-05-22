
// import { supabaseClient } from '../_shared/supabaseClient.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^1.33.2'
import { gql, GraphQLClient } from "https://deno.land/x/graphql_request/mod.ts";
import { corsHeaders } from '../_shared/cors.ts'

interface RankingsResponse {
  statDetails: StatDetails;
}

interface StatDetails {
  lastProcessed: String;
  rows: Array<RankedGolfer>;
}

interface RankedGolfer {
  playerId: String;
  rank: number;
}

interface PlayerDataResponse {
  players: Array<PlayerData>;
}

interface PlayerData {
  id: String;
  firstName: String;
  lastName: String;
  countryFlag: String;
}

console.log(`Function "fetch-golf-rankings-pga" up and running!`)

const TOP_X_COUNT = 100;
const currentYear = new Date().getFullYear();
const HEADSHOT_ZOOM_LEVEL = 0.7;
const HEADSHOT_RESOLUTION = 400;

function constructAvatarURL(golferId: String): String {
  return "https://pga-tour-res.cloudinary.com/image/upload/c_thumb,g_face,w_" + HEADSHOT_RESOLUTION + ",h_" + HEADSHOT_RESOLUTION + ",z_" + HEADSHOT_ZOOM_LEVEL + "/headshots_" + golferId + ".jpg"
}

Deno.serve(async (req) => {
  const endpoint = "https://orchestrator.pgatour.com/graphql"

  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      "x-api-key": "da2-gsrx5bibzbb4njvhl7t37wqyl4",
    },
  })

  const rankingsQuery = gql`
    {
      statDetails(statId: "186", year: ` + currentYear + `, tourCode: R) {
        lastProcessed
        rows {
            ... on StatDetailsPlayer {
                playerId
                rank
            }
        }
      }
    }
  `;

  const data1: RankingsResponse = await graphQLClient.request(rankingsQuery);
  const idsInOrder = data1.statDetails.rows.slice(0, TOP_X_COUNT).map((r) => r.playerId);

  const playerDataQuery = gql`
  {
    players(ids: [` + idsInOrder.join(',') + `]) {
      id
      firstName
      lastName
      countryFlag
    }
  }`
  const data2: PlayerDataResponse = await graphQLClient.request(playerDataQuery);
  const golfersUpsertBatch = data2.players.map((p) => {
    return {
      pga_id: p.id,
      first_name: p.firstName,
      last_name: p.lastName,
      country: p.countryFlag,
      avatar_url: constructAvatarURL(p.id)
    }
  })


  const calendarDate = data1.statDetails.lastProcessed.split(", ")[1]
  const weeklyRanking = {
    as_of_display: data1.statDetails.lastProcessed,
    week_end_date: new Date(Date.parse(calendarDate + ", " + currentYear)).toISOString(),
    order: idsInOrder
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: { 
          headers: { 
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` 
          } 
        } 
      }
    )
    var { data, error } = await supabaseClient.from('golfers').upsert(golfersUpsertBatch);
    console.log({ data, error })

    var { data, error } = await supabaseClient.from('golf_rankings').upsert(weeklyRanking);
    console.log({ data, error })

    return new Response("Success", {
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fetch-golf-rankings-pga' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json'

*/

