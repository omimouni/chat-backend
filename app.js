const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const { v4 } = require('uuid');

const app = express();
const server = createServer(app, {
  cors: {
    origin: "*"
  }
});

const io = new Server(server);

let users_list = [];
io.on('connection', socket => {
  socket.emit('user_id', socket.id);
  socket.join(socket.id);

  users_list.push({
    id: socket.id,
    room: null,
  });

  const update_list = _ => {

    if (users_list.length % 2 === 0) {
      let room_n = 0;
      let room_id = v4();
      for (let i = 0; i < users_list.length; i++) {
        users_list[i].room = room_id;
        io.to(users_list[i].id).emit("room_id", room_id);
        room_n++;
        if (room_n == 2) {
          room_id = v4();
          room_n = 0;
        }
        console.log(i);
      }
    }

    io.emit('users_list', users_list);

  }

  update_list();
  socket.on('disconnect', _ => {
    let deleted_user = users_list.find(u => u.id === socket.id);
    users_list = [...users_list.filter(u => u.id !== socket.id)];

    if (users_list.length > 0) {
      for (let i = 0; i < users_list.length; i++) {
        if (users_list[i].room === deleted_user.room) {
          users_list[i].room = null;
          io.to(users_list[i].id).emit("room_id", null);
        }
      }
    }
    update_list();
  });

  socket.on('typing_event', e => {
    // get the other user
    let other_user = users_list.filter(u => (u.room == e.room && u.id != e.from));
    io.to(other_user[0].id).emit("typing_update", e.payload);
  });

  socket.on('message_send', e => {
    let other_user = users_list.filter(u => (u.room == e.room && u.id != e.from));
    let room_users = users_list.filter(u => (u.room == e.room));
    
    for (let i = 0; i < room_users.length; i++) {
      io.to(room_users[i].id).emit('message_add', {from: e.from, msg: e.msg});
    }
    io.to(other_user[0].id).emit('message_notif', null);
  });
});


server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});