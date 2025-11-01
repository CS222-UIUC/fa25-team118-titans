module.exports = {
  // Ensure setup runs before tests import application modules so the manual mock is active
  setupFiles: ['<rootDir>/jest.setup.js'],
};
