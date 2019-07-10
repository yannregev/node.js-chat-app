const http = require('http')
const express = require('express')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')
const port = process.env.port || 3000


const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(express.static(path.join(__dirname,'../public')))

io.on('connection', (socket) => {


  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({ id:socket.id, username, room })

    if (error) {
      return callback(error)
    }

    socket.join(user.room)
    socket.emit('message', generateMessage('Admin','Welcome!'))
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined the room!`))
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })
    callback()
  })

  socket.on('sendMessage', (msg, callback) => {
    const user = getUser(socket.id)
    const filter = new Filter()
    if (filter.isProfane(msg)) {
      return callback('Profanity is not allowed')
    }
    io.to(user.room).emit('message', generateMessage(user.username, msg))
    callback('delivered')
  })

  socket.on('sendLocation', ({longitude, latitude}, callback) => {
    const user = getUser(socket.id)
    io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps?q=${latitude},${longitude}`))
    callback()
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)
    if (user) {
      io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`))
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }

  })
})





server.listen(port, () => {
  console.log('Listening on port ' + port)
})
