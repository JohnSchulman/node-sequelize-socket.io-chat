let express = require('express');
let router = express.Router();
const {sequelize} = require('../modules/sequelize');
const db = require('../models');

// PAGES
// route pour la page d'accuille
router.get('/', (req, res) => {
    // authenticate: methode permet de se connecter
    // pas comme une session qui stock des informations pour un certain temps
  sequelize.authenticate().then(() => {
      // render : rendre la page
      // c'est des variables utilisé dans le template
    res.render('index', { title: 'Messenger' });
  }).catch(err => {
    console.log(err);
    res.render('error', { message: 'Erreur Express', status: err.status, stack: err.stack });
  });
});

// cette route renvoi la page login
router.get('/login', (req, res) => {
  res.render('login', {title: 'Messenger'});
});

// route pour la video
router.get('/video', (req, res) => {
    res.render('video', {title: 'Messenger'});
});

// API : code miese a dispostion pour gerer des fonctions spéciqiue
// API netflicks pour gerer des videos!;
// API chat pour gerer des discusiion
//
router.post('/api/login', (req, res) => {
    // si le requette http avec le mot de passe et l'email  (via le formulaire) alors ou renvoit l'utilisateur
    // sinon on affiche une erreur
  sequelize.authenticate().then(() => (
      async (email, password) =>
          await db.User.findOne({where: {email, password}})
      // après avoir chercher la premier occurence de email et password
      // tu les affecte au paramètresz email et password si je les trouve
  )(req.body.email, req.body.password))
      // async / await est une façon synplifiée d'utiliser les promesses.
      // assync signifie qu'on renvoie une promesse donc une fonction asynchrone et await est utiliser pour exectuter une fonction asynchrone.

  // tu les parse en json en modifiant quelques paramètres (mot de passe supprimé...)
      .then(async user =>
          res.json(await user.JSON))
      // catch sur un promesse est toujours le cas d'erreur
      .catch(err => res.json({error: err.message}));
});

router.post('/api/register', (req, res) => {
  sequelize.authenticate().then(() => (async (email, password) => await db.User.findOne({where: {email, password}}))(req.body.email, req.body.password))
      .then(user => (async (first_name, last_name, email, password, avatar) => {
        if(user) {
          throw {message: 'Un compte existe déjà avec ces identifiants.'}
        } else {
          return await db.User.create({first_name, last_name, email, password, avatar})
        }
      })(
          req.body.first_name,
          req.body.last_name,
          req.body.email,
          req.body.password,
          req.body.avatar
      ))
      .then(async user => res.json(await user.JSON))
      .catch(err => res.json({error: err.message}));
});

router.get('/api/discussions', (req, res) => {
  sequelize.authenticate().then(() => (async () => {
    let discussions = await db.Discussion.findAll();
    let _discussions = [];
    for(let discussion of discussions)
      _discussions.push(await discussion.JSON);
    return _discussions;
  })()).then(json => res.json({discussions: json, success: true}))
      .catch(err => {
        console.log(err);
        res.json({success: false})
      });
});

router.get('/api/discussion/:discussion_id', (req, res) => {
  sequelize.authenticate().then(() => (async () => {
    let discussion = await db.Discussion.findOne({where: {id: parseInt(req.param('discussion_id'))}});
    return await discussion.JSON;
  })()).then(json => res.json({discussion: json}))
});

module.exports = router;
