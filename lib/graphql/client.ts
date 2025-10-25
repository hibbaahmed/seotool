import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/graphql`,
});

const authLink = setContext((_, { headers }) => {
  // Get WordPress credentials from environment variables
  const username = process.env.WP_USER;
  const password = process.env.WP_APP_PASS;
  
  // Create basic auth header
  const auth = username && password ? 
    Buffer.from(`${username}:${password}`).toString('base64') : 
    null;

  return {
    headers: {
      ...headers,
      authorization: auth ? `Basic ${auth}` : '',
    }
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

// Server-side client for API routes
export const createServerClient = () => {
  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
    ssrMode: true,
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
      },
      query: {
        errorPolicy: 'all',
      },
    },
  });
};
