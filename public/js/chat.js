const socket = io(); 
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('message');
const sendMessageButton = messageForm.querySelector('button');
const shareLocationButton = document.getElementById('shareLocation');
const messages = document.getElementById('messages');

//Templates
const messageTemplate = document.getElementById('messageTemplate').innerHTML;
const locationTemplate = document.getElementById('locationTemplate').innerHTML;
const sideBarTemplate = document.getElementById('sideBarTemplate').innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const autoScroll = () => {
  const newMessage = messages.lastElementChild;

  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom, 10);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  const visibleHeight = messages.offsetHeight;

  const contentHeight = messages.scrollHeight;

  const scrollOffset = messages.scrollTop + visibleHeight;

  if (contentHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
}

socket.on('message', (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    created: moment(message.created).format('DD MMM YYYY HH:mm:ss')
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

socket.on('locationMessage', (message) => {
  console.log(message);
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.url,
    created: moment(message.created).format('DD MMM YYYY HH:mm:ss')
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sideBarTemplate, {
    room,
    users
  });
  document.getElementById('sideBar').innerHTML = html;
});

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();

  sendMessageButton.setAttribute('disabled', 'disabled');

  socket.emit('sendMessage', messageInput.value, (error) => {
    sendMessageButton.removeAttribute('disabled');
    messageInput.value = '';
    messageInput.focus();
    if (error) {
      return console.log(error);
    }
    console.log('Message delivered!');
  });
});

shareLocationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert("Your browser doesn't support geolocation");
  }
  shareLocationButton.setAttribute('disabled', 'disabled');
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }, () => {
      shareLocationButton.removeAttribute('disabled');
      console.log('Location shared!');
    });
  });
});

socket.emit('join', {
  username,
  room
}, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});