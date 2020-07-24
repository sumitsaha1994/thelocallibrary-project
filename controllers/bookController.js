const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const async = require("async");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");

exports.index = async (req, res) => {
    console.log(new Date().toTimeString());
    // const bookCount = await Book.countDocuments({});
    // const bookInstanceCount = await BookInstance.countDocuments({});
    // const bookInstanceAvailableCount = await BookInstance.countDocuments({
    //     status: "Available",
    // });
    // const authorCount = await Author.countDocuments({});
    // const genreCount = await Genre.countDocuments({});
    await Promise.all([
        Book.countDocuments({}),
        BookInstance.countDocuments({}),
        BookInstance.countDocuments({
            status: "Available",
        }),
        Author.countDocuments({}),
        Genre.countDocuments({}),
    ]).then((values) => {
        console.log(new Date().toTimeString());
        const dataKeys = [
            "bookCount",
            "bookInstanceCount",
            "bookInstanceAvailableCount",
            "authorCount",
            "genreCount",
        ];
        const data = {};
        for (let i = 0; i < dataKeys.length; i++) {
            data[dataKeys[i]] = values[i];
        }
        res.render("index", {
            layout: "default",
            title: "Home",
            data,
        });
    });
};

// Display list of all books.
exports.book_list = (req, res, next) => {
    Book.find({}, "title author")
        .populate("author")
        .then((books) => {
            books.sort((a, b) =>
                a.title.toUpperCase() > b.title.toUpperCase()
                    ? 1
                    : a.title.toUpperCase() < b.title.toUpperCase()
                    ? -1
                    : 0
            );
            books = books.map((book) => {
                return {
                    title: book.title,
                    url: book.url,
                    author: {
                        name: book.author.name,
                    },
                };
            });
            console.log(books);
            res.render("bookList", {
                layout: "default",
                title: "Book list",
                books: books,
            });
        })
        .catch((err) => {
            return next(err);
        });
};

// Display detail page for a specific book.
exports.book_detail = (req, res, next) => {
    async.parallel(
        {
            book: function (cb) {
                Book.findById(req.params.id)
                    .populate("author")
                    .populate("genre")
                    .exec(cb);
            },
            bookInstances: function (cb) {
                BookInstance.find({ book: req.params.id }).exec(cb);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            if (results.book == null) {
                // No results.
                err = new Error("Book not found");
                err.status = 404;
                return next(err);
            }
            console.log(results.book);

            results.bookInstances = results.bookInstances.map(
                (boookInstance) => ({
                    _id: boookInstance._id,
                    status: boookInstance.status,
                    imprint: boookInstance.imprint,
                    due_back: boookInstance.due_back,
                    url: boookInstance.url,
                })
            );
            // Successful, so render.
            res.render("bookDetail", {
                layout: "default",
                title: results.book.title,
                book: {
                    url: results.book.url,
                    title: results.book.title,
                    author: {
                        url: results.book.author.url,
                        name: results.book.author.name,
                    },
                    summary: results.book.summary,
                    isbn: results.book.isbn,
                    genre: results.book.genre.map((g) => ({
                        url: g.url,
                        name: g.name,
                    })),
                },
                bookInstances: results.bookInstances,
            });
        }
    );
};

// Display book create form on GET.
exports.book_create_get = function (req, res, next) {
    // Get all authors and genres, which we can use for adding to our book.
    async.parallel(
        {
            authors: function (callback) {
                Author.find(callback);
            },
            genres: function (callback) {
                Genre.find(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            res.render("bookForm", {
                layout: "default",
                title: "Create Book",
                authors: results.authors.map((author) => ({
                    _id: author._id,
                    name: author.name,
                })),
                genres: results.genres.map((genre) => ({
                    _id: genre._id,
                    name: genre.name,
                    checked: "false",
                })),
            });
        }
    );
};

// Handle book create on POST.
exports.book_create_post = [
    // Convert the genre to an array.
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === "undefined") req.body.genre = [];
            else req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate fields.
    body("title", "Title must not be empty.").trim().isLength({ min: 1 }),
    body("author", "Author must not be empty.").trim().isLength({ min: 1 }),
    body("summary", "Summary must not be empty.").trim().isLength({ min: 1 }),
    body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }),

    // Sanitize fields (using wildcard).
    //sanitizeBody("*").escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);
        // Create a Book object with escaped and trimmed data.
        var book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre,
        });
        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel(
                {
                    authors: function (callback) {
                        Author.find(callback);
                    },
                    genres: function (callback) {
                        Genre.find(callback);
                    },
                },
                function (err, results) {
                    if (err) {
                        return next(err);
                    }

                    // Mark our selected genres as checked.
                    for (let i = 0; i < results.genres.length; i++) {
                        if (book.genre.indexOf(results.genres[i]._id) > -1) {
                            results.genres[i].checked = "true";
                        }
                    }
                    res.render("bookForm", {
                        layout: "default",
                        title: "Create Book",
                        authors: results.authors.map((author) => ({
                            _id: author._id.toString(),
                            name: author.name,
                        })),
                        genres: results.genres.map((genre) => ({
                            _id: genre._id,
                            name: genre.name,
                            checked: genre.checked,
                        })),
                        book: {
                            title: book.title,
                            author: book.author.toString(),
                            summary: book.summary,
                            isbn: book.isbn,
                            genre: book.genre,
                        },
                        errors: errors.array(),
                    });
                }
            );
            return;
        } else {
            // Data from form is valid. Save book.
            book.save(function (err) {
                if (err) {
                    return next(err);
                }
                //successful - redirect to new book record.
                res.redirect(book.url);
            });
        }
    },
];

// Display book delete form on GET.
exports.book_delete_get = (req, res, next) => {
    async.parallel(
        {
            book: function (callback) {
                Book.findById(req.params.id)
                    .populate("author")
                    .populate("genre")
                    .exec(callback);
            },
            book_bookinstances: function (callback) {
                BookInstance.find({ book: req.params.id }).exec(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            if (results.book == null) {
                // No results.
                res.redirect("/catalog/books");
            }
            // Successful, so render.
            res.render("bookDelete", {
                layout: "default",
                title: "Delete Book",
                book: {
                    _id: results.book.id,
                    url: results.book.url,
                    title: results.book.title,
                    author: {
                        url: results.book.author.url,
                        name: results.book.author.name,
                    },
                    summary: results.book.summary,
                    isbn: results.book.isbn,
                    genre: results.book.genre.map((g) => ({
                        url: g.url,
                        name: g.name,
                    })),
                },
                book_instances: results.book_bookinstances.map(
                    (boookInstance) => ({
                        _id: boookInstance._id,
                        status: boookInstance.status,
                        imprint: boookInstance.imprint,
                        due_back: boookInstance.due_back,
                        url: boookInstance.url,
                    })
                ),
            });
        }
    );
};

// Handle book delete on POST.
exports.book_delete_post = (req, res, next) => {
    async.parallel(
        {
            book: function (callback) {
                Book.findById(req.body.id)
                    .populate("author")
                    .populate("genre")
                    .exec(callback);
            },
            book_bookinstances: function (callback) {
                BookInstance.find({ book: req.body.id }).exec(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            // Success
            if (results.book_bookinstances.length > 0) {
                // Book has book_instances. Render in same way as for GET route.
                res.render("bookDelete", {
                    layout: "default",
                    title: "Delete Book",
                    book: {
                        _id: results.book._id,
                        url: results.book.url,
                        title: results.book.title,
                        author: {
                            url: results.book.author.url,
                            name: results.book.author.name,
                        },
                        summary: results.book.summary,
                        isbn: results.book.isbn,
                        genre: results.book.genre.map((g) => ({
                            url: g.url,
                            name: g.name,
                        })),
                    },
                    book_instances: results.book_bookinstances.map(
                        (boookInstance) => ({
                            _id: boookInstance._id,
                            status: boookInstance.status,
                            imprint: boookInstance.imprint,
                            due_back: boookInstance.due_back,
                            url: boookInstance.url,
                        })
                    ),
                });
                return;
            } else {
                // Book has no BookInstance objects. Delete object and redirect to the list of books.
                Book.findByIdAndRemove(req.body.id, function deleteBook(err) {
                    if (err) {
                        return next(err);
                    }
                    // Success - got to books list.
                    res.redirect("/catalog/books");
                });
            }
        }
    );
};

// Display book update form on GET.
exports.book_update_get = (req, res, next) => {
    // Get book, authors and genres for form.
    async.parallel(
        {
            book: function (callback) {
                Book.findById(req.params.id)
                    .populate("author")
                    .populate("genre")
                    .exec(callback);
            },
            authors: function (callback) {
                Author.find(callback);
            },
            genres: function (callback) {
                Genre.find(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            if (results.book == null) {
                // No results.
                err = new Error("Book not found");
                err.status = 404;
                return next(err);
            }
            // Success.
            // Mark our selected genres as checked.
            for (
                var all_g_iter = 0;
                all_g_iter < results.genres.length;
                all_g_iter++
            ) {
                for (
                    var book_g_iter = 0;
                    book_g_iter < results.book.genre.length;
                    book_g_iter++
                ) {
                    if (
                        results.genres[all_g_iter]._id.toString() ==
                        results.book.genre[book_g_iter]._id.toString()
                    ) {
                        results.genres[all_g_iter].checked = "true";
                    }
                }
            }
            res.render("bookForm", {
                layout: "default",
                title: "Update Book",
                authors: results.authors.map((author) => ({
                    _id: author._id.toString(),
                    name: author.name,
                })),
                genres: results.genres.map((genre) => ({
                    _id: genre._id,
                    name: genre.name,
                    checked: genre.checked,
                })),
                book: {
                    title: results.book.title,
                    author: {
                        _id: results.book.author._id.toString(),
                    },
                    summary: results.book.summary,
                    isbn: results.book.isbn,
                },
            });
        }
    );
};

// Handle book update on POST.

exports.book_update_post = [
    // Convert the genre to an array
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === "undefined") req.body.genre = [];
            else req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate fields.
    body("title", "Title must not be empty.").trim().isLength({ min: 1 }),
    body("author", "Author must not be empty.").trim().isLength({ min: 1 }),
    body("summary", "Summary must not be empty.").trim().isLength({ min: 1 }),
    body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }),

    // Sanitize fields.
    sanitizeBody("title").escape(),
    sanitizeBody("author").escape(),
    sanitizeBody("summary").escape(),
    sanitizeBody("isbn").escape(),
    sanitizeBody("genre.*").escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data and old id.
        var book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
            _id: req.params.id, //This is required, or a new ID will be assigned!
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel(
                {
                    authors: function (callback) {
                        Author.find(callback);
                    },
                    genres: function (callback) {
                        Genre.find(callback);
                    },
                },
                function (err, results) {
                    if (err) {
                        return next(err);
                    }

                    // Mark our selected genres as checked.
                    for (let i = 0; i < results.genres.length; i++) {
                        if (book.genre.indexOf(results.genres[i]._id) > -1) {
                            results.genres[i].checked = "true";
                        }
                    }
                    res.render("bookForm", {
                        title: "Update Book",
                        authors: results.authors.map((author) => ({
                            _id: author._id.toString(),
                            name: author.name,
                        })),
                        genres: results.genres.map((genre) => ({
                            _id: genre._id,
                            name: genre.name,
                            checked: genre.checked,
                        })),
                        book: {
                            title: book.title,
                            author: book.author.toString(),
                            summary: book.summary,
                            isbn: book.isbn,
                            genre: book.genre,
                        },
                        errors: errors.array(),
                    });
                }
            );
            return;
        } else {
            // Data from form is valid. Update the record.
            Book.findByIdAndUpdate(req.params.id, book, {}, function (
                err,
                thebook
            ) {
                if (err) {
                    return next(err);
                }
                // Successful - redirect to book detail page.
                res.redirect(thebook.url);
            });
        }
    },
];
