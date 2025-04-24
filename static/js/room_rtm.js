var messages = [];

let handleMemberJoined = async (MemberId) => {
    console.log('A new member has joined the room:', MemberId)
    addMemberToDom(MemberId)

    let members = await channel.getMembers()
    updateMemberTotal(members)

    let {name} = await rtmClient.getUserAttributesByKeys(MemberId, ['name'])
    addBotMessageToDom(`Welcome to the room ${name}! 👋`)
}

let addMemberToDom = async (MemberId) => {
    let {name} = await rtmClient.getUserAttributesByKeys(MemberId, ['name'])

    let membersWrapper = document.getElementById('member__list')
    let memberItem = `<div class="member__wrapper" id="member__${MemberId}__wrapper">
                    <span class="green__icon"></span>
                    <p class="member_name">${name}</p>
                </div>`

    membersWrapper.insertAdjacentHTML('beforeend', memberItem)
}

let updateMemberTotal = async (members) => {
    let total = document.getElementById('members__count')
    total.innerText = members.length
}

let handleMemberLeft = async (MemberId) => {
    removeMemberFromDom(MemberId)

    let members = await channel.getMembers()
    updateMemberTotal(members)
}

let removeMemberFromDom = async (MemberId) => {
    let memberWrapper = document.getElementById(`member__${MemberId}__wrapper`)
    let name = memberWrapper.getElementsByClassName('member_name')[0].textContent
    addBotMessageToDom(`${name} has left the room.`)
    
    memberWrapper.remove()
}

let getMembers = async () => {
    let members = await channel.getMembers()
    updateMemberTotal(members)
    for (let i = 0; members.length > i; i++){
        addMemberToDom(members[i])
    }
}

let handleChannelMessage = async (messageData, MemberId) => {
    console.log('A new message was received')
    let data = JSON.parse(messageData.text)

    if(data.type === 'chat'){
        addMessageToDom(data.displayName, data.message)
        messages.push({ displayName: data.displayName, message: data.message, type: 'chat' })
    }

    if(data.type === 'file'){
        addFileMessageToDom(data.displayName, data.fileUrl, data.fileName, data.fileType)
        messages.push({ displayName: data.displayName, fileUrl: data.fileUrl, fileName: data.fileName, fileType: data.fileType, type: 'file' })
    }

    if(data.type === 'user_left'){
        document.getElementById(`user-container-${data.uid}`).remove()

        if(userIdInDisplayFrame === `user-container-${data.uid}`){
            displayFrame.style.display = null

            for(let i = 0; videoFrames.length > i; i++){
                videoFrames[i].style.height = '300px'
                videoFrames[i].style.width = '300px'
            }
        }
    }
}

