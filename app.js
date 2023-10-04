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


// Socket io
const io = new Server(server);
// let users_list = [];
// let rooms = [];

// io.set('origins', '*');

let users_list = [];
io.on('connection', (socket) => {
  socket.emit('user_id', socket.id);

  users_list.push({
    id: socket.id,
    room: null,
  });
  socket.join(socket.id);

  const update_users = () => {
    // Check if the user can have a room
    const a_users = users_list.filter(u => u.room === null);

    if (a_users.length > 1) {
      // console.log(a_users);
      let room_number = 0;
      room_id = v4();

      for (let i = 0; i < a_users.length; i++) {

        a_users[i].room = room_id;
        io.to(a_users[i].id).emit('room_id', room_id);
        room_number++;
        if (room_number == 2) {
          room_number = 0;
          room_id = v4();
        }
      }
    }

    io.emit('users_list', users_list);
  }

  update_users();
  socket.on('disconnect', _ => {
    // Remove the socket from the users list
    let user = users_list.find(u => u.id === socket.id);
    users_list = [...users_list.filter(user => user.id !== socket.id)];

    // check if he had a room
    if (user.room != null) {
      let uu = users_list.find(u => u.room === user.room);
      if (users_list.length > 0) {
        uu.room = null;
        io.to(uu.id).emit('room_id', null);

      }
    }
    update_users();
  });

  socket.on('send_message', msg => {
    let users = users_list.filter(user => user.room === msg.room);
    if (msg.message !== '') {
      for (let i = 0; i < users.length; i++) {
        // console.log(msg, i);
        io.to(users[i].id).emit('add_message', msg);
      }
    } 
  });

  socket.on('typing', msg => {
    console.log(msg);
    let users = users_list.filter(user => user.room === msg.room);
    if (msg.message !== '') {
      for (let i = 0; i < users.length; i++) {
        // console.log(msg, i);
        io.to(users[i].id).emit('typind_send', msg);
      }
    } 
  });
});

//   users_list.push({
//     id: socket.id,
//     socket: socket
//   });

//   const update_user = () => {
//     io.emit('number_users', users_list.length);
//     io.emit('users_id', users_list.map(u => u.id));
//     socket.emit('receive_id', socket.id);
//     // Create rooms
//     if (users_list.length >= 2) {
//       let room = [users_list.shift(), users_list.shift()];
//       rooms.push(room);
//     }

//   }

//   update_user();

//   socket.on('disconnect', (o) => {
//     // console.log("hello world!", socket.id);
//     users_list = [...users_list.filter(u => u.id !== socket.id)];
//     update_user();
//   });

//   socket.on('send_message', msg => {
//     console.log(msg);
//     // check if user is in a room
//     let r = rooms.filter(u => u[0].id === msg.id || u[1].id === msg.id);
//     console.log(r.length);
//     if (r.length == 1) {
//       if (r[0].id === msg.id) {
//         r[1].socket.emit('add_message', msg);
//       }
//       else {
//         r[0].socket.emit('add_message', msg);
//       }
//     }
//     // io.emit('add_message', msg);
//   });

// });

// Socket io

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});