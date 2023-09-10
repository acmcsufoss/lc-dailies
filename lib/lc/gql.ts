/**
 * gql executes a query to Leetcode's GraphQL API.
 */
export async function gql(body: string): Promise<Response> {
  return await fetch("https://leetcode.com/graphql/", {
    method: "POST",
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      authorization: "",
      "content-type": "application/json",
    },
    body,
  });
}
