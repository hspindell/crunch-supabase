// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"

console.log(`Function "push" up and running!`)

import { JWT } from 'npm:google-auth-library@9'
import { responseSuccess, responseError } from 'shared/cors.ts'
import { supabaseClient } from 'shared/supabase.ts'

interface Notification {
  id: string
  user_id: string
  title: string | undefined
  message: string
  data: {}
}

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: Notification
  schema: 'public'
}

const getAccessToken = ({
  clientEmail,
  privateKey,
}: {
  clientEmail: string
  privateKey: string
}): Promise<string> => {
  return new Promise((resolve, reject) => {
    const jwtClient = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    })
    jwtClient.authorize((err, tokens) => {
      if (err) {
        reject(err)
        return
      }
      resolve(tokens!.access_token!)
    })
  })
}


const supabase = supabaseClient()

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json()
  const notification = payload.record;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', notification.user_id)
      .single()
  
    const fcmToken = data!.fcm_token as string
  
    const accessToken = await getAccessToken({
      clientEmail: Deno.env.get("FCM_CLIENT_EMAIL"),
      privateKey: Deno.env.get("FCM_PRIVATE_KEY"),
    })
  
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${Deno.env.get("FCM_PROJECT_ID")}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token: fcmToken,
            notification: {
              title: notification.title || 'Crunch Pools',
              body: notification.message,
            },
            data: notification.data
          },
        }),
      }
    )
  
    const resData = await res.json()
    if (res.status < 200 || 299 < res.status) {
      throw resData
    }

    await supabase.from('notifications')
    .update({ status: 'sent' })
    .eq('id', notification.id)
  
    return responseSuccess(JSON.stringify(resData))
  } catch (error) {
    console.log(`Failed to send push ${notification.id}: ${error.message}`)
    await supabase.from('notifications')
    .update({ status: 'failed' })
    .eq('id', notification.id)
    return responseError(error.message)
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/push' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json'

*/
