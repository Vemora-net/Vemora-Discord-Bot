const {
    Client
} = require('discord.js');
var MongoClient = require('mongodb').MongoClient;
const client = new Client();
const fs = require("fs");

const io = require("socket.io");
const {guildid, user_role, token, server_banner_role_2, server_banner_role_1, welcome_id, bye_id} = require("./config");
var guild, welcome_channel;

//Ready

client.on("ready", () =>{
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setStatus("idle");
    client.user.setPresence({game: {
            name: "Starting...",
            type: "PLAYING"
        }});
    guild = client.guilds.find(val => val.id === guildid);
    welcome_channel = guild.channels.find(val => val.id === welcome_id);
    client.setTimeout(() =>{
        setStandardRoles();
        client.user.setStatus("online");
        client.user.setPresence({game: {
                name: "dich an",
                type: "WATCHING"
            }});
        client.setInterval(() =>{
            setStandardRoles();
        }, 60000);
    }, 3000);
});

client.on("guildMemberAdd", (member) =>{
    welcome_channel.send("Welcome " + member.user + "!")
});

function setStandardRoles(){
    guild.members.forEach((member) =>{
        if(!hasRole(user_role, member)) member.addRole(user_role);
        if(!hasRole(server_banner_role_1, member)) member.addRole(server_banner_role_1);
        if(!hasRole(server_banner_role_2, member)) member.addRole(server_banner_role_2);
    });
}
function hasRole(role, member){
    return member.roles.find(val => val.id === role) !== null;
}

client.login(token);




