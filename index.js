const {
    Client
} = require('discord.js');
var MongoClient = require('mongodb').MongoClient;
const client = new Client();
const http = require("http");
var server = http.createServer().listen(2321);
const io = require("socket.io")(server);
const {guildid, user_role, token, server_banner_role_2, server_banner_role_1, welcome_id, bye_id} = require("./config");
var guild, welcome_channel, bye_channel;

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
    bye_channel = guild.channels.find(val => val.id === bye_id);
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
    io.on('connection', (socket) => {
        socket.on('move', (user, channel) =>{

        });
        socket.on('chat', (user, message) =>{
            var auser = guild.members.find(val => val.id === user);
            if(auser){
                auser.send(message);
                socket.send(true);
            }
        });
    });

});

client.on("guildMemberAdd", (member) =>{
    welcome_channel.send("Welcome " + member.user + "!");
});
client.on("guildMemberRemove", (member) =>{
    bye_channel.send("Say goodbye to " + member.user.tag + "!");
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




