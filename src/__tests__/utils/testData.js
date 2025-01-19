const bcrypt = require('bcryptjs');
const crypto = require('crypto');


const VALID_ROLES = ['student', 'instructor'];
const DEFAULT_PASSWORD = 'password123';

const mockUser = {
    _id: '5f8f2f5e5d7a4f0017c3d7e3',
    email: 'test@example.com',
    role: 'student',
    comparePassword: jest.fn()
}

const loginPayload = {
    email: 'test@example.com',
    password: 'password123'
}


const generateUniqueEmail = (prefix) => {
    const randomString = crypto.randomBytes(2).toString('hex');
    return `${prefix}_${Date.now()}_${randomString}@test.com`;
};


const createTestUser = async (User, role = 'student') => {

    if (!VALID_ROLES.includes(role)) {
        throw new Error(`Invalid role: ${role}`);
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const user = await User.create({
        email: generateUniqueEmail(role),
        password: hashedPassword,
        firstName: 'Test',
        lastName: role.charAt(0).toUpperCase() + role.slice(1),
        role,
    });

    return user
};

module.exports = {
    VALID_ROLES
    , DEFAULT_PASSWORD,
    generateUniqueEmail,
    createTestUser,
    mockUser,
    loginPayload
};