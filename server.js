// ===================================
// ARQUIVO: server.js (v5.0 - COMBATE!)
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
  res.send('Servidor do Jogo esta ONLINE! (v5.0 com Combate)');
});

let players = {};

io.on('connection', (socket) => {
  console.log(`Socket conectado: ${socket.id}`);

  // Ouve o pedido de "Start" do jogador
  socket.on('playerJoinRequest', (data) => {
    const { nickname, model } = data;
    console.log(`Jogador ${socket.id} entrou como ${nickname} (${model})`);

    players[socket.id] = {
      x: 0, y: 0, z: 0,
      playerId: socket.id,
      nickname: nickname,
      model: model,
      hp: 100,
      maxHp: 100,
      // ---- NOVO SISTEMA DE ADMIN ----
      // (Baseado no seu nome que eu tenho no contexto)
      isAdmin: (nickname.toLowerCase() === 'victor rocha') 
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
      socket.broadcast.emit('playerMoved', {
        playerId: socket.id,
        position: players[socket.id]
      });
    }
  });
  
  // ---- NOVO SISTEMA DE COMBATE ----
  socket.on('useSkill1', (targetId) => {
    const attacker = players[socket.id];
    const victim = players[targetId];

    // Se o atacante ou a vítima não existem (ex: já morreram), para.
    if (!attacker || !victim) return;

    // Admin não pode ser morto (exemplo)
    if (victim.isAdmin) {
      // Manda uma mensagem só para o atacante
      socket.emit('showGameMessage', 'Você não pode atacar um Admin!');
      return;
    }

    // Causa 34 de dano
    victim.hp -= 34;
    
    if (victim.hp <= 0) {
      victim.hp = 0;
      // Vítima morreu
      console.log(`Jogador ${victim.nickname} foi morto por ${attacker.nickname}`);
      // Avisa a todos que a vítima morreu
      io.emit('playerKilled', { 
        victimId: victim.playerId, 
        attackerId: attacker.playerId,
        victimNick: victim.nickname,
        attackerNick: attacker.nickname
      });
      // Remove o jogador morto
      delete players[victim.playerId];
    } else {
      // Apenas atualiza o HP
      io.emit('updateHP', { 
        playerId: victim.playerId, 
        hp: victim.hp 
      });
    }
  });


  // Quando o jogador desconectar
  socket.on('disconnect', () => {
    console.log(`Jogador desconectado: ${socket.id}`);
    if(players[socket.id]) {
      const nick = players[socket.id].nickname;
      delete players[socket.id];
      // Avisa a todos que o jogador saiu (não "morreu")
      io.emit('playerDisconnected', {playerId: socket.id, nick: nick});
    }
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Servidor v5.0 (Combate) rodando na porta ${PORT}`);
});
