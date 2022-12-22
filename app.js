const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const fs = require('fs');

const catchAsync = require("./utils/catchAsync");
const ExpressError = require("./utils/ExpressError");
const Feeds = require("./models/feeds");
const Keepers = require("./models/keepers");
const Users = require("./models/users");

// Read config file
const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
const connection_string = config.mongo_config.connection_string;


// MongoDB
mongoose.connect(connection_string, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});


// Express settings
const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// 暂时用内存map用户id和用户昵称
const users_map = new Map();

async function get_users_info() {
    const users = await Users.find({}).select(["id", "nickname"]);
    for (let user of users) {
        users_map.set(user.id, user.nickname);
    }
    // console.log(users_map);
    console.log("Users info loaded");
};

get_users_info();
// setTimeout(() => {
//     console.log(users_map);
// }, "2000");


// Home page
app.get("/", (req, res) => {
    res.render("home");
});

// 未经checker筛选的内容
app.get("/feeds", catchAsync(async (req, res) => {
    const weibos = await Feeds.find({}).sort({ "publish_time": -1 });
    for (let weibo of weibos) {
        weibo.user_nickname = users_map.get(weibo.user_id);
        // console.log(`${weibo.user_nickname}, ${weibo.user_id}`);
    }
    res.render("feeds", { weibos });
}));

// 被删改的微博
app.get("/keepers", catchAsync(async (req, res) => {
    // pagination params
    const page = parseInt(req.query.page) || 1;
    // const limit = parseInt(req.query.limit) || 20;
    const limit = 30;

    // query filter
    const filter = req.query.filter || "all";
    const queryParam = {};
    switch (filter) {
        case "all":
            break;
        case "deleted":
            queryParam["state"] = { "$regex": "DELETED" };
            break;
        case "modified":
            queryParam["state"] = "MODIFIED";
            break;
    }

    // get total number of pages
    const count = await Keepers.countDocuments(queryParam);
    const totalPages = Math.ceil(count / limit);

    // pagination via mongoose query skip()
    const skip = (page - 1) * limit;

    const weibos = await Keepers.find(queryParam)
        .sort({ "publish_time": -1 })
        .skip(skip)
        .limit(limit);

    for (let weibo of weibos) {
        weibo.user_nickname = users_map.get(weibo.user_id);
    }
    res.render("keepers", { weibos, totalPages, page, limit, count, filter });
}));

// 查看所有用户
app.get("/users/index", catchAsync(async (req, res) => {
    const users = await Users.find({});
    res.render("users/index", { users });
}));

// 查看特定用户被删改的微博
app.get("/users/show/:user_id", catchAsync(async (req, res) => {
    const user = await Users.findOne({ "id": req.params.user_id });
    const weibos = await Keepers.find({ "user_id": req.params.user_id }).sort({ "publish_time": -1 });
    res.render("users/show", { user, weibos });
}));

// 404
app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
});

// Error handler
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Unidentified Error";
    res.status(statusCode).render("error", { err });
});


app.listen(3000, () => {
    console.log('Serving on port 3000');
});