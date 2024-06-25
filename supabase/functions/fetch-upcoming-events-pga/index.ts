import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { gql, GraphQLClient } from "https://deno.land/x/graphql_request/mod.ts"
import { corsHeaders } from '../_shared/cors.ts'
import moment from "npm:moment-timezone"
import NodeGeocoder from "npm:node-geocoder"

interface GraphResponse {
  upcomingSchedule: {
    tournaments: Array<Tournament>;
  };
}

interface Tournament {
  id: string;
  date: string;
  startDate: number;
  tournamentName: string;
  tournamentLogo: string;
  beautyImage: string;
  city: string;
  state: string;
  country: string;
}

interface GeocodeResponse {
  value: Array<{
    latitude: number;
    longitude: number;
  }>;
}

interface TZObject {
  timeZoneId: string;
}

console.log(`Function "fetch-upcoming-events-pga" up and running!`)

Deno.serve(async (req) => {
  const pgaEndpoint = "https://orchestrator.pgatour.com/graphql"
  const graphQLClient = new GraphQLClient(pgaEndpoint, {
    headers: {
      "x-api-key": Deno.env.get('PGA_X_API_KEY'),
    },
  })

  const geocoderOptions = {
    provider: 'google',
    apiKey: Deno.env.get('GOOGLE_API_KEY') ?? '',
    formatter: null // 'gpx', 'string', ...
  }
  const geocoder = NodeGeocoder(geocoderOptions)

  const query = gql`
    {
      upcomingSchedule(tourCode: "R") {
        tournaments {
            id
            date
            startDate
            tournamentName
            tournamentLogo
            beautyImage
            city
            state
        }
      }
    }
  `;

  const response: GraphResponse = await graphQLClient.request(query);
  const tourneyLocationStrings = response.upcomingSchedule.tournaments.map((t) => { 
    return [t.city, t.state, t.country].filter(Boolean).join(", ");
  })
  const geocodeResponses: Array<GeocodeResponse> = await geocoder.batchGeocode(tourneyLocationStrings);
  const tourneyCoordinates = geocodeResponses.map((r) => {
    if (r.value.length > 0) {
      return r.value[0];
    }
    return null;
  });

  const tzRequests: Array<Promise<TZObject> | null> = tourneyCoordinates.map((c) => { 
    if (c == null) {
      return null;
    }
    const tzParams = new URLSearchParams({ 
      'location': `${c.latitude},${c.longitude}`,
      'timestamp': `${new Date().getTime() / 1000}`,
      'key': Deno.env.get('GOOGLE_API_KEY') ?? ''
    })
    return fetch('https://maps.googleapis.com/maps/api/timezone/json?' + tzParams).then((r) => r.json());
  })

  const tourneyTimeZones: Array<string | null> = (await Promise.allSettled(tzRequests)).map((p) => {
    if (p.status === "fulfilled" && p.value) {
      return p.value.timeZoneId;
    }
    return null;
  });

  const eventsUpsertBatch = response.upcomingSchedule.tournaments.map((t, idx) => {
    const startDate = new Date(t.startDate);
    const endDate = new Date(t.startDate);
    endDate.setDate(endDate.getDate() + 4);

    var tzIdentifier: string = 'America/Los_Angeles';
    if (idx < tourneyCoordinates.length) {
      tzIdentifier = tourneyTimeZones[idx] || tzIdentifier;
    }
    
    return {
      starts_at: moment(startDate.toISOString()).tz(tzIdentifier, true),
      estimated_ends_at: moment(endDate.toISOString()).tz(tzIdentifier, true),
      title: t.tournamentName,
      event_type: 'golf-tournament',
      external_id: t.id,
      logo_url: t.tournamentLogo,
      cover_image_url: t.beautyImage
    }
  })

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
    var { data, error } = await supabaseClient.from('events').upsert(eventsUpsertBatch, { onConflict: "external_id" });
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fetch-upcoming-events-pga' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json'

*/

