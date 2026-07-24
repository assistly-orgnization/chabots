'use client';

import { ApolloClient, InMemoryCache, createHttpLink, type DefaultOptions } from '@apollo/client';

const defaultOptions: DefaultOptions = {
  watchQuery: { fetchPolicy: 'no-cache', errorPolicy: 'all' },
  query: { fetchPolicy: 'no-cache', errorPolicy: 'all' },
  mutate: { fetchPolicy: 'no-cache', errorPolicy: 'all' },
};

export function createApolloClient(origin: string): ApolloClient<unknown> {
  const baseUrl = origin.replace(/\/$/, '');
  return new ApolloClient({
    link: createHttpLink({ uri: `${baseUrl}/api/graphql` }),
    cache: new InMemoryCache(),
    defaultOptions,
  });
}
