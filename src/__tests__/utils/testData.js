const generateUniqueEmail = (prefix) => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`;
};

const createTestUser = async (User, role = 'student') => {
    return await User.create({
        email: generateUniqueEmail(role),
        password: 'password123',
        firstName: 'Test',
        lastName: role.charAt(0).toUpperCase() + role.slice(1),
        role
    });
};

module.exports = {
    generateUniqueEmail,
    createTestUser
};