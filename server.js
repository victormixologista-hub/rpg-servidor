const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors'); // Importa o CORS

const app = express();
// Usa o CORS para permitir conexões do seu site (cPanel)
app.use(cors()); 

const server = http.createServer(app);

// Configuração do Socket.io com CORS
const io = new Server(server, {
  cors: {
    origin: "*", // Permite conexão de QUALQUER site. 
    methods: ["GET", "POST"]
  }
});

// Rota de teste
app.get('/', (req, res) => {
  res.send('Servidor do Jogo esta ONLINE!');
});

// Lógica do Jogo 3D
let players = {};

io.on('connection', (socket) => {
  console.log(`Jogador conectado: ${socket.id}`);

  // Cria um novo jogador
  players[socket.id] = {
    x: 0,
    y: 0, // No 3D, 'y' é geralmente a altura
    z: 0,
    playerId: socket.id
  };

  // Envia a lista de jogadores ATUAIS para o NOVO jogador
  socket.emit('currentPlayers', players);

  // Envia os dados do NOVO jogador para TODOS OS OUTROS jogadores
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Quando o jogador desconectar
  socket.on('disconnect', () => {
    console.log(`Jogador desconectado: ${socket.id}`);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

// Inicia o servidor
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
