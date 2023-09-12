const { AuthenticationError } = require("apollo-server");

const Post = require('../../models/Post');
const checkAuth = require('../../utils/check_auth');

module.exports = {
    Query: {
        async getPosts() {
            try {
                // get all posts in descending order - newest showed first
                return await Post.find().sort({ createdAt: -1 });
            } catch (err) {
                throw new Error(err);
            }
        },

        async getPost(_, { postId }) {
            try {
                const post =  await Post.findById(postId);
                if (post) {
                    return post;
                } else {
                    throw new Error('Post not found');
                }
            } catch (err) {
                throw new Error(err);
            }
        }
    },

    Mutation: {
        async createPost(_, { body }, context) {
            const user = checkAuth(context);

            const post = new Post ({
                username: user.username,
                body,
                createdAt: new Date().toISOString(),
                user: user.id
            });

            return await post.save();
        },

        async deletePost(_, { postId }, context) {
            const user = checkAuth(context);

            try {
                const post = await Post.findById(postId);
                if (post.user == user.id) {
                    await post.deleteOne();
                    return "Post deleted";
                } else {
                    throw new AuthenticationError('Action denied');
                }

            } catch (err) {
                throw new Error(err);
            }
        }
    }
}