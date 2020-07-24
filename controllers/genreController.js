const Genre = require("../models/genre");
const Book = require("../models/book");
const async = require("async");
const validator = require("express-validator");
// const { body, validationResult } = require("express-validator/check");
// const { sanitizeBody } = require("express-validator/filter");

// Display list of all Genre.
exports.genre_list = (req, res, next) => {
    Genre.find({}).exec((err, genres) => {
        if (err) {
            return next(err);
        }
        console.log(genres);
        genres = genres.map((genre) => {
            return {
                name: genre.name,
                url: genre.url,
            };
        });
        res.render("genreList", {
            layout: "default",
            title: "Genre List",
            genres,
        });
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
    async.parallel(
        {
            genre: function (cb) {
                Genre.findById(req.params.id).exec(cb);
            },
            genreBooks: function (cb) {
                Book.find({ genre: req.params.id }).exec(cb);
            },
        },
        (err, results) => {
            if (err) {
                return next(err);
            }
            if (results.genre == null) {
                // No results.
                const err = new Error("Genre not found");
                err.status = 404;
                return next(err);
            }
            console.log(results.genre.toJSON());
            console.log(results.genreBooks);
            res.render("genreDetail", {
                layout: "default",
                title: "Genre Detail",
                genre: {
                    name: results.genre.name,
                    url: results.genre.url,
                },
                genreBooks: results.genreBooks.map((genreBook) => {
                    return {
                        title: genreBook.title,
                        summary: genreBook.summary,
                        url: genreBook.url,
                    };
                }),
            });
        }
    );
};

// Display Genre create form on GET.
exports.genre_create_get = (req, res) => {
    res.render("genreForm", { layout: "default", title: "Create Genre" });
};

// Handle Genre create on POST.
exports.genre_create_post = [
    // Validate that the name field is not empty.
    validator
        .body("name", "Genre name required and min length 2")
        .trim()
        .isLength({ min: 2 }),

    // Sanitize (escape) the name field.
    validator.sanitizeBody("name").escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validator.validationResult(req);

        // Create a genre object with escaped and trimmed data.
        var genre = new Genre({ name: req.body.name });

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render("genreForm", {
                layout: "default",
                title: "Create Genre",
                genre: genre.toJSON(),
                errors: errors.array(),
            });
            return;
        } else {
            // Data from form is valid.
            // Check if Genre with same name already exists.
            Genre.findOne({ name: req.body.name }).exec(function (
                err,
                found_genre
            ) {
                if (err) {
                    return next(err);
                }

                if (found_genre) {
                    // Genre exists, redirect to its detail page.
                    res.redirect(found_genre.url);
                } else {
                    genre.save(function (err) {
                        if (err) {
                            return next(err);
                        }
                        // Genre saved. Redirect to genre detail page.
                        res.redirect(genre.url);
                    });
                }
            });
        }
    },
];

// Display Genre delete form on GET.
exports.genre_delete_get = (req, res, next) => {
    async.parallel(
        {
            genre: function (callback) {
                Genre.findById(req.params.id).exec(callback);
            },
            genre_books: function (callback) {
                Book.find({ genre: req.params.id }).exec(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            if (results.genre == null) {
                // No results.
                res.redirect("/catalog/genres");
            }
            // Successful, so render.
            res.render("genreDelete", {
                layout: "default",
                title: "Delete Genre",
                genre: {
                    _id: results.genre._id,
                    name: results.genre.name,
                    url: results.genre.url,
                },
                genre_books: results.genre_books.map((genreBook) => {
                    return {
                        title: genreBook.title,
                        summary: genreBook.summary,
                        url: genreBook.url,
                    };
                }),
            });
        }
    );
};

// Handle Genre delete on POST.
exports.genre_delete_post = (req, res, next) => {
    async.parallel(
        {
            genre: function (callback) {
                Genre.findById(req.params.id).exec(callback);
            },
            genre_books: function (callback) {
                Book.find({ genre: req.params.id }).exec(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            // Success
            if (results.genre_books.length > 0) {
                // Genre has books. Render in same way as for GET route.
                res.render("genreDelete", {
                    layout: "default",
                    title: "Delete Genre",
                    genre: {
                        _id: results.genre._id,
                        name: results.genre.name,
                        url: results.genre.url,
                    },
                    genre_books: results.genre_books.map((genreBook) => {
                        return {
                            title: genreBook.title,
                            summary: genreBook.summary,
                            url: genreBook.url,
                        };
                    }),
                });
                return;
            } else {
                // Genre has no books. Delete object and redirect to the list of genres.
                Genre.findByIdAndRemove(req.body.id, function deleteGenre(err) {
                    if (err) {
                        return next(err);
                    }
                    // Success - go to genres list.
                    res.redirect("/catalog/genres");
                });
            }
        }
    );
};

// Display Genre update form on GET.
exports.genre_update_get = (req, res, next) => {
    Genre.findById(req.params.id, function (err, genre) {
        if (err) {
            return next(err);
        }
        if (genre == null) {
            // No results.
            err = new Error("Genre not found");
            err.status = 404;
            return next(err);
        }
        // Success.
        res.render("genreForm", {
            layout: "default",
            title: "Update Genre",
            genre: {
                name: genre.name,
                url: genre.url,
            },
        });
    });
};

// Handle Genre update on POST.
exports.genre_update_post = [
    // Validate that the name field is not empty.
    validator.body("name", "Genre name required").isLength({ min: 1 }).trim(),

    // Sanitize (escape) the name field.
    validator.sanitizeBody("name").escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request .
        const errors = validator.validationResult(req);

        // Create a genre object with escaped and trimmed data (and the old id!)
        var genre = new Genre({
            name: req.body.name,
            _id: req.params.id,
        });

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values and error messages.
            res.render("genreForm", {
                title: "Update Genre",
                genre: {
                    name: genre.name,
                    url: genre.url,
                },
                errors: errors.array(),
            });
            return;
        } else {
            // Data from form is valid. Update the record.
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function (
                err,
                thegenre
            ) {
                if (err) {
                    return next(err);
                }
                // Successful - redirect to genre detail page.
                res.redirect(thegenre.url);
            });
        }
    },
];
