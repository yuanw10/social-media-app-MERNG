const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserInputError } = require('apollo-server-errors');

const User = require('../../models/User');
const { SECRET_KEY } = require('../../config');
const { validateRegisterInput, validateLoginInput } = require('../../utils/validators');

/**
 * Generates a jwt token with id, email, username for a user
 * @param user User object
 * @returns {*} jwt token
 */
function generateJwtToken (user) {
    return jwt.sign({
        id: user.id,
        email: user.email,
        username: user.username
    }, SECRET_KEY, { expiresIn: '1h'});
}

module.exports = {
    Mutation: {
        async register(
            _,
            { registerInput: { username, email, password, confirmPassword } },
            context,
            info
        ) {

            // Check if username exists
            if (await User.findOne({ username })) {
                throw new UserInputError("Username exists", {
                    errors : {
                        username: "Username is taken."
                    }
                });
            }

            // Validate register input
            const { valid, errors } = validateRegisterInput(username, email, password, confirmPassword);
            if (!valid) {
                throw new UserInputError("RegisterInput invalid", {
                    errors
                });
            }

            // Create a user in mongoDB
            password = await bcrypt.hash(password, 12);
            const newUser = new User ({
                email,
                username,
                password,
                createdAt: new Date().toISOString()
            });
            const res = await newUser.save();
            const token = generateJwtToken(res);

            return {
                ...res._doc,
                id: res._id,
                token
            };
        },

        async login (_, { username, password }, context, info) {

            const { valid, errors } = validateLoginInput(username, password);
            if (!valid) {
                throw new UserInputError("LoginInput invalid", {
                    errors
                });
            }

            const user = await User.findOne({ username });
            if (!user) {
                errors.general = "User not found";
                throw new UserInputError("User not found", {
                    errors
                });
            }

            const passwordMatched = await bcrypt.compare(password, user.password);
            if (!passwordMatched) {
                errors.general = "Wrong password";
                throw new UserInputError("Wrong password", {
                    errors
                });
            }

            const token = generateJwtToken(user);

            return {
                ...user._doc,
                id: user._id,
                token
            };
        }
    }
}