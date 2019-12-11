const {
    Client
} = require('discord.js');
var MongoClient = require('mongodb').MongoClient;
const client = new Client();
const http = require("http");

var server = http.createServer().listen(2321);
const io = require("socket.io")(server);

const {guildid, verified, user_role, token, server_banner_role_2, server_banner_role_1, welcome_id, bye_id, mongourl, joins_speak, online_speak, member_speak, messages_speak, game_category} = require("./config");
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
        console.log("[Socket] Connected with Server");
        socket.on('move', (user, channel) => {
            var ch = guild.channels.find(val => val.id === channel);
            var us = guild.members.find(val => val.id === user);
            if(us){
                if(ch){
                    if(us.voiceChannel){
                        if(us.voiceChannel.id !== ch.id){
                            if(ch.permissionsFor(us).has("CONNECT")) {
                                us.setVoiceChannel(ch).then(() => {
                                    socket.send("[Moved] " + ch.name);
                                });
                            }else{
                                socket.send("[No perms]");
                            }
                        }else{
                            socket.send("[Already]");
                        }
                    }else{
                        socket.send("[No connection]");
                    }
                }else{
                    socket.send("[Not found]");
                }
            }else{
                socket.send("[Player not found]");
            }
        });

        socket.on('create', (name, user) => {
           var gu =  guild.members.find(val => val.id === user);
            guild.createChannel(name, {type: "voice", parent: game_category}).then(cha => { socket.send("[ID] " + cha.id); cha.replacePermissionOverwrites({overwrites: [{id: gu.id, allow: ['CONNECT'],},{id: '648984625917460491', type: 'member', denied: ['CONNECT']},], reason: 'User permission'})});
        });

        socket.on('chat', (user, message) =>{
            var auser = guild.members.find(val => val.id === user);
            if(auser){
                auser.send(message);
                socket.send(true);
            }
        });
        socket.on('link', (user, name) =>{
            var auser = guild.members.find(val => val.id === user);
            if(auser){
                auser.addRole(verified);
                auser.send("Du hast dich erfolgreich mit "  + name + " verbunden!")
            }
        });

        socket.on('unlink', (user) =>{
            var auser = guild.members.find(val => val.id === user);
            if(auser){
                auser.removeRole(verified);
                auser.send("Du hast deinen Minecraft-Account getrennt!");
            }
        });
    });

});

client.on("presenceUpdate", (o, n) =>{
    guild.channels.find(val => val.id === online_speak).setName("Online: " + findOnlineMembers().length + "");
});
client.on("channelUpdate", (oc, nc) =>{
   // console.log(nc.permissionOverwrites);
});

client.on("message", (msg) =>{
    if (msg.type === "PINS_ADD") {
        msg.delete();
    }
    messages++;
    db_discord.collection("stats").updateOne({guildid: guildid}, {$inc: {messages : +1}}, {upsert: true}, (err, res) =>{});
    if(msg.cleanContent.startsWith("!")){
        var args = msg.cleanContent.slice(1).split(" ");
        msg.delete(1);
        if(args[0] === "connect"){
            var rand = randomString(6);
            msg.author.send("Use /connect " + rand);
            db_discord.collection("connect").insertOne({userid: rand, discord: msg.author.id}, (err, res)=>{});

        }

    }else{guild.channels.find(val => val.id === messages_speak).setName("Messages: " + messages + "");}
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

        if(err) throw err;
        dbo = db;
        db_discord = dbo.db("discord");
        console.log("Logged in to MongoDB!");
    });
}
function randomString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
client.login(token);




