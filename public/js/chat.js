const socket = io()

//Elements
const $messageFrom = document.querySelector('.form')
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button')
const $sendLocationButton = document.querySelector('#sendLocation')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoScroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageheight = $newMessage.offsetHeight + newMessageMargin


  // Visible height
  const visibleHeight = $messages.offsetHeight

  // Height of messages container
  const containerHeight = $messages.scrollHeight

  //How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - newMessageheight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }

}

socket.on('message',(message) => {
  console.log(message)
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoScroll()
})

socket.on('locationMessage', (message) => {
  console.log(message)
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoScroll()
})


$messageFrom.addEventListener('submit', (e) => {
  e.preventDefault()
  $messageFormButton.setAttribute('disabled','disabled')
  const message = e.target.elements.message.value
  socket.emit('sendMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value = ""
    $messageFormInput.focus()

    if (error) {
      return console.log(error)
    }
    console.log('Message delivered')
  })
})

$sendLocationButton.addEventListener('click', (e) => {

  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browers')
  }

  $sendLocationButton.setAttribute('disabled','disabled')

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      longitude: position.coords.longitude,
       latitude: position.coords.latitude
     }, () => {
       $sendLocationButton.removeAttribute('disabled')
       console.log('Location shared!')
     })
  })
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html
})

socket.emit('join', {username, room}, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})
