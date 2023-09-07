const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserInputError } = require('apollo-server-errors');

const User = require('../../models/User');
const { SECRET_KEY } = require('../../config');
const { validateRegisterInput } = require('../../utils/validators');

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
                })
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
            const token = jwt.sign({
                id: res.id,
                email: res.email,
                username: res.username
            }, SECRET_KEY, { expiresIn: '1h'});


            return {
                ...res._doc,
                id: res._id,
                token
            };
        }
    }
}