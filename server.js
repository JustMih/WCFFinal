const ari = require('ari-client');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// const ARI_URL = 'http://10.52.0.19:8088';
// const ARI_USER = 'admin';
// const ARI_PASS = '@Ttcl123';

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

ari.connect(ARI_URL, ARI_USER, ARI_PASS)
  .then(client => {
    client.on('StasisStart', (event, channel) => {
      console.log('Channel entered Stasis application:', channel.name);
      io.emit('incoming_call', { caller: channel.caller.name });
    });

    client.start('my_stasis_app');
  })
  .catch(err => console.error('ARI connection error:', err));

io.on('connection', socket => {
  console.log('React client connected');

  socket.on('make_call', ({ number }) => {
    ari.connect(ARI_URL, ARI_USER, ARI_PASS).then(client => {
      client.channels.originate({
        endpoint: `SIP/${number}`,
        app: 'my_stasis_app',
        appArgs: 'dialed',
      });
    });
  });

  socket.on('hangup_call', ({ channelId }) => {
    ari.connect(ARI_URL, ARI_USER, ARI_PASS).then(client => {
      client.channels.get({ channelId })
        .then(channel => channel.hangup());
    });
  });
});

server.listen(4000, () => console.log('Server running on port 4000'));