let sendMessage = async (e) => {
    e.preventDefault();

    let message = messageInput.value.trim();
    if (message.length === 0) {
        return;
    }

    channel.sendMessage({ text: JSON.stringify({ 'type': 'chat', 'message': message, 'displayName': displayName }) });
    addMessageToDom(displayName, message);
    messages.push({ displayName: displayName, message: message, type: 'chat' })

    messageInput.value = '';

    if (message.toLowerCase().includes("jarvis!")) {
        try {
            const response = await fetch('/api/bot-response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            });

            if (response.ok) {
                const data = await response.json();
                const botMessage = data.bot_message;

                messages.push({ displayName: 'Jarvis AI', message: botMessage, type: 'bot' })

                addBotMessageToDom(botMessage);
            } else {
                console.error('Failed to get response from bot');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

let handleFileUpload = async () => {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/upload-file', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            const { file_url, file_name, file_type } = data;

            channel.sendMessage({
                text: JSON.stringify({
                    'type': 'file',
                    'fileUrl': file_url,
                    'fileName': file_name,
                    'fileType': file_type,
                    'displayName': displayName
                })
            });
            addFileMessageToDom(displayName, file_url, file_name, file_type);
            messages.push({ displayName: displayName, fileUrl: file_url, fileName: file_name, fileType: file_type, type: 'file' });
        } else {
            console.error('File upload failed');
            alert('Failed to upload file. Please login and try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error uploading file. Please try again.');
    }

    fileInput.value = '';
}

let addMessageToDom = (name, message) => {
    let messagesWrapper = document.getElementById('messages')

    let newMessage = `<div class="message__wrapper">
                        <div class="message__body">
                            <strong class="message__author">${name}</strong>
                            <p class="message__text">${message}</p>
                        </div>
                    </div>`

    messagesWrapper.insertAdjacentHTML('beforeend', newMessage)

    let lastMessage = document.querySelector('#messages .message__wrapper:last-child')
    if(lastMessage){
        lastMessage.scrollIntoView()
    }
}

let addFileMessageToDom = (name, fileUrl, fileName, fileType) => {
    let messagesWrapper = document.getElementById('messages')

    let content = '';
    if (fileType && fileType.startsWith('image/')) {
        content = `<img src="${fileUrl}" alt="${fileName}" class="message__file__image" /><br><a href="${fileUrl}" download="${fileName}" class="message__file__link">Download ${fileName}</a>`;
    } else {
        content = `<a href="${fileUrl}" download="${fileName}" class="message__file__link">${fileName}</a>`;
    }

    let newMessage = `<div class="message__wrapper">
                        <div class="message__body">
                            <strong class="message__author">${name}</strong>
                            ${content}
                        </div>
                    </div>`

    messagesWrapper.insertAdjacentHTML('beforeend', newMessage)

    let lastMessage = document.querySelector('#messages .message__wrapper:last-child')
    if(lastMessage){
        lastMessage.scrollIntoView()
    }
}

let addBotMessageToDom = (botMessage) => {
    let messagesWrapper = document.getElementById('messages')

    let newMessage = `<div class="message__wrapper">
                        <div class="message__body__bot">
                            <strong class="message__author__bot">🤖 Jarvis AI</strong>
                            <p class="message__text__bot">${botMessage}</p>
                        </div>
                    </div>`

    messagesWrapper.insertAdjacentHTML('beforeend', newMessage)

    let lastMessage = document.querySelector('#messages .message__wrapper:last-child')
    if(lastMessage){
        lastMessage.scrollIntoView()
    }
}

const messageInput = document.getElementById('message-input');

document.addEventListener('DOMContentLoaded', () => {
    const emojiButton = document.getElementById('emoji-button');
    const emojiPickerContainer = document.getElementById('emoji-picker-container');
    const sendButton = document.getElementById('send-button');
    const fileInput = document.getElementById('file-input');

    let pickerVisible = false;

    if (typeof EmojiMart !== 'undefined') {
        console.log('EmojiMart loaded successfully');
        const picker = new EmojiMart.Picker({
            onEmojiSelect: (emoji) => {
                console.log('Emoji selected:', emoji.native);
                if (messageInput) {
                    messageInput.value += emoji.native;
                } else {
                    console.error('messageInput is not found');
                }
                emojiPickerContainer.style.display = 'none';
                pickerVisible = false;
            }
        });

        emojiPickerContainer.appendChild(picker);

        emojiButton.addEventListener('click', () => {
            pickerVisible = !pickerVisible;
            emojiPickerContainer.style.display = pickerVisible ? 'block' : 'none';
            console.log('Picker visible:', pickerVisible);
        });

        document.addEventListener('click', (event) => {
            if (!emojiPickerContainer.contains(event.target) && event.target !== emojiButton) {
                emojiPickerContainer.style.display = 'none';
                pickerVisible = false;
            }
        });
    } else {
        console.error('EmojiMart failed to load');
        emojiButton.style.display = 'none';
        const errorMessage = document.createElement('p');
        errorMessage.style.color = '#ff5050';
        errorMessage.textContent = 'Emoji picker unavailable';
        emojiPickerContainer.appendChild(errorMessage);
    }

    sendButton.addEventListener('click', (e) => sendMessage(e));
    fileInput.addEventListener('change', handleFileUpload);
});

let leaveChannel = async () => {
    await channel.leave()
    await rtmClient.logout()
}

window.addEventListener('beforeunload', leaveChannel)

let messageForm = document.getElementById('message__form')
messageForm.addEventListener('submit', sendMessage)