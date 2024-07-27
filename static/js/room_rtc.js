const APP_ID = WEB_API

let uid = sessionStorage.getItem('uid')
if(!uid){
    uid = String(Math.floor(Math.random() * 10000))
    sessionStorage.setItem('uid', uid)
}

let token = null;
let client;

let rtmClient;
let channel;

const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')

if(!roomId){
    roomId = 'main'
}

let displayName = sessionStorage.getItem('display_name')
if(!displayName){
    window.location.href = '/';
}

let localTracks = []
let remoteUsers = {}

let mediaRecorder;
let localVideoFilePath;
let chunks = [];

var participants = [];

let localScreenTracks;
let sharingScreen = false;

function getInitials(username) {
    return username.split(' ').map(name => name[0].toUpperCase()).join('');
}


let joinRoomInit = async () => {
    rtmClient = await AgoraRTM.createInstance(APP_ID)
    await rtmClient.login({uid, token})

    await rtmClient.addOrUpdateLocalUserAttributes({'name':displayName})

    channel = await rtmClient.createChannel(roomId)
    await channel.join()

    channel.on('MemberJoined', handleMemberJoined)
    channel.on('MemberLeft', handleMemberLeft)
    channel.on('ChannelMessage', handleChannelMessage)

    getMembers()
    addBotMessageToDom(`Welcome to the room ${displayName}! 👋`)
    participants.push(displayName)

    client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})
    await client.join(APP_ID, roomId, token, uid)

    client.on('user-published', handleUserPublished)
    client.on('user-left', handleUserLeft)
}

let joinStream = async () => {
    document.getElementById('join-btn').style.display = 'none'
    document.getElementsByClassName('stream__actions')[0].style.display = 'flex'
   
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({}, {encoderConfig:{
        width:{min:640, ideal:1920, max:1920},
        height:{min:480, ideal:1080, max:1080}
    }})

    let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                 </div>`

    document.getElementById('streams__container').insertAdjacentHTML('beforeend', player)
    document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame)

    localTracks[1].play(`user-${uid}`)
    await client.publish([localTracks[0], localTracks[1]])
}


let switchToCamera = async () => {
    let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                 </div>`
    displayFrame.insertAdjacentHTML('beforeend', player)

    await localTracks[0].setMuted(true)
    await localTracks[1].setMuted(true)

    document.getElementById('mic-btn').classList.remove('active')
    document.getElementById('screen-btn').classList.remove('active')

    // Hide the video element when the camera is off
    document.getElementById(`user-${uid}`).style.display = 'none';
    
    // Add the background image to the container
    document.getElementById(`user-container-${uid}`).style.backgroundImage = `url('https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&rounded=true&background=random&bold=true')`;
    console.log(displayName)

    localTracks[1].play(`user-${uid}`)
    await client.publish([localTracks[1]])
}



let handleUserPublished = async (user, mediaType) => {
    remoteUsers[user.uid] = user

    await client.subscribe(user, mediaType)

    let player = document.getElementById(`user-container-${user.uid}`)
    if(player === null){
        player = `<div class="video__container" id="user-container-${user.uid}" style="background-image: url('https://ui-avatars.com/api/?name=${user.name}&rounded=true&background=random&bold=true')">
                <div class="video-player" id="user-${user.uid}"></div>
            </div>`
        console.log(user.name)

        document.getElementById('streams__container').insertAdjacentHTML('beforeend', player)
        document.getElementById(`user-container-${user.uid}`).addEventListener('click', expandVideoFrame)
   
    }

    if(displayFrame.style.display){
        let videoFrame = document.getElementById(`user-container-${user.uid}`)
        videoFrame.style.height = '100px'
        videoFrame.style.width = '100px'
    }

    if(mediaType === 'video'){
        user.videoTrack.play(`user-${user.uid}`)
    }

    if(mediaType === 'audio'){
        user.audioTrack.play()
    }

}

let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid]
    let item = document.getElementById(`user-container-${user.uid}`)
    if(item){
        item.remove()
    }

    if(userIdInDisplayFrame === `user-container-${user.uid}`){
        displayFrame.style.display = null

        let videoFrames = document.getElementsByClassName('video__container')

        for(let i=0; videoFrames.length > i; i++){
            videoFrames[i].style.height = '300px'
            videoFrames[i].style.width = '300px'
          }
    }
}


let toggleMic = async (e) => {
    let button = e.currentTarget

    if (localTracks[0].muted){
        await localTracks[0].setMuted(false)
        button.classList.add('active')
    }else{
        await localTracks[0].setMuted(true)
        button.classList.remove('active')
    }
}


let toggleCamera = async (e) => {
    let button = e.currentTarget
    let videoContainer = document.getElementById(`user-container-${uid}`);
    let videoElement = document.getElementById(`user-${uid}`);

    if (localTracks[1].muted){
        await localTracks[1].setMuted(false)
        button.classList.add('active')

        // Show video and remove background image
        videoElement.style.display = 'block';
        videoContainer.style.backgroundImage = 'none';

    }else{
        await localTracks[1].setMuted(true)
        button.classList.remove('active')

        // Hide video and set background image
        videoElement.style.display = 'none';
        videoContainer.style.backgroundImage = `url('https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&rounded=true&background=random&bold=true')`;
        console.log(displayName)
    }
}

