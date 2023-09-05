const {ApolloServer} = require('apollo-server');
const gql = require('graphql-tag');
const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config');

const typeDefs = gql`
    type Query{
        sayHi: String!
    }
`

const resolvers = {
    Query: {
        sayHi: () => "Hello, World!"
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers
});

mongoose
    .connect(MONGODB_URI, { useNewUrlParser: true})
    .then(() => {
        console.log('MongoDB connected.')
        return server.listen(({ port: 6000}))
    })
    .then((res) => {
        console.log(`Server running at ${res.url}`);
    });