module.exports = {
  apps: [{
    name: "malayalamitram",
    script: "server.cjs",
    instances: 1,
    autorestart: true,
    env: { NODE_ENV: "production", PORT: 4000 },
  }],
};