let toggleScreen = async (e) => {
    let screenButton = e.currentTarget
    let cameraButton = document.getElementById('camera-btn')

    if(!sharingScreen){
        sharingScreen = true

        screenButton.classList.add('active')
        cameraButton.classList.remove('active')
        cameraButton.style.display = 'none'

        localScreenTracks = await AgoraRTC.createScreenVideoTrack()

        document.getElementById(`user-container-${uid}`).remove()
        displayFrame.style.display = 'block'

        let player = `<div class="video__container" id="user-container-${uid}" style="background-image: url('https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&rounded=true&background=random&bold=true')">
                    <div class="video-player" id="user-${uid}"></div>
                </div>`

        displayFrame.insertAdjacentHTML('beforeend', player)
        document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame)

        await client.unpublish([localTracks[1]])
        await client.publish([localScreenTracks])

        let videoFrames = document.getElementsByClassName('video__container')
        for(let i = 0; videoFrames.length > i; i++){
            if(videoFrames[i].id != userIdInDisplayFrame){
              videoFrames[i].style.height = '100px'
              videoFrames[i].style.width = '100px'
            }
          }

    }else{
        sharingScreen = false
        cameraButton.style.display = 'block'
        document.getElementById(`user-container-${uid}`).remove()
        await client.unpublish([localScreenTracks])

        switchToCamera()
    }
}

let isRecording = false;

async function startRecording() {
    const combinedStream = new MediaStream();

    combinedStream.addTrack(localTracks[0].getMediaStreamTrack());  // Add local audio track
    combinedStream.addTrack(localTracks[1].getMediaStreamTrack());  // Add local video track

    for (let userId in remoteUsers) {
        const user = remoteUsers[userId];
        if (user.audioTrack) {
            combinedStream.addTrack(user.audioTrack.getMediaStreamTrack());  // Add remote audio track
        }
        if (user.videoTrack) {
            combinedStream.addTrack(user.videoTrack.getMediaStreamTrack());  // Add remote video track
        }
    }

    mediaRecorder = new MediaRecorder(combinedStream);

    mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
            chunks.push(event.data);
        }
    };

    mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const formData = new FormData();
        formData.append('file', blob, 'recording.webm');

        try {
            const response = await fetch('/upload-video', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            localVideoFilePath = result.file_path;
            await saveSessionData();
        } catch (error) {
            console.error('Error uploading video:', error);
        }
    };

    mediaRecorder.start();
    document.getElementById('record-btn').classList.add('active');
    isRecording = true;
}

async function stopRecording() {
    mediaRecorder.stop();
    document.getElementById('record-btn').classList.remove('active');
    isRecording = false;
}

let toggleRecording = async () => {
    if (isRecording) {
        await stopRecording();
    } else {
        await startRecording();
    }
}

let saveSessionData = async () => {
    let participants_list = participants;
    let messages_list = messages;
    
    try {
        const response = await fetch('/record-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channel_name: inviteId,
                video_link: localVideoFilePath,
                participants: JSON.stringify(participants_list),
                messages: JSON.stringify(messages_list)
            })
        });
        const result = await response.json();
        console.log('Session recorded successfully:', result.message);
    } catch (error) {
        console.error('Error saving session data:', error);
    }
};


let leaveStream = async (e) => {
    e.preventDefault()

    document.getElementById('join-btn').style.display = 'block'
    document.getElementsByClassName('stream__actions')[0].style.display = 'none'

    for(let i = 0; localTracks.length > i; i++){
        localTracks[i].stop()
        localTracks[i].close()
    }

    await client.unpublish([localTracks[0], localTracks[1]])

    if(localScreenTracks){
        await client.unpublish([localScreenTracks])
    }

    document.getElementById(`user-container-${uid}`).remove()

    if(userIdInDisplayFrame === `user-container-${uid}`){
        displayFrame.style.display = null

        for(let i = 0; videoFrames.length > i; i++){
            videoFrames[i].style.height = '300px'
            videoFrames[i].style.width = '300px'
        }
    }

    channel.sendMessage({text:JSON.stringify({'type':'user_left', 'uid':uid})})
}

document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('screen-btn').addEventListener('click', toggleScreen)
document.getElementById('join-btn').addEventListener('click', joinStream)
document.getElementById('leave-btn').addEventListener('click', leaveStream)

document.addEventListener("DOMContentLoaded", function() {
    var dropdown = document.getElementById("myDropdown");
    var button = document.getElementById("dropbtn");

    button.addEventListener("click", function() {
        dropdown.classList.toggle("show");
        button.classList.toggle("active");
    });

    window.addEventListener("click", function(event) {
        if (!event.target.closest('.dropbtn') && !event.target.closest('.dropdown-content')) {
            dropdown.classList.remove("show");
            button.classList.remove("active");
        }
    });
});

document.getElementById('record-btn').addEventListener('click', toggleRecording);

joinRoomInit()