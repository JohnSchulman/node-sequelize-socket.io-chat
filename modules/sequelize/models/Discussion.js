const Sequelize = require('sequelize');
const {sequelize} = require('../../sequelize');
class Discussion extends Sequelize.Model {}

Discussion.init({
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: 'compositeIndex'
    },
    name: Sequelize.STRING,
    date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },
}, {sequelize});

module.exports = {Discussion};
