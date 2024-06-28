import { responseSuccess, responseError } from 'shared/cors.ts'
import { gql } from 'graphql'
import { pgaQuery } from 'shared/pga.ts'
import { supabaseClient } from 'shared/supabase.ts'

interface GraphResponse {
  field: {
    players: Array<Player>
  }
}

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  countryFlag: string;
  owgr: string;
}

const HEADSHOT_ZOOM_LEVEL = 0.7;
const HEADSHOT_RESOLUTION = 400;

function constructAvatarURL(golferId: string): string {
  return "https://pga-tour-res.cloudinary.com/image/upload/c_thumb,g_face,w_" + HEADSHOT_RESOLUTION + ",h_" + HEADSHOT_RESOLUTION + ",z_" + HEADSHOT_ZOOM_LEVEL + "/headshots_" + golferId + ".jpg"
}

console.log(`Function "fetch-next-tournament-field" up and running!`)

Deno.serve(async (req) => {
  var tournamentId = 'unknown'
  try {
    const supabase = supabaseClient()

    const { data, error } = await supabase
    .from('events')
    .select('external_id')
    .gt('starts_at', new Date().toISOString()) // next one that hasn't started yet
    .order('starts_at', { ascending: true })
    .limit(1)
    .single()
    
    if (data == null) {
      console.log("No golf tournaments coming up; field sync skipped.")
      return responseSuccess()
    }
    tournamentId = data.external_id

    console.log(`Syncing field for golf tournament ${tournamentId}.`)

    const query = gql`
      {
        field(id: "${tournamentId}") {
          players {
              id
              owgr
              lastName
              firstName
              countryFlag
          }
          lastUpdated
        }
      }
    `

    const response: GraphResponse = await pgaQuery(query)
    
    if (response.field.players.length == 0) {
      console.log(`Field not yet available for golf tournament ${tournamentId}`)
      return responseSuccess()
    }

    const orderedField = response.field.players
    .sort((a, b) => {
      const aInt = parseInt(a.owgr) || 999
      const bInt = parseInt(b.owgr) || 999
      return aInt - bInt
    })
    .map((o) => {
      return o.id
    })

    const golfersUpsertBatch = response.field.players.map((p) => {
      return {
        pga_id: p.id,
        first_name: p.firstName,
        last_name: p.lastName,
        country: p.countryFlag,
        avatar_url: constructAvatarURL(p.id)
      }
    })

    var { data, error } = await supabase.from('events')
    .update({ polymorphic_data: { field: orderedField } })
    .eq('external_id', tournamentId)
    console.log(`Successfully updated field for tournament ${tournamentId}.`)

    var { data, error } = await supabase.from('golfers').upsert(golfersUpsertBatch);
    console.log(`Successfully updated known golfers.`)

    return responseSuccess()
  } catch (error) {
    console.log(`Failed to update field for tournament ${tournamentId}: ${error.message}`)
    return responseError(error.message)
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fetch-next-tournament-field' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json'
*/

