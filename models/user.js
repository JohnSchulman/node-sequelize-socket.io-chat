'use strict';
// une fonction qui permet de definir le model user
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    avatar: DataTypes.STRING,
    // virtual properties
    MyDiscussions: {
      // propriété pas stocker dans un table
      type: DataTypes.VIRTUAL,
      async get() {
        // tu te recupère toutes te models
        const db = require('../models');
        // tu recupère toute tes discussions
        let discussions = await db.Discussion.findAll();
        // tu boucle sur les discussion et puis tu les affecte au tableau
        let myDiscussions = [];
        for(let discussion of discussions) {
          let messages = await discussion.Messages;
          // tableau temporaire
          let myMessagesForThisDiscussion = [];
          // je boucle sur message et
          // s'ils m'appartient
          if(messages.length > 0) {
            for(let message of messages) {
              const author = await message.Author;
              if (author.id === this.id) myMessagesForThisDiscussion.push(message);
            }
          }
          // je les mets dans mon tableau myMessagesForThisDiscussion
          if(myMessagesForThisDiscussion.length > 0) myDiscussions.push(discussion);
        }
        return myDiscussions;
      },
      set(discussions) {
        const db = require('../models');
      }
    },
    // getter du json pour l'utilisateur
    // getter sans setter readonly
    JSON: {
      type: DataTypes.VIRTUAL,
      async get() {
        return {
          id: this.id,
          first_name: this.first_name,
          last_name: this.last_name,
          avatar: this.avatar,
          email: this.email,
          // map permet de boucler sur un tableau et renvoyer un nouveau
          // tableau avec le resultat retourné par mon callback
          // seul contraint les deux tableau doit avoir la meme taille

          // les tableau les id des discussions de l'utilisateur
          my_discussions: (await this.MyDiscussions).map(d => d.id),
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        }
      }
    }
  }, {engine: 'InnoDB'});
  User.associate = function(models) {};
  return User;
};
