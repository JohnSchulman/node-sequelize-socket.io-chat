class Script {
    constructor(page) {
        if(page in this)
            this[page]();
    }

    Notification() {
        const ask_notification_permission_if_not = () => {
            if (window.Notification && Notification.permission !== "granted")
                return Notification.requestPermission();
            return new Promise((resolve, reject) => {});
        };

        ask_notification_permission_if_not()
            .then(status => Notification.permission = Notification.permission !== status ? status : Notification.permission)
            .catch(err => alert(err.message));

        return {
            push: (title, options) => {
                if(Notification.permission === "denied")
                    (new this.Notification()).push(title, options);
                if(Notification.permission === "granted")
                    new Notification(title, options);
            }
        };

    }

    get notification() {
        if(this._notification === null || this._notification === undefined) {
            this._notification = new this.Notification();
        }
        return this._notification;
    }

    initAccordionSizes() {
        document.querySelectorAll('.mdl-accordion__content').forEach(accordion => {
            accordion.style.marginTop = '-' + accordion.offsetHeight.toString() + 'px';
        });
    }

    index() {
        let user = localStorage.getItem('user');
        if(user !== undefined && user !== null) {
            user = JSON.parse(user);
            const my_name = user.first_name;
            var server = new Socket('ws://localhost:3001/', my_name);
            let script = this;

            let messages = document.querySelector('.messages');
            let discussions = document.querySelectorAll('.discussions');
            let message = document.querySelector('.message');
            let send_button = document.querySelector('.send');
            let disconnect_button = document.querySelector('.disconnect');
            let add_new_discussion = document.querySelector('.add-new-discussion');

            const save_current_discussion = discussion => {
                localStorage.setItem('current_discussion', discussion.id);
            };
            const get_current_discussion = () => {
                let current_discussion_id = parseInt(localStorage.getItem('current_discussion'));
                if(current_discussion_id) server.emit('get_discussion', {
                    id: server.id,
                    discussion: {
                        id: current_discussion_id
                    }, user
                });
            };
            const add_message_to_list = (msg, author, me) => {
                let message_li = document.createElement('li');
                message_li.classList.add(me ? 'right' : 'left');
                message_li.innerHTML = (me ? 'Moi' : author.first_name) + ': ' + msg;
                messages.appendChild(message_li);
            };
            const select_discussion = id => {
                for(let d of document.querySelectorAll(`.discussions .mdl-navigation__link`)) {
                    if(d.hasAttribute('data-id'))
                        if(parseInt(d.getAttribute('data-id')) === parseInt(id))
                            d.classList.add('is-active');
                        else
                            d.classList.remove('is-active');
                }
            };
            const add_discussion_to_list = discussion => {
                const get_discussion_item = () => {
                    let discussion_a = document.createElement('a');
                    discussion_a.innerHTML = discussion.name;
                    discussion_a.style.cursor = 'pointer';
                    discussion_a.setAttribute('data-id', discussion.id);
                    discussion_a.classList.add('mdl-navigation__link');
                    discussion_a.addEventListener('click', () => {
                        server.emit('get_discussion', {
                            id: server.id,
                            discussion: {
                                id: discussion.id
                            }, user
                        });
                        select_discussion(discussion.id);
                        save_current_discussion(discussion);
                    });
                    return discussion_a;
                };

                for(let d of discussions) {
                    d.appendChild(get_discussion_item());
                }
            };
            const load_discussion = discussion => {
                document.querySelector('.discussion-title').innerHTML = `Messages de '${discussion.name}'`;
                messages.innerHTML = '';
                for(let message of discussion.messages)
                    add_message_to_list(message.text, message.author, user.id === message.author.id);

                message_form.show();
                select_discussion(discussion.id);
                save_current_discussion(discussion);
            };
            const quit_discussion = () => {
                messages.innerHTML = '';
                document.querySelector('.discussion-title').innerHTML = '';
                localStorage.removeItem('current_discussion');

                message_form.hide();
            };
            const init_discussions = () => {
                fetch('/api/discussions', {
                    method: 'get',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(r => r.json())
                    .then(json => {
                        if(json.success)
                            for(let discussion of json.discussions)
                                add_discussion_to_list(discussion);

                        get_current_discussion();
                    })
            };
            const message_form = {
                show() {
                    disconnect_button.style.display = 'initial';
                    send_button.style.display = 'initial';
                    document.querySelector('.is_writing').style.display = 'initial';
                    document.querySelector('.message-info').style.display = 'initial';
                    message.style.display = 'initial';
                },
                hide() {
                    disconnect_button.style.display = 'none';
                    send_button.style.display = 'none';
                    document.querySelector('.is_writing').style.display = 'none';
                    document.querySelector('.message-info').style.display = 'none';
                    message.style.display = 'none';
                }
            };

            (function definitionDesEcouteursDEvenementsSockets() {
                    server.save_client();
                    server.save_user();
                    server.on_new_discussion(response => {
                        if(response.created)
                            add_discussion_to_list(response.discussion);
                        script.initAccordionSizes();
                    });
                    server.on_new_discussion_broadcast(response => {
                        for(let d of discussions) {
                            d.innerHTML ='';
                        }
                        for(let discussion of response.discussions)
                            add_discussion_to_list(discussion);
                        script.initAccordionSizes();
                    });
                    server.on_welcome(response => {
                        add_message_to_list(`Vous êtes bien connecté !`, {first_name: 'Serveur'}, false)
                    });
                    server.on_welcome_broadcast(response => {
                        if(response.discussion.id === parseInt(localStorage.getItem('current_discussion')))
                            add_message_to_list(`L'utilisateur ${response.user.first_name} s'est connecté !`, {first_name: 'Serveur'}, false)
                        else
                            script.notification.push('Message du Serveur', {
                                dir: 'ltr',
                                lang: 'fr-FR',
                                body: `L'utilisateur ${response.user.first_name} s'est connecté à la conversation '${response.discussion.name}' !`,
                                icon: '/images/messenger.png'
                            });
                    });
                    server.on_get_discussion(response => {
                        if(!response.error)
                            load_discussion(response.discussion);
                        script.initAccordionSizes();
                    });
                    server.on_new_message(({message}) => {
                        add_message_to_list(message.text, message.author, true);
                    });
                    server.on_new_message_broadcast(({message, discussion}) => {
                        if(message.discussion === parseInt(localStorage.getItem('current_discussion')))
                            add_message_to_list(message.text, message.author, false);
                        else
                            script.notification.push(`Message de ${message.author.first_name} ${message.author.last_name}`, {
                                dir: 'ltr',
                                lang: 'fr-FR',
                                body: `L'utilisateur ${message.author.first_name} ${message.author.last_name} à laissé un message dans la conversation '${discussion.name}' !`,
                                icon: '/images/messenger.png'
                            });
                    });
                    server.on_disconnect(quit_discussion);
                    server.on_disconnect_broadcast(({discussion, user: {first_name}}) => {
                        console.log(discussion, first_name);
                        if(discussion !== undefined) {
                            if(discussion.id === parseInt(localStorage.getItem('current_discussion')))
                                add_message_to_list(`L'utilisateur ${first_name} s'est déconnecté !`, {first_name: 'Serveur'}, false);
                            else {
                                script.notification.push('Message du Serveur', {
                                    dir: 'ltr',
                                    lang: 'fr-FR',
                                    body: `L'utilisateur ${first_name} s'est déconnecté de la conversation '${discussion.name}' !`,
                                    icon: '/images/messenger.png'
                                });
                            }
                        } else {
                            if(localStorage.getItem('current_discussion') === null)
                                script.notification.push('Message du Serveur', {
                                    dir: 'ltr',
                                    lang: 'fr-FR',
                                    body: `L'utilisateur ${first_name} s'est déconnecté !`,
                                    icon: '/images/messenger.png'
                                });
                            else
                                add_message_to_list(`L'utilisateur ${first_name} s'est déconnecté !`, {first_name: 'Serveur'}, false);
                        }
                    });
                    server.on_user_write(response => {
                        if(response.user.id !== user.id && response.discussion.id === parseInt(localStorage.getItem('current_discussion')))
                            Socket.add_author(response.user.first_name)
                    });
                    server.on_user_stop_write(response => {
                        if(response.user.id !== user.id && response.discussion.id === parseInt(localStorage.getItem('current_discussion')))
                            Socket.delete_author(response.user.first_name)
                    });
                })();

            (function definitionDesClicksSurLesBoutons() {
                send_button.addEventListener('click', () => {
                    server.emit('user_stop_write', {
                        id: server.id,
                        user: user,
                        discussion: {
                            id: parseInt(localStorage.getItem('current_discussion'))
                        }
                    });
                    server.emit('new_message', {
                        id: server.id,
                        discussion: {
                            id: parseInt(localStorage.getItem('current_discussion'))
                        },
                        author: user,
                        message: message.value
                    });
                    message.value = '';
                });
                disconnect_button.addEventListener('click', () => {
                    server.emit('disconnection', {id: server.id, user, discussion: {id: parseInt(localStorage.getItem('current_discussion'))}});
                    server.emit('user_stop_write', {id: server.id, user, discussion: {id: parseInt(localStorage.getItem('current_discussion'))}});
                });
                add_new_discussion.addEventListener('click', () => {
                    let discussion_name = prompt('Quel est le nom de votre discussion ?');
                    if(discussion_name !== '')
                        server.emit('new_discussion', {id: server.id, discussion: {name: discussion_name}});
                });

                for(let accordion_button of document.querySelectorAll('.mdl-accordion__button')) {
                        accordion_button.addEventListener('click', event => {
                            if(event.target.tagName !== "I" || (event.target.tagName === "I" && event.target.classList.contains('mdl-accordion__icon')))
                                accordion_button.parentNode.classList.toggle('mdl-accordion--opened');
                        });
                    }
            })();

            (function definitionDeLEcouteurDEvenementsPourSavoirQuandQuelquUnEstEnTrainDEcrire() {
                    message.addEventListener('keyup', () =>
                        message.value.length > 1
                            ? server.emit('user_write', {id: server.id, user, discussion: {id: parseInt(localStorage.getItem('current_discussion'))}})
                            : server.emit('user_stop_write', {id: server.id, user, discussion: {id: parseInt(localStorage.getItem('current_discussion'))}}));
                })();

            (function definitionDesActionsAuChargementDeLaPage() {
                init_discussions();
                script.initAccordionSizes();
            })();
        } else window.location.href = '/login';
    }

    login() {
        const tabs = ['inscription', 'connexion'];
        const load_tab = tab_id => {
            function unselect_complete_tab(tab) {
                document.querySelector(`.tabs .${tab}`).style.display = 'none';
                document.querySelector(`.menu .${tab}`).classList.remove('active');
            }
            function select_complete_tab(tab) {
                document.querySelector(`.tabs .${tab}`).style.display = 'block';
                document.querySelector(`.menu .${tab}`).classList.add('active');
            }

            if(tabs.indexOf(tab_id.replace('.', '')) !== -1) {
                for(let tab of tabs)
                    unselect_complete_tab(tab);
                select_complete_tab(tab_id);
            }
        };

        load_tab('connexion');

        (function definitionDesSubmitSurLesFormulaires() {
            const connexion_form = document.querySelector('.tabs .connexion form');
            connexion_form.addEventListener('submit', e => {
                e.preventDefault();
                fetch(connexion_form.getAttribute('action'), {
                    method: connexion_form.getAttribute('method'),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: connexion_form.querySelector('#email_connexion').value,
                        password: connexion_form.querySelector('#password_connexion').value
                    })
                })
                    .then(r => r.json())
                    .then(user =>
                        new Promise((resolve, reject) =>
                            user.error === undefined ? resolve(user) : reject(user.error))
                    ).then(user => {
                    localStorage.setItem('user', JSON.stringify(user));
                    window.location.href = '/';
                }).catch(err => document.querySelector('#message_connexion').innerHTML = err);
            });

            const inscription_form = document.querySelector('.tabs .inscription form');
            inscription_form.addEventListener('submit', e => {
                e.preventDefault();
                fetch(inscription_form.getAttribute('action'), {
                    method: inscription_form.getAttribute('method'),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        first_name: inscription_form.querySelector('#firstname_connexion').value,
                        last_name: inscription_form.querySelector('#lastname_connexion').value,
                        avatar: '',
                        email: inscription_form.querySelector('#email_inscription').value,
                        password: inscription_form.querySelector('#password_inscription').value
                    })
                })
                    .then(r => r.json())
                    .then(user =>
                        new Promise((resolve, reject) =>
                            user.error === undefined ? resolve(user) : reject(user.error)
                        )
                    )
                    .then(() => load_tab('connexion'))
                    .catch(err => document.querySelector('#message_inscription').innerHTML = err)
            });
        })();

        (function definitionDesClicksSurLesBoutons() {
            document.querySelector('.menu .connexion').addEventListener('click', () => load_tab('connexion'));
            document.querySelector('.menu .inscription').addEventListener('click', () => load_tab('inscription'));
        })();

        (function definitionDesActionsAuChargementDeLaPage() {
            localStorage.removeItem('user');
        })();
    }
}