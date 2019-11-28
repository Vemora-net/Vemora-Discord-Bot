const {
    Client
} = require('discord.js');
var MongoClient = require('mongodb').MongoClient;
const client = new Client();
const http = require("http");

var server = http.createServer().listen(2321);
const io = require("socket.io")(server);

const {guildid, user_role, token, server_banner_role_2, server_banner_role_1, welcome_id, bye_id, mongourl, joins_speak, online_speak, member_speak, messages_speak} = require("./config");
var guild, welcome_channel, bye_channel, db_discord, dbo;
var joins = 0;
var messages = 0;

//Ready
client.on("ready", () =>{
    console.log(`Logged in as ${client.user.tag}!`);
    connectDB();
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
                name: "Anime",
                type: "WATCHING"
            }});
        client.setInterval(() =>{
            setStandardRoles();
        }, 60000);
        guild.channels.find(val => val.id === member_speak).setName("Member: " + guild.memberCount + "");
        var t = client.setInterval(() =>{
            if(dbo){
                db_discord.collection("stats").findOne({guildid: guildid}, (err, res) =>{
                    if(!err) {
                        joins = res.totalJoins;
                        messages = res.messages;
                        guild.channels.find(val => val.id === joins_speak).setName("Joins: " + joins + "");
                        guild.channels.find(val => val.id === messages_speak).setName("Messages: " + messages + "");
                    }

                });
                client.clearInterval(t);
            }
        }, 5000);
        guild.channels.find(val => val.id === online_speak).setName("Online: " + findOnlineMembers().length + "");

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

client.on("presenceUpdate", (o, n) =>{
    guild.channels.find(val => val.id === online_speak).setName("Online: " + findOnlineMembers().length + "");
});

client.on("message", (msg) =>{
    if (msg.type === "PINS_ADD") {
        msg.delete();
    }
    messages++;
    db_discord.collection("stats").updateOne({guildid: guildid}, {$inc: {messages : +1}}, {upsert: true}, (err, res) =>{});
    guild.channels.find(val => val.id === messages_speak).setName("Messages: " + messages + "");
});

client.on("guildMemberAdd", (member) =>{
    //welcome_channel.send("Welcome " + member.user + "!");
    setRoles(member);
    joins++;
    guild.channels.find(val => val.id === member_speak).setName("Member: " + guild.memberCount + "");
    guild.channels.find(val => val.id === joins_speak).setName("Joins: " + joins + "");

    db_discord.collection("stats").updateOne({guildid: guildid}, {$inc: {totalJoins : +1}}, {upsert: true});
    db_discord.collection("member").insertOne({username: member.user.tag, userid: member.user.id, joined_at: Date.now()}, (err, res) =>{
        if(err) throw err;
    });
});
client.on("guildMemberRemove", (member) =>{
    //bye_channel.send("Say goodbye to " + member.user.tag + "!");
    guild.channels.find(val => val.id === member_speak).setName("Member: " + guild.memberCount + "");
    db_discord.collection("member").deleteOne({ userid: member.user.id}, (err, res) =>{
        if(err) throw err;
    });
});

function findOnlineMembers(){
    var members = [];
    guild.members.forEach((member) =>{
        if(member.presence.status === "online"){
            members.push(member);
        }
    });
    return members;
}
function setStandardRoles(){
    guild.members.forEach((member) =>{
        if(!hasRole(user_role, member)) member.addRole(user_role);
        if(!hasRole(server_banner_role_1, member)) member.addRole(server_banner_role_1);
        if(!hasRole(server_banner_role_2, member)) member.addRole(server_banner_role_2);
    });
}
function setRoles(member){
    if(!hasRole(user_role, member)) member.addRole(user_role);
    if(!hasRole(server_banner_role_1, member)) member.addRole(server_banner_role_1);
    if(!hasRole(server_banner_role_2, member)) member.addRole(server_banner_role_2);


}
function hasRole(role, member){
    return member.roles.find(val => val.id === role) !== null;
}
function connectDB() {
    MongoClient.connect(mongourl, (err, db) => {
        dbo = db;
        db_discord = dbo.db("discord");
        console.log("Logged in to MongoDB!");
    });
}

client.login(token);




