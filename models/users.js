const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    id: String,
    nickname: String,
    gender: String,
    location: String,
    birthday: String,
    description: String,
    verified_reason: String,
    talent: String,
    education: String,
    work: String,
    weibo_num: Number,
    following: Number,
    followers: Number
}, { collection: "user" });

module.exports = mongoose.model("Users", UserSchema);