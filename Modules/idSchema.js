const mongoose = require('mongoose');

const IDMap = mongoose.Schema({
    chatID: String,
    collegeID: String,
});

module.exports = mongoose.model('IDMap', IDMap);