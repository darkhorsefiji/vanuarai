// PM2 process config for the RAIVANUA API.
// PM2's daemon is independent of any terminal/agent session, so the API stays
// up (and auto-restarts on crash) without anyone babysitting it.
//
//   pm2 start ecosystem.config.js   # start (or reload) the API
//   pm2 save                        # remember it across reboots
//   pm2 logs raivanua-api           # tail logs
//   pm2 restart raivanua-api        # manual restart
//   pm2 stop raivanua-api           # stop
//
// The web (Vite) dev server is a separate concern — run `npm --prefix web run dev`
// or use the Desktop "Start VanuaRai" shortcut for the full dev experience.
module.exports = {
  apps: [
    {
      name: "raivanua-api",
      script: "server.js",
      cwd: __dirname,
      watch: false, // not a file-watcher; just keep it alive
      autorestart: true, // revive on crash
      max_restarts: 50,
      restart_delay: 2000, // back off 2s between restarts
      time: true, // timestamp log lines
    },
  ],
};
