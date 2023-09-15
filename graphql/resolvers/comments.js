const { UserInputError, AuthenticationError } = require('apollo-server-errors');

const Post = require('../../models/Post');
const checkAuth = require("../../utils/check_auth");

module.exports = {
    Mutation : {
        async createComment (_, { postId, body }, context, info) {
            if (body.trim() === '') {
                throw new UserInputError('Empty comment', {
                    errors: {
                        body: 'Comment body must not be empty'
                    }
                })
            }

            const post = await Post.findById(postId);
            const { username } = checkAuth(context);

            if (post) {
                post.comments.unshift({
                    body,
                    createdAt: new Date().toISOString(),
                    username
                })

                await post.save();
                return post;
            } else {
                throw new UserInputError('Post not found');
            }
        },

        async deleteComment (_, { postId, commentId }, context, info) {
            const { username } = checkAuth(context);
            const post = await Post.findById(postId);
            if (post) {
                const commentIndex = post.comments.findIndex(c => c.id === commentId);

                if (post.comments[commentIndex].username === username) {
                    post.comments.splice(commentIndex, 1);

                    await post.save();
                    return post;
                } else {
                    throw new AuthenticationError('Action denied');
                }
            } else {
                throw new UserInputError('Post not found');
            }
        }
    }
}