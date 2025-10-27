// ===================================
// ARQUIVO: server.js (v4.0 - COM LOGIN)
// ===================================

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors()); 
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

app.get('/', (req, res) => {
  res.send('Servidor do Jogo esta ONLINE! (v4.0 com Login)');
});

let players = {};

io.on('connection', (socket) => {
  console.log(`Socket conectado: ${socket.id}`);

  // ---- GRANDE MUDANÇA ----
  // Não criamos o jogador aqui. Esperamos o "Start" do cliente.
  
  // 1. Ouve o pedido de "Start" do jogador
  socket.on('playerJoinRequest', (data) => {
    const { nickname, model } = data;
    console.log(`Jogador ${socket.id} entrou no jogo como ${nickname} com o modelo ${model}`);

    // 2. Cria o jogador com os dados recebidos
    players[socket.id] = {
      x: 0,
      y: 0, 
      z: 0,
      playerId: socket.id,
      nickname: nickname,
      model: model,
      hp: 100 // <-- JÁ VAMOS ADICIONAR A VIDA (HP)
    };

    // 3. Envia a lista de jogadores ATUAIS para o NOVO jogador
    socket.emit('currentPlayers', players);
    
    // 4. Envia os dados do NOVO jogador para TODOS OS OUTROS
    socket.broadcast.emit('newPlayer', players[socket.id]);
  });


  // Ouve por "playerMovement" de um jogador
  socket.on('playerMovement', (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].z = movementData.z;

      socket.broadcast.emit('playerMoved', {
        playerId: socket.id,
        position: players[socket.id]
      });
    }
  });

  // Quando o jogador desconectar
  socket.on('disconnect', () => {
    console.log(`Jogador desconectado: ${socket.id}`);
    // Avisa a todos que o jogador saiu
    if(players[socket.id]) {
      delete players[socket.id];
      io.emit('playerDisconnected', socket.id);
    }
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Servidor v4.0 rodando na porta ${PORT}`);
});
