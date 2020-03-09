// client socket == FRONT
class Socket {
    constructor(url, user_name) {
        this.socket = io(url);
        this.user_name = user_name;
    }
// j'ajoute l'attribut avec une valeur
    set id(id) {
        document.querySelector('body').setAttribute('data-saved_socket_client_id', id);
    }
    // recupère l'attribut
    get id() {
        return document.querySelector('body').getAttribute('data-saved_socket_client_id');
    }

    // pseudo singleton externe qui permet de d'instancier authors s'il n'existe pas deja
    // pour instancier qu'une seul fois
    static init_authors() {
        if(Socket.authors === undefined || Socket.authors === null) {
            Socket.authors = new Authors();
        }
    }
    static add_author(author) {
        // assure qu'il existe
        Socket.init_authors();
        // on verifie qu'author existe et on le récupère
        // si indexof !== -1 c'est qu'il existe
        if(Socket.authors.get('authors').indexOf(author) === -1) {
            // on creer une deuxième et ca rajoute des elements en plus (ici just author)
            Socket.authors.set('authors', [...Socket.authors.get('authors'), author]);
        }
    }
    static delete_author(author) {
        // assure qu'il existe
        Socket.init_authors();
        let tmp = [];
        for(let _author of Socket.authors.get('authors')) {
            // si l'author en paramètre egale a l'auteur de la classe 'Authors' alors on ne le met pas dans le tableau
            if(_author !== author) {
                tmp.push(author);
            }
        }
        // set egale le setter du observable
        // [..tmp] une manière de creer une deuxième tableau
        // [...tmp] egale a value de la clazse obseervable
        Socket.authors.set('authors', [...tmp]);
    }
// pour defnir l'utilisateur courant est en train d'écrire
    is_writing() {
        this.emit('is_writing', {
            id: this.id,
            author: this.user_name
        });
    }
    // pour dire au serveur que tu n'est plus en train d'écrire
    // annule is_writing()
    is_not_writing() {
        this.emit('is_not_writing', {
            id: this.id,
            author: this.user_name
        });
    }
// envoiyer le message
    emit(channel, message) {
        this.socket.emit(channel, message);
    }

    // recevoire un id de socket et de l'enregistrer
    save_client() {
        // save_client = coté serveur
        this.socket.on('save_client', ({id}) => {
            // ici ou on l'enregistre
            this.id = id;
        })
    }
    // pour renvoit l'utilisateur courant coté serveur
    save_user(peer_id) {
        let user = localStorage.getItem('user');
        this.emit('save_user', {user, peer_id: peer_id});
    }
// évènements côté client gérer coté serveur
    // les les évènements que le serveur m'envoie
    on_welcome(callback) {
        this.socket.on('welcome', callback);
    }
    on_welcome_broadcast(callback) {
        this.socket.on('welcome_broadcast', callback);
    }
    on_new_discussion(callback) {
        this.socket.on('new_discussion', callback)
    }
    on_new_discussion_broadcast(callback) {
        this.socket.on('new_discussion_broadcast', callback)
    }
    on_new_message(callback) {
        this.socket.on('new_message', callback)
    }
    on_new_message_broadcast(callback) {
        this.socket.on('new_message_broadcast', callback)
    }
    on_get_discussion(callback) {
        this.socket.on('get_discussion', callback)
    }
    on_disconnect(callback) {
        this.socket.on('disconnection', callback)
    }
    on_disconnect_broadcast(callback) {
        this.socket.on('disconnection_broadcast', callback)
    }
    on_user_write(callback) {
        this.socket.on('user_write', callback)
    }
    on_user_stop_write(callback) {
        this.socket.on('user_stop_write', callback)
    }
    on_get_connected_users(callback) {
        this.socket.on('get_connected_users', callback);
    }

    on_video_call(callback) {
        this.socket.on('video_call', callback);
    }
}
