'use strict';
// une fonction qui permet de definir le model discussion
module.exports = (sequelize, DataTypes) => {
  const Discussion = sequelize.define('Discussion', {
    name: DataTypes.STRING,
    // virtual properties
    Messages: {
      type: DataTypes.VIRTUAL,

      async get() {
        // requette ou on recupère toutes les messages de la bdd en fonction de l'id de la discussion
        return await (require('../models').Message.findAll({where: {discussion: this.id}}));
      },
      // on peut ajouter des message dans la discussion
      set(messages) {
        // toutes le return ce met automatiquement dans la liste _messages
        this.Messages.then(_messages => {
          // je creer une variable temporaire
          let messageToAdd = null;
          if(_messages.length > 0)
            // on boucle dans l'objet courant
            // forof recupère lo'bjet courant
            // forin recupère l'index
            for(let _message of _messages)
              for(let message of messages)
                // si l'id de message du return est different de l'id message du tableau
                // on  l'ajoute
                if(message.id !== _message.id)
                  messageToAdd = message;
          else
            // message de l'add egale à message à setter
            messageToAdd = messages[0];
          // si message egale a null on le crée et on l'affiche dans le server
          if(messageToAdd !== null)
            require('../models').Message.create(messageToAdd).then(createdMessage =>
                console.log(`Le message avec l'id ${createdMessage.id} à été créé !`));
        });
      }
    },
    JSON: {
      type: DataTypes.VIRTUAL,
      async get() {
        let messages = await this.Messages;
        let messages_JSON = [];
        for(let m of messages) messages_JSON.push(await m.JSON);
        return {
          id: this.id,
          name: this.name,
          messages: messages_JSON,
          createAt: this.createdAt,
          updatedAt: this.updatedAt
        };
      }
    }
  }, {engine: 'InnoDB'});
  Discussion.associate = function(models) {};
  return Discussion;
};
