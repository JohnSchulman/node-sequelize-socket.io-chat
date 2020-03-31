// evenement cote back
module.exports = class Websocket {
    get socket() {
        return this._socket;
    }
    // export une fonction et je la passe la serveur http en
    // inclue la biblioteque et instancie la socket
    set socket(http_server) {
        this._socket = require('socket.io')(http_server)
    }

    get client() {
        return this._client;
    }

    // c'est le socket client
    // la save et le met grâce à a push dans le socket
    set client(client) {
        this._client = client;
        this.client.emit('save_client', {id: client.id});
        this.socket.sockets.rooms.push(this.client);
    }

    // permet de recuperer n'importe quelle client en fonction de sont idée
    get_client(id) {
        for(let c of this.socket.sockets.rooms) {
            if(c.id === id) {
                return c;
            }
        }
    }

    // Client c'est juste le socket
    // user correspond details personnels : firstname, tel, etc..
    // rooms c'est un propriété de socket qui est un tableau vide
    set user(user) {
        for(let room_id in this.socket.sockets.rooms) {
            // on test si le client qui vient de se connecter est bien enregistrer sur le serveur
            if(this.socket.sockets.rooms[room_id].id === this.client.id) {
                // si la condition est vrai on l'enregistre le user du socket dans le client courant
                this.socket.sockets.rooms[room_id].user = user;
            }
        }
    }

    // on transform le user en json et on le met dans le tableau (grâce a map) du socket
    get users() {
        return this.socket.sockets.rooms.map(room => JSON.parse(room.user));
    }

    // ici c'est singleton qui retourne toujours le meme instance
    // on verifie mon objet sequalize qui contient toujours lo module de connexion
    // si l'objet n'existe pas j'ajoute mon objet perso de mes module
    // sinon je retourne directement mon objet qui est stocker dans mon prorpriété _sequelize

    // quand tu doit avoir un getter qui ne doit pas avoir de paramêtre
    // je preivliegie les getter en form de propriété en non en forme de fonction


    get sequelize() {
        if(this._sequelize === null || this._sequelize === undefined) {
            this._sequelize = require('../modules/sequelize').sequelize;
        }
        return this._sequelize;
    }

    get database() {
        if(this._db === null || this._db === undefined) {
            this._db = require('../models');
        }
        return this._db;
    }

    // permet de diffuser le message
    broadcast(id, channel, message) {
        // je boucle sur les clients socket connecteé
        for(let client of this.socket.sockets.rooms) {
            // si le client est different du client passé en paramètres
            if(client.id !== id) {
                // j'envoie à toutes les client sauf moi
                client.emit(channel, message);
            }
        }
    }

    // c'est un wrapper de client.emit
    // envoie le message qu'a moi
    emit(id, channel, message) {
        let client;
        if((client = this.get_client(id)) !== undefined) {
            client.emit(channel, message)
        }
    }
    un_save_client(id) {
        for(let i in this.socket.sockets.rooms) {
            if(this.socket.sockets.rooms[i].id === id) {
                delete this.socket.sockets.rooms[i];
            }
        }
        let tmp = [];
        for(let i in this.socket.sockets.rooms) {
            if(this.socket.sockets.rooms[i] !== null && this.socket.sockets.rooms[i] !== undefined) {
                tmp.push(this.socket.sockets.rooms[i]);
            }
        }
        this.socket.sockets.rooms = tmp;
    }

    say_welcome(id, discussion, user) {
        this.sequelize.authenticate().then(() => this.database.Discussion.findOne({where: {id: discussion.id}}))
            .then(d => d.JSON)
            .then(discussion => {
                this.emit(id, 'welcome', {user, discussion});
                this.broadcast(id, 'welcome_broadcast', {user, discussion});
            });
    }

    on_save_user(callback) {
        this.client.on('save_user', callback)
    }
    on_new_discussion(callback) {
        this.client.on('new_discussion', callback)
    }
    on_new_message(callback) {
        this.client.on('new_message', callback)
    }
    on_get_discussion(callback) {
        this.client.on('get_discussion', callback)
    }
    on_disconnect(callback) {
        this.client.on('disconnection', callback)
    }
    on_user_write(callback) {
        this.client.on('user_write', callback)
    }
    on_user_stop_write(callback) {
        this.client.on('user_stop_write', callback)
    }
    on_get_connected_users(callback) {
        this.client.on('get_connected_users', callback);
    }

    constructor(http_server) {
        this.socket = http_server;

        this.socket.on('connection', client => {
            this.client = client;
            this.on_save_user(({user, peer_id}) => {
                user = JSON.parse(user);
                user.peer_id = peer_id;
                this.user = JSON.stringify(user);
                this.emit(this.client.id, 'get_connected_users', {users: this.users});
                this.broadcast(this.client.id, 'get_connected_users', {users: this.users});
            });
            this.on_new_message(({id, discussion, author, message}) => {
                this.sequelize.authenticate().then(() => this.database.Message.create({text: message, author: author.id, discussion: discussion.id}))
                    .then(message => message.JSON)
                    .then(json => {
                        this.database.Discussion.findOne({where: {id: discussion.id}}).then(_discussion => {
                            this.broadcast(id, 'new_message_broadcast', {message: json, discussion: _discussion});
                            this.emit(id, 'new_message', {message: json, discussion: _discussion});
                        });
                    });
            });
            this.on_new_discussion(({id, discussion}) => {
                this.sequelize.authenticate().then(() => {
                    let database = this.database;
                    let current_ws = this;
                    database.Discussion.create({name: discussion.name})
                        .then(() => (async function getDiscussionsJSON() {
                            let discussions = await database.Discussion.findAll();
                            let tmp = [];
                            for (let discussion of discussions)
                                tmp.push(await discussion.JSON);
                            return tmp;
                        })())
                        .then(discussions => {
                            current_ws.broadcast(id, 'new_discussion_broadcast', {discussions});
                            current_ws.emit(id, 'new_discussion', {
                                created: true,
                                discussion: discussions[discussions.length - 1]
                            });
                        })
                    }
                ).catch(err =>
                    this.emit(id, 'new_discussion', {
                        created: false,
                        error: err.message
                    }))
            });
            this.on_get_discussion(({id, discussion, user}) => {
                this.sequelize.authenticate().then(() => this.database.Discussion.findOne({where: discussion}))
                    .then(discussion => discussion.JSON)
                    .then(json => {
                        this.emit(id, 'get_discussion', {
                            discussion: json,
                            error: false
                        });
                        this.say_welcome(id, discussion, user);
                    })
                    .catch(err => {
                        this.emit(id, 'get_discussion', {
                            error: true,
                            message: err.message
                        })
                    });
            });
            this.on_disconnect(response => {
                this.sequelize.authenticate().then(() => this.database.Discussion.findOne({where: {id: response.discussion.id}}))
                    .then(discussion => discussion.JSON)
                    .then(json => {
                        this.broadcast(response.id, 'disconnection_broadcast', {user: response.user, discussion: json});
                        this.emit(response.id, 'disconnection', {user: response.user, discussion: json});

                        this.emit(this.client.id, 'get_connected_users', {users: this.users});
                        this.broadcast(this.client.id, 'get_connected_users', {users: this.users});
                    });
            });
            this.on_user_write(({id, discussion, user}) => {
                this.broadcast(id, 'user_write', {user, discussion});
            });
            this.on_user_stop_write(({id, discussion, user}) => {
                this.broadcast(id, 'user_stop_write', {user, discussion});
            });
            this.client.on('disconnect', () => {
                this.broadcast(client.id, 'disconnection_broadcast', {
                    user: JSON.parse(this.get_client(client.id).user)
                });
                this.un_save_client(client.id);
                this.broadcast(client.id, 'get_connected_users', {users: this.users});
            });

            this.client.on('video_call', ({type, id, call_id, caller, called, caller_id}) => {
                switch (type) {
                    case 'call':
                        let called_client;
                        for(let room of this.socket.sockets.rooms) {
                            if (room.user && JSON.parse(room.user).id === called.id) {
                                called_client = room;
                                break;
                            }
                        }
                        if(called_client) called_client.emit('video_call', {type, caller, caller_id, call_id});
                        this.broadcast(id, 'server_log', ['video call => ', id, call_id, caller, called]);
                        console.log('video call => ', id, call_id, caller, called);
                        break;
                    case 'answer':
                        this.get_client(caller_id).emit('video_call', {type, status: true});
                        this.broadcast(id, 'server_log', ['video answer => ', caller_id, true]);
                        console.log('video answer => ', caller_id, true);
                        break;
                }
            })
        });
    }
};
