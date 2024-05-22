
// import { supabaseClient } from '../_shared/supabaseClient.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^1.33.2'
import { corsHeaders } from '../_shared/cors.js'

interface RankingResponse {
  rankingsList: Array<Ranking>
}

interface Ranking {
  id: number;
  player: Golfer;
  weekEndDate: string;
}

interface Golfer {
  id: number,
  firstName: string,
  lastName: string,
  country: { code3: string }
}

console.log(`Function "fetch-golf-rankings-owgr" up and running!`)

Deno.serve(async (req) => {
  const response = await fetch('https://apiweb.owgr.com/api/owgr/rankings/getRankings?pageSize=100&pageNumber=1&sortString=Rank+ASC');
  const body: RankingResponse = await response.json();
  const rankings = body.rankingsList;
  

  const order = rankings.map((r) => r.player.id); // IDs of top 100 golfers in order
  const rankingDateString = rankings[0].weekEndDate;
  const rankingDate = new Date(Date.parse(rankingDateString));

  const golfers = rankings.map((r) => {
    return {
    'id': r.player.id,
    'first_name': r.player.firstName,
    'last_name': r.player.lastName,
    'country': r.player.country.code3
    }
  });

  const weeklyRanking = {
    week_end_date: rankingDate.toISOString(),
    order: order
  }

  try {
    // Set the Auth context of the user that called the function.
    // This way your row-level-security (RLS) policies are applied.
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

    var { data, error } = await supabaseClient.from('golfers').upsert(golfers);
    console.log({ data, error })

    var { data, error } = await supabaseClient.from('golf_rankings').upsert(weeklyRanking);
    console.log({ data, error })

    return new Response(JSON.stringify({ data, error }), {
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fetch-golf-rankings-owgr' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json'

*/
