const Author = require("../models/author");
const Book = require("../models/book");
const async = require("async");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");
const moment = require("moment");

// Display list of all Authors.
exports.author_list = (req, res, next) => {
    Author.find({})
        .then((authors) => {
            authors = authors.map((author) => {
                return {
                    name: author.name,
                    url: author.url,
                    date_of_birth: author.date_of_birth,
                    date_of_death: author.date_of_death,
                    lifespan: author.lifespan,
                };
            });
            res.render("authorList", {
                layout: "default",
                title: "Authors List",
                authors,
            });
        })
        .catch((err) => {
            return next(err);
        });
};

// Display detail page for a specific Author.
exports.author_detail = (req, res, next) => {
    async.parallel(
        {
            author: function (callback) {
                Author.findById(req.params.id).exec(callback);
            },
            authors_books: function (callback) {
                Book.find({ author: req.params.id }, "title summary").exec(
                    callback
                );
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            } // Error in API usage.
            if (results.author == null) {
                // No results.
                err = new Error("Author not found");
                err.status = 404;
                return next(err);
            }
            console.log(results.author);
            // Successful, so render.
            res.render("authorDetail", {
                layout: "default",
                title: "Author Detail",
                author: {
                    name: results.author.name,
                    date_of_birth: results.author.date_of_birth,
                    date_of_death: results.author.date_of_death,
                    lifespan: results.author.lifespan,
                    url: results.author.url,
                },
                author_books: results.authors_books.map((book) => {
                    return {
                        title: book.title,
                        summary: book.summary,
                        url: book.url,
                    };
                }),
            });
        }
    );
};

// Display Author create form on GET.
exports.author_create_get = (req, res) => {
    res.render("authorForm", { layout: "default", title: "Create Author" });
};

// Handle Author create on POST.
exports.author_create_post = [
    // Validate fields.
    body("first_name")
        .isLength({ min: 1 })
        .trim()
        .withMessage("First name must be specified.")
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric characters."),
    body("last_name")
        .isLength({ min: 1 })
        .trim()
        .withMessage("Last name must be specified.")
        .isAlphanumeric()
        .withMessage("Last name has non-alphanumeric characters."),
    body("date_of_birth", "Invalid date of birth")
        .optional({ checkFalsy: true })
        .isISO8601(),
    body("date_of_death", "Invalid date of death")
        .optional({ checkFalsy: true })
        .isISO8601(),

    // Sanitize fields.
    sanitizeBody("first_name").escape(),
    sanitizeBody("last_name").escape(),
    sanitizeBody("date_of_birth").toDate(),
    sanitizeBody("date_of_death").toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render("authorForm", {
                layout: "default",
                title: "Create Author",
                author: {
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    date_of_birth: moment(req.body.date_of_birth).format(
                        "YYYY-MM-DD"
                    ),
                    date_of_death: moment(req.body.date_of_death).format(
                        "YYYY-MM-DD"
                    ),
                },
                errors: errors.array(),
            });
            return;
        } else {
            // Data from form is valid.

            // Create an Author object with escaped and trimmed data.
            var author = new Author({
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death,
            });
            author.save(function (err) {
                if (err) {
                    return next(err);
                }
                // Successful - redirect to new author record.
                res.redirect(author.url);
            });
        }
    },
];

// Display Author delete form on GET.
exports.author_delete_get = (req, res, next) => {
    async.parallel(
        {
            author: function (callback) {
                Author.findById(req.params.id).exec(callback);
            },
            authors_books: function (callback) {
                Book.find({ author: req.params.id }).exec(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            if (results.author == null) {
                // No results.
                res.redirect("/catalog/authors");
            }
            // Successful, so render.
            res.render("authorDelete", {
                layout: "default",
                title: "Delete Author",
                author: {
                    _id: results.author._id,
                    name: results.author.name,
                    lifespan: results.author.lifespan,
                },
                author_books: results.authors_books.map((book) => ({
                    url: book.url,
                    title: book.title,
                    summary: book.summary,
                })),
            });
        }
    );
};

// Handle Author delete on POST.
exports.author_delete_post = (req, res, next) => {
    async.parallel(
        {
            author: function (callback) {
                Author.findById(req.body.authorid).exec(callback);
            },
            authors_books: function (callback) {
                Book.find({ author: req.body.authorid }).exec(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            // Success
            if (results.authors_books.length > 0) {
                // Author has books. Render in same way as for GET route.
                res.render("authorDelete", {
                    layout: "default",
                    title: "Delete Author",
                    author: {
                        _id: results.author._id,
                        name: results.author.name,
                        lifespan: results.author.lifespan,
                    },
                    author_books: results.authors_books.map((book) => ({
                        url: book.url,
                        title: book.title,
                        summary: book.summary,
                    })),
                });
                return;
            } else {
                // Author has no books. Delete object and redirect to the list of authors.
                Author.findByIdAndRemove(
                    req.body.authorid,
                    function deleteAuthor(err) {
                        if (err) {
                            return next(err);
                        }
                        // Success - go to author list
                        res.redirect("/catalog/authors");
                    }
                );
            }
        }
    );
};

// Display Author update form on GET.
exports.author_update_get = (req, res, next) => {
    Author.findById(req.params.id, function (err, author) {
        if (err) {
            return next(err);
        }
        if (author == null) {
            // No results.
            err = new Error("Author not found");
            err.status = 404;
            return next(err);
        }
        // Success.
        res.render("authorForm", {
            layout: "default",
            title: "Update Author",
            author: {
                first_name: author.first_name,
                last_name: author.last_name,
                date_of_birth: moment(author.date_of_birth).format(
                    "YYYY-MM-DD"
                ),
                date_of_death: moment(author.date_of_death).format(
                    "YYYY-MM-DD"
                ),
            },
        });
    });
};

// Handle Author update on POST.
exports.author_update_post = [
    // Validate fields.
    body("first_name")
        .isLength({ min: 1 })
        .trim()
        .withMessage("First name must be specified.")
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric characters."),
    body("last_name")
        .isLength({ min: 1 })
        .trim()
        .withMessage("last name must be specified.")
        .isAlphanumeric()
        .withMessage("last name has non-alphanumeric characters."),
    body("date_of_birth", "Invalid date of birth")
        .optional({ checkFalsy: true })
        .isISO8601(),
    body("date_of_death", "Invalid date of death")
        .optional({ checkFalsy: true })
        .isISO8601(),

    // Sanitize fields.
    sanitizeBody("first_name").escape(),
    sanitizeBody("last_name").escape(),
    sanitizeBody("date_of_birth").toDate(),
    sanitizeBody("date_of_death").toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create Author object with escaped and trimmed data (and the old id!)
        var author = new Author({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id,
        });

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values and error messages.
            res.render("authorForm", {
                layout: "default",
                title: "Update Author",
                author: {
                    first_name: author.first_name,
                    last_name: author.last_name,
                    date_of_birth: moment(author.date_of_birth).format(
                        "YYYY-MM-DD"
                    ),
                    date_of_death: moment(author.date_of_death).format(
                        "YYYY-MM-DD"
                    ),
                },
                errors: errors.array(),
            });
            return;
        } else {
            // Data from form is valid. Update the record.
            Author.findByIdAndUpdate(req.params.id, author, {}, function (
                err,
                theauthor
            ) {
                if (err) {
                    return next(err);
                }
                // Successful - redirect to genre detail page.
                res.redirect(theauthor.url);
            });
        }
    },
];
