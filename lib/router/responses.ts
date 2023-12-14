/**
 * ResponseResolvable is a type which can be resolved to a Response.
 */
export type ResponseResolvable =
  | Response
  | Promise<Response>
  | (() => Response)
  | ((r: Request) => Response)
  | (() => Promise<Response>)
  | ((r: Request) => Promise<Response>);

/**
 * resolveResponse resolves a ResponseResolvable to a Response.
 */
export function resolveResponse(
  response: ResponseResolvable,
  request: Request,
): Promise<Response> {
  if (response instanceof Response) {
    return Promise.resolve(response);
  }

  if (response instanceof Promise) {
    return response;
  }

  if (typeof response === "function") {
    return Promise.resolve(response(request));
  }

  throw new Error("Failed to resolve response");
}

/**
 * RESPONSE_404 is a default 404 response.
 */
export const RESPONSE_404 = new Response("Not found", { status: 404 });
