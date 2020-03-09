require('dotenv').config({path: __dirname + '/../../.env'});
const {sequelize} = require("../../sequelize");
const db = require("../../../models");

sequelize.authenticate()
    // .then(() => (async user_id => {
    //     // return await db.Discussion.findOne({where: {id: user_id}});
    //     let user = await db.User.findOne({where: {id: user_id}});
    //     let userDiscussions = [];
    //     for(let discussion of await user.MyDiscussions) userDiscussions.push(await discussion.JSON);
    //     return userDiscussions;
    // })(1))
    // .then(discussion => discussion.JSON)
    // .then(discussion => {
    //     console.log(discussion);
    // });
    // .then(discussions => console.log('Messages de la discussion `' + discussions[0].name + '`: ', discussions[0].messages));

    .then(() => (async (discussion_id, message, author_id) => {
        let discussion = await db.Discussion.findOne({where: {id: discussion_id}});
        let messages = await discussion.Messages;
        // insertion de tous les éléments du tableau 'messages' dans un nouveau tableau en y ajoutant un nouvel élément.
        // - 1 car sinon je suis en dehors du tableau  et .id car je recupère l'id et + 1 pour incrémenter et : je set le premier id
        discussion.Messages = [...messages, {id: (messages.length > 0 ? messages[messages.length - 1].id + 1 : 1), discussion: discussion_id, text: message, author: author_id}]
    })(1, 'hello', 4));


// async function test() {
//     return await toto();
// }
//
// async function test2() {
//     var test = await test();
//
// }
//
// test().then(test => {
//
// });
