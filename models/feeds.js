const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FeedSchema = new Schema({
    id: String,
    article_url: String,
    comment_num: Number,
    content: String,
    original: Boolean,
    original_pictures: String,
    publish_place: String,
    publish_time: String,
    publish_tool: String,
    retweet_num: Number,
    retweet_pictures: String,
    up_num: Number,
    user_id: String,
    video_url: String
}, { collection: "weibo" });

module.exports = mongoose.model("Feeds", FeedSchema);