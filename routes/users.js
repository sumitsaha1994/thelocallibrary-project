var express = require("express");
var router = express.Router();

/* GET users listing. */
router
    .get("/", function (req, res, next) {
        res.send("respond with a resource");
    })
    .get("/cool", (req, res) => {
        res.send("you are so cool!");
    });

module.exports = router;
