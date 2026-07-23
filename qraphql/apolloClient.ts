import { ApolloClient, InMemoryCache, DefaultOptions, createHttpLink } from '@apollo/client';

const httpLink = createHttpLink({
  uri: '/api/graphql',
});

const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
  },
  query: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
  },
  mutate: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
  },
};

const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
    defaultOptions: defaultOptions,
});

export default client;