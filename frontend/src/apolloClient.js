import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const GRAPHQL_URL = process.env.REACT_APP_GRAPHQL_URL || 'http://localhost:4000/graphql';

const client = new ApolloClient({
  link: new HttpLink({ uri: GRAPHQL_URL, fetch }),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          documents: {
            merge(existing = [], incoming) {
              return incoming;
            }
          }
        }
      }
    }
  })
});

export default client;
