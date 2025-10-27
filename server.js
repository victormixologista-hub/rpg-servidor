// ===================================
// ARQUIVO: server.js (v8.0 - O PROJETO PRONTO)
// ===================================

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors()); 
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.get('/', (req, res) => {
  res.send('Servidor do Jogo esta ONLINE! (v8.0 - Projeto Pronto)');
});

let players = {};
// Nossos novos personagens (leves)
const models = ['soldier', 'mage']; 

io.on('connection', (socket) => {
  console.log(`Socket conectado: ${socket.id}`);

  // Ouve o pedido de "Start" do jogador
  socket.on('playerJoinRequest', (data) => {
    const { nickname } = data;
    
    // Alterna os personagens
    const playerCount = Object.keys(players).length;
    const playerModel = models[playerCount % 2];
    
    console.log(`Jogador ${socket.id} entrou como ${nickname} (${playerModel})`);

    // SPAWN SEGURO NA NOVA ARENA
    players[socket.id] = {
      x: Math.random() * 10 - 5, // Posição aleatória no centro
      y: 0.1, // Um pouco acima do chão
      z: Math.random() * 10 - 5,
      playerId: socket.id,
      nickname: nickname,
      model: playerModel, // "soldier" ou "mage"
      hp: 100,
      maxHp: 100,
      isAdmin: (nickname.toLowerCase().includes('victor'))
    };

    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);
  });


  // Ouve o movimento
  socket.on('playerMovement', (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].z = movementData.z;
      players[socket.id].rotationY = movementData.rotationY;

      socket.broadcast.emit('playerMoved', {
        playerId: socket.id,
        position: players[socket.id],
        rotation: players[socket.id].rotationY
      });
    }
  });
  
  // Sistema de Combate (ATAQUE)
  socket.on('useSkill1', (targetId) => {
    const attacker = players[socket.id];
    const victim = players[targetId];

    if (!attacker || !victim) return;
    if (victim.isAdmin) {
      socket.emit('showGameMessage', 'Você não pode atacar um Admin!');
      return;
    }

    victim.hp -= 34;
    
    if (victim.hp <= 0) {
      victim.hp = 0;
      io.emit('playerKilled', { 
        victimId: victim.playerId, attackerId: attacker.playerId,
        victimNick: victim.nickname, attackerNick: attacker.nickname
      });
      delete players[victim.playerId];
    } else {
      io.emit('updateHP', { playerId: victim.playerId, hp: victim.hp });
    }
  });


  // Quando o jogador desconectar
  socket.on('disconnect', () => {
    console.log(`Jogador desconectado: ${socket.id}`);
    if(players[socket.id]) {
      const nick = players[socket.id].nickname;
      delete players[socket.id];
      io.emit('playerDisconnected', {playerId: socket.id, nick: nick});
    }
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Servidor v8.0 (Projeto Pronto) rodando na porta ${PORT}`);
});
