const BookInstance = require("../models/bookinstance");
const moment = require("moment");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");
const async = require("async");
// Display list of all BookInstances.
exports.bookinstance_list = (req, res, next) => {
    BookInstance.find()
        .populate("book")
        .exec(function (err, bookInstanceList) {
            if (err) {
                return next(err);
            }
            //Successful, so render
            res.render("bookInstanceList", {
                layout: "default",
                title: "Book Instance List",
                list: bookInstanceList.map((instance) => ({
                    url: instance.url,
                    book: {
                        title: instance.book.title,
                    },
                    imprint: instance.imprint,
                    status: instance.status,
                    due_back: moment(instance.due_back).format("MMMM Do YYYY"),
                })),
            });
        });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
    BookInstance.findById(req.params.id)
        .populate("book")
        .exec(function (err, bookinstance) {
            if (err) {
                return next(err);
            }
            if (bookinstance == null) {
                // No results.
                err = new Error("Book copy not found");
                err.status = 404;
                return next(err);
            }
            // Successful, so render.
            res.render("bookinstanceDetail", {
                layout: "default",
                title: "Copy: " + bookinstance.book.title,
                bookinstance: {
                    _id: bookinstance._id.toString(),
                    url: bookinstance.url,
                    book: {
                        _id: bookinstance.book._id.toString(),
                        url: bookinstance.book.url,
                        title: bookinstance.book.title,
                    },
                    imprint: bookinstance.imprint,
                    status: bookinstance.status,
                    due_back: moment(bookinstance.due_back).format(
                        "MMMM Do YYYY"
                    ),
                },
            });
        });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, next) => {
    Book.find({}, "title").exec(function (err, books) {
        if (err) {
            return next(err);
        }
        // Successful, so render.
        res.render("bookinstanceForm", {
            layout: "default",
            title: "Create BookInstance",
            bookList: books.map((book) => ({
                _id: book._id,
                title: book.title,
            })),
        });
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    // Validate fields.
    body("book", "Book must be specified").trim().isLength({ min: 1 }),
    body("imprint", "Imprint must be specified").trim().isLength({ min: 1 }),
    body("due_back", "Invalid date").optional({ checkFalsy: true }).isISO8601(),

    // Sanitize fields.
    sanitizeBody("book").escape(),
    sanitizeBody("imprint").escape(),
    sanitizeBody("status").trim().escape(),
    sanitizeBody("due_back").toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({}, "title").exec(function (err, books) {
                if (err) {
                    return next(err);
                }
                // Successful, so render.
                res.render("bookinstanceForm", {
                    layout: "default",
                    title: "Create BookInstance",
                    bookList: books.map((book) => ({
                        _id: book._id.toString(),
                        title: book.title,
                    })),
                    selected_book: bookinstance.book._id,
                    errors: errors.array(),
                    bookinstance: {
                        book: bookinstance.book.toString(),
                        imprint: bookinstance.imprint,
                        status: bookinstance.status,
                        due_back: moment(bookinstance.due_back).format(
                            "YYYY-MM-DD"
                        ),
                    },
                });
            });
            return;
        } else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) {
                    return next(err);
                }
                // Successful - redirect to new record.
                res.redirect(bookinstance.url);
            });
        }
    },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
    BookInstance.findById(req.params.id)
        .populate("book")
        .exec(function (err, bookinstance) {
            if (err) {
                return next(err);
            }
            if (bookinstance == null) {
                // No results.
                res.redirect("/catalog/bookinstances");
            }
            // Successful, so render.
            res.render("bookinstanceDelete", {
                layout: "default",
                title: "Delete BookInstance",
                bookinstance: {
                    _id: bookinstance._id,
                    book: {
                        _id: bookinstance.book._id.toString(),
                        name: bookinstance.book.name,
                    },
                    imprint: bookinstance.imprint,
                    status: bookinstance.status,
                    due_back: moment(bookinstance.due_back).format(
                        "YYYY-MM-DD"
                    ),
                },
            });
        });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
    // Assume valid BookInstance id in field.
    BookInstance.findByIdAndRemove(req.body.id, function deleteBookInstance(
        err
    ) {
        if (err) {
            return next(err);
        }
        // Success, so redirect to list of BookInstance items.
        res.redirect("/catalog/bookinstances");
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res, next) => {
    // Get book, authors and genres for form.
    async.parallel(
        {
            bookinstance: function (callback) {
                BookInstance.findById(req.params.id)
                    .populate("book")
                    .exec(callback);
            },
            books: function (callback) {
                Book.find(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            if (results.bookinstance == null) {
                // No results.
                err = new Error("Book copy not found");
                err.status = 404;
                return next(err);
            }
            // Success.
            res.render("bookinstanceForm", {
                layout: "default",
                title: "Update BookInstance",
                bookList: results.books.map((book) => ({
                    _id: book._id.toString(),
                    title: book.title,
                })),
                selected_book: results.bookinstance.book._id,
                bookinstance: {
                    book: {
                        _id: results.bookinstance.book._id.toString(),
                        name: results.bookinstance.book.name,
                    },
                    imprint: results.bookinstance.imprint,
                    status: results.bookinstance.status,
                    due_back: moment(results.bookinstance.due_back).format(
                        "YYYY-MM-DD"
                    ),
                },
            });
        }
    );
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    // Validate fields.
    body("book", "Book must be specified").isLength({ min: 1 }).trim(),
    body("imprint", "Imprint must be specified").isLength({ min: 1 }).trim(),
    body("due_back", "Invalid date").optional({ checkFalsy: true }).isISO8601(),

    // Sanitize fields.
    sanitizeBody("book").escape(),
    sanitizeBody("imprint").escape(),
    sanitizeBody("status").escape(),
    sanitizeBody("due_back").toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped/trimmed data and current id.
        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id,
        });

        if (!errors.isEmpty()) {
            // There are errors so render the form again, passing sanitized values and errors.
            Book.find({}, "title").exec(function (err, books) {
                if (err) {
                    return next(err);
                }
                // Successful, so render.
                res.render("bookinstanceForm", {
                    layout: "default",
                    title: "Update BookInstance",
                    bookList: books.map((book) => ({
                        _id: book._id.toString(),
                        title: book.title,
                    })),
                    selected_book: bookinstance.book._id,
                    errors: errors.array(),
                    bookinstance: {
                        book: {
                            _id: bookinstance.book._id.toString(),
                            name: bookinstance.book.name,
                        },
                        imprint: bookinstance.imprint,
                        status: bookinstance.status,
                        due_back: moment(bookinstance.due_back).format(
                            "YYYY-MM-DD"
                        ),
                    },
                });
            });
            return;
        } else {
            // Data from form is valid.
            BookInstance.findByIdAndUpdate(
                req.params.id,
                bookinstance,
                {},
                function (err, thebookinstance) {
                    if (err) {
                        return next(err);
                    }
                    // Successful - redirect to detail page.
                    res.redirect(thebookinstance.url);
                }
            );
        }
    },
];
