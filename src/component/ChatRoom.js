import React, { useState } from "react";
import {over} from 'stompjs';
import SockJs from 'sockjs-client';

var stompClient = null;

const App = () =>{

    const[publicChats, setpublicChats] = useState([])
    const[privateChats, setPrivateChats] = useState(new Map());
    const[tab, setTab] = useState("CHATROOM")
    const[userData, setUserData] = useState({
        username: "",
        recievername: "",
        connected: "",
        message: ""
    })

    const handleUserName = (event) =>{
        const {value} = event.target;
        setUserData({...userData, "username":value});
    }

    const registerUser = ()=>{
        let Sock = new SockJs('http://localhost:9089/ws');
        stompClient=over(Sock);
        stompClient.connect({}, onConnected, onError);
    }

    const onConnected = ()=>{
        setUserData({...userData, "connected":true});
        stompClient.suscribe('/chatroom/public', onPublicMessageReceived);
        stompClient.suscribe('/user/' + userData.username + '/private', onPrivateMessageReceived);
    }

    const onError = (err)=>{
        console.log(err);
    }

    const onPublicMessageReceived = (payload)=>{
        let payloadData = JSON.parse(payload.body);
        switch(payloadData.status){
            case "JOIN":
                if(!privateChats.get(payload.senderName)){
                    privateChats.set(payload.senderName, []);
                    setPrivateChats(new Map(privateChats));
                }
                break;
            case "MESSAGE":
                publicChats.push(payloadData);
                setpublicChats([...publicChats]);
        }
    }    

    const onPrivateMessageReceived = (payload)=>{
        let payloadData = JSON.parse(payload);
        if(privateChats.get(payload.senderName)){
            privateChats.get(payload.senderName).push(payloadData);
            setPrivateChats(new Map(privateChats));
        }else{
            let list = [];
            list.push(payloadData);
            privateChats.set(payload.senderName, list);
            setPrivateChats(new Map(privateChats));
        }
    }

    return(
        <div className="container">
            {
                userData.connected?
                <div className="chat-box">
                   <div className="member-list">
                        <ul>
                            <li onClick={()=>(setTab("CHATROOM"))} className={`member ${tab === "CHATROOM" && "active"}`}>chatroom</li>
                            {[...privateChats.keys()].map((name, index)=>(
                                <li onClick={()=>(setTab(name))} className={`member ${tab === name && "active"}`} key={index}>
                                    {name}
                                </li>
                            ))}
                        </ul>
                    </div>
                    {tab === "CHATROOM" && <div className="chat-content">
                        <ul className="char-messages">
                            {publicChats.map((chat, index)=>(
                                <li className="message" key={index}>
                                    {chat.senderName !== userData.username && <div className="avatar">{chat.senderName}</div>}
                                    <div className="message-dat">{chat.message}</div>
                                    {chat.senderName === userData.username && <div className="avatar self">{chat.senderName}</div>}
                                </li>
                            ))}
                        </ul>
                        <div className="send-message">
                            <input type="text" className="input-message" placeholder="enter public message" value={userData.message}
                                onChange={handdleMessage}/>
                            <button type="button" className="send-button" onClick={sendPublicMessage}>send</button>
                        </div>
                    </div>}
                    {tab !== "CHATROOM"}<div className="chat-content">
                        {[...privateChats.get(tab)].map((chat, index)=>
                            <li className="message" key={index}>
                                {chat.senderName !== userData.username && <div className="avatar">{chat.senderName}</div>}
                                <div className="message-dat">{chat.message}</div>
                                {chat.senderName === userData.username && <div className="avatar self">{chat.senderName}</div>}
                            </li>
                        )}
                    </div>
                </div>
                :
                <div className="register">
                    <input 
                        id='user-name'
                        placeholder='Enter the user name'
                        value={userData.username}
                        onChange={handleUserName}
                    />
                    <button type="button" onClick={registerUser}>
                        connected
                    </button>
                </div>
            }

        </div>
    )    
}

export default App