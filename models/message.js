'use strict';
// une fonction qui permet de definir le model message
module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    text: DataTypes.STRING,
    author: {
      type: DataTypes.INTEGER
    },
    discussion: {
      type: DataTypes.INTEGER
    },
    // virtual properties
    Author: {
      type: DataTypes.VIRTUAL,

      // sequelize permet de gerer toutes les jointure dans chaque models
      // on na pas besoin de faire les jointure dans les deux sens
      // c'est pour eviter de se balader dans toute mon programme
      // Dans chaque model tu peut gerer tout
      // dans discussion tu peut aqjouter un message
      // Dans discuszsion tu peux recuperer la liste de message a discussion de la requete
      // Dans message tu peux gerer l'auteur du message
      // Dans message tu peux aussi trouver l'objet du discussion
      // Dans user je peux chercher les discussions de chaque user
      // tu peux gerer un donne externe de l'utilisateur
      async get() {
        const db = require('../models');
        // si il y a un auteur d'enrigister
        if(this.author !== undefined && this.author !== 0 && this.author !== null) {
          // tu return la seul occurence de l'auteur en fonction de sont id
          // c'est ici on dire ou je fais ma requête
          return await db.User.findOne({where: {id: this.author}});
        }
        // sinon on return directement null
        return await null;
      },
      set(author) {
        // objet c'est un type native de js
        // on teste si il est different de undefined ou null ou si le type de l'auteur es egale à un objet
        if(author !== undefined && author !== null && typeof author === 'object') {
          // on affecte author.id a la propriété author
          this.author = author.id;
        }
      }
    },
    Discussion: {
      type: DataTypes.VIRTUAL,
      get() {
        const db = require('../models');
        if(this.discussion !== undefined && this.discussion !== 0 && this.discussion !== null) {
          return db.Discussion.findOne({where: {id: this.discussion}});
        }
        return null;
      },
      set(discussion) {
        if(discussion !== undefined && discussion !== null && typeof discussion === 'object') {
          this.discussion = discussion.id;
        }
      }
    },
    // permet d'aqfficher dans le navigateur les informations
    // toujours en virtuelle
    // Json c'est un format de notation d'objet javascript
    // propriete d'objet dynamique
    // peut mettre un string en dure, un tableau
    // a partir du moment ou l'on affiche en dure c'est du jaon
    // si on let des crochet sur la clé on peut affecter un valeur specifique a cette clé
    JSON: {
      type: DataTypes.VIRTUAL,
      async get() {
        return {
          id: this.id,
          author: await (await this.Author).JSON,
          discussion: this.discussion,
          text: this.text,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        };
      }
    }
  }, {engine: 'InnoDB'});
  Message.associate = function(models) {};
  return Message;
};
