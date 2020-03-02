// les require permet de recuperer des modules (framework, bibliotèques, fonction, package)
const Sequelize = require('sequelize');
// c'est les infos de connexion
const credentials = require('../../config/config')[process.env.NODE_ENV];

// si credentielas existe
if(credentials) {
    // on recupère la connexion de la BDD dans la constante sequelize
    const sequelize = new Sequelize(`${credentials.dialect}://${credentials.username}:${credentials.password}@${credentials.host}:${credentials.port}/${credentials.database}`);

    module.exports = {sequelize};
} else {
    throw 'Veuillez insérer des crédentials pour la connection en base de données !!';
}

/***************************************************************************/
/************************* Author: Nicolas Choquet *************************/
/********************** DB for private chat real time **********************/
/***************************************************************************/
/*        message        --        discussion        --        user        */
/***************************************************************************/
/*          id           --            id            --         id         */
/*         text          --           name           --     first_name     */
/*      discussion       --         createAt         --      last_name     */
/*       createAt        --                          --       avatar       */
/*        author         --                          --      createAt      */
/***************************************************************************/


// createAt : la date de creation de la lgne en question de la table
// author: user du message (un user n'est cependant pas forcement un author: quelqu'un qui like un messaage, commebte)
// duscussion: l'id de la discussion a laquelle appartient le message
