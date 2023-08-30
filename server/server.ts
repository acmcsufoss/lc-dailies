/**
 * Handler is a function which can be registered to a specific route in the
 * server. The server will call the handler with the request object and any
 * matched parameters.
 */
export interface Handler {
  /**
   * method is the HTTP method to match on.
   */
  method: "get" | "post" | "put" | "delete" | "options" | "head";

  /**
   * handle is the function which will be called when a request matches the
   * route.
   */
  handle: (r: ServerRequest) => Promise<Response>;
}

/**
 * ServerRequest is a structure which contains the request object and any
 * matched parameters.
 */
export interface ServerRequest {
  /**
   * request is the original request object.
   */
  request: Request;

  /**
   * url is the parsed fully qualified URL of the request.
   */
  url: URL;

  /**
   * params is a map of matched parameters from the URL pattern.
   */
  params: { [key: string]: string };
}

/**
 * HandlerMap is a map of URL patterns to handlers. The server will use this
 * map to find a handler for a given request.
 */
export type HandlerMap = Map<URLPattern, Handler>;

/**
 * Server is a simple HTTP server which can be configured with handlers for
 * specific routes.
 */
export class Server {
  constructor(
    public readonly port: number = 8080,
    public readonly response404: Response = new Response("Not found", {
      status: 404,
    }),
    public handlerMap: HandlerMap = new Map(),
  ) {}

  /**
   * get registers a handler for the "get" HTTP method.
   */
  public get(pattern: URLPattern, fn: Handler["handle"]): this {
    this.handlerMap.set(pattern, { method: "get", handle: fn });
    return this;
  }

  /**
   * post registers a handler for the "post" HTTP method.
   */
  public post(pattern: URLPattern, fn: Handler["handle"]): this {
    this.handlerMap.set(pattern, { method: "post", handle: fn });
    return this;
  }

  /**
   * put registers a handler for the "put" HTTP method.
   */
  public put(pattern: URLPattern, fn: Handler["handle"]): this {
    this.handlerMap.set(pattern, { method: "put", handle: fn });
    return this;
  }

  /**
   * delete registers a handler for the "delete" HTTP method.
   */
  public delete(pattern: URLPattern, fn: Handler["handle"]): this {
    this.handlerMap.set(pattern, { method: "delete", handle: fn });
    return this;
  }

  /**
   * options registers a handler for the "options" HTTP method.
   */
  public options(pattern: URLPattern, fn: Handler["handle"]): this {
    this.handlerMap.set(pattern, { method: "options", handle: fn });
    return this;
  }

  /**
   * head registers a handler for the "head" HTTP method.
   */
  public head(pattern: URLPattern, fn: Handler["handle"]): this {
    this.handlerMap.set(pattern, { method: "head", handle: fn });
    return this;
  }

  /**
   * serve starts the server on the given port. If onListen is provided, it will
   * be called with the hostname and port that the server is listening on.
   */
  public serve(
    onListen?: (params: {
      hostname: string;
      port: number;
    }) => void,
  ): Deno.Server {
    return Deno.serve(
      { port: this.port, onListen },
      async (request) => {
        for (const [pattern, handler] of this.handlerMap) {
          const match = pattern.exec(request.url);
          if (
            !match ||
            handler.method !== request.method.toLowerCase()
          ) {
            continue;
          }

          const url = new URL(request.url);
          const params = Object.entries(match.pathname.groups)
            .reduce((acc, [key, value]) => {
              if (value) acc[key] = value;
              return acc;
            }, {} as { [key: string]: string });
          const response = await handler.handle({
            request,
            url,
            params,
          });
          return response;
        }

        return this.response404;
      },
    );
  }
}
