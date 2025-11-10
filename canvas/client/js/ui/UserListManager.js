class UserListManager {
  constructor(currentUserId) {
    this.currentUserId = currentUserId;
    this.usersList = document.getElementById('usersList');
    this.userCounter = document.getElementById('userCounter');
    this.users = new Map();
  }

  initializeUsers(users) {
    this.users.clear();
    users.forEach(user => {
      this.users.set(user.id, user);
    });
    this.render();
  }

  addUser(user) {
    this.users.set(user.id, user);
    this.render();
  }

  removeUser(userId) {
    this.users.delete(userId);
    this.render();
  }

  updateCount() {
    this.userCounter.textContent = this.users.size;
  }

  render() {
    this.usersList.innerHTML = '';
    
    const sortedUsers = Array.from(this.users.values()).sort((a, b) => {
      if (a.id === this.currentUserId) return -1;
      if (b.id === this.currentUserId) return 1;
      return a.name.localeCompare(b.name);
    });
    
    sortedUsers.forEach(user => {
      const userItem = this.createUserItem(user);
      this.usersList.appendChild(userItem);
    });
    
    this.updateCount();
  }

  createUserItem(user) {
    const div = document.createElement('div');
    div.className = 'user-item';
    
    if (user.id === this.currentUserId) {
      div.classList.add('current-user');
    }
    
    const colorDot = document.createElement('span');
    colorDot.className = 'user-color-dot';
    colorDot.style.backgroundColor = user.color;
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'user-item-name';
    nameSpan.textContent = user.id === this.currentUserId ? 'You' : user.name;
    
    div.appendChild(colorDot);
    div.appendChild(nameSpan);
    
    return div;
  }
}
