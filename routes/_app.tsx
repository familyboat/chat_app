import type { PageProps } from "fresh";
import { State } from "../utils.ts";

export default function App({ Component, state }: PageProps<undefined, State>) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {state.meta?.title && (
          <>
            <title>{state.meta.title}</title>
          </>
        )}
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
