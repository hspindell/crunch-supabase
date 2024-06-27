import { GraphQLClient } from 'graphql'

export const pgaQuery = async (query: any): Promise<GraphResponse> => {
    const client = new GraphQLClient("https://orchestrator.pgatour.com/graphql", {
        headers: {
          "x-api-key": Deno.env.get('PGA_X_API_KEY')
        },
    })

    return await client.request(query);
}