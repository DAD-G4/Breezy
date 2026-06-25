/** @type {import('jest').Config} */
module.exports = {
  projects: ['<rootDir>/packages/*'],
  forceExit: true,
  detectOpenHandles: true,
  maxWorkers: 1,
};
