const express = require("express");
const catalogRouter = express.Router();

// Require controller modules.
var bookController = require("../controllers/bookController");
var authorController = require("../controllers/authorController");
var genreController = require("../controllers/genreController");
var bookInstanceController = require("../controllers/bookinstanceController");

/// BOOK ROUTES ///

// GET catalog home page.
catalogRouter.get("/", bookController.index);

// GET request for creating a Book. NOTE This must come before routes that display Book (uses id).
catalogRouter.get("/book/create", bookController.book_create_get);

// POST request for creating Book.
catalogRouter.post("/book/create", bookController.book_create_post);

// GET request to delete Book.
catalogRouter.get("/book/:id/delete", bookController.book_delete_get);

// POST request to delete Book.
catalogRouter.post("/book/:id/delete", bookController.book_delete_post);

// GET request to update Book.
catalogRouter.get("/book/:id/update", bookController.book_update_get);

// POST request to update Book.
catalogRouter.post("/book/:id/update", bookController.book_update_post);

// GET request for one Book.
catalogRouter.get("/book/:id", bookController.book_detail);

// GET request for list of all Book items.
catalogRouter.get("/books", bookController.book_list);

/// AUTHOR ROUTES ///

// GET request for creating Author. NOTE This must come before route for id (i.e. display author).
catalogRouter.get("/author/create", authorController.author_create_get);

// POST request for creating Author.
catalogRouter.post("/author/create", authorController.author_create_post);

// GET request to delete Author.
catalogRouter.get("/author/:id/delete", authorController.author_delete_get);

// POST request to delete Author.
catalogRouter.post("/author/:id/delete", authorController.author_delete_post);

// GET request to update Author.
catalogRouter.get("/author/:id/update", authorController.author_update_get);

// POST request to update Author.
catalogRouter.post("/author/:id/update", authorController.author_update_post);

// GET request for one Author.
catalogRouter.get("/author/:id", authorController.author_detail);

// GET request for list of all Authors.
catalogRouter.get("/authors", authorController.author_list);

/// GENRE ROUTES ///

// GET request for creating a Genre. NOTE This must come before route that displays Genre (uses id).
catalogRouter.get("/genre/create", genreController.genre_create_get);

//POST request for creating Genre.
catalogRouter.post("/genre/create", genreController.genre_create_post);

// GET request to delete Genre.
catalogRouter.get("/genre/:id/delete", genreController.genre_delete_get);

// POST request to delete Genre.
catalogRouter.post("/genre/:id/delete", genreController.genre_delete_post);

// GET request to update Genre.
catalogRouter.get("/genre/:id/update", genreController.genre_update_get);

// POST request to update Genre.
catalogRouter.post("/genre/:id/update", genreController.genre_update_post);

// GET request for one Genre.
catalogRouter.get("/genre/:id", genreController.genre_detail);

// GET request for list of all Genre.
catalogRouter.get("/genres", genreController.genre_list);

/// BOOKINSTANCE ROUTES ///

// GET request for creating a BookInstance. NOTE This must come before route that displays BookInstance (uses id).
catalogRouter.get(
    "/bookinstance/create",
    bookInstanceController.bookinstance_create_get
);

// POST request for creating BookInstance.
catalogRouter.post(
    "/bookinstance/create",
    bookInstanceController.bookinstance_create_post
);

// GET request to delete BookInstance.
catalogRouter.get(
    "/bookinstance/:id/delete",
    bookInstanceController.bookinstance_delete_get
);

// POST request to delete BookInstance.
catalogRouter.post(
    "/bookinstance/:id/delete",
    bookInstanceController.bookinstance_delete_post
);

// GET request to update BookInstance.
catalogRouter.get(
    "/bookinstance/:id/update",
    bookInstanceController.bookinstance_update_get
);

// POST request to update BookInstance.
catalogRouter.post(
    "/bookinstance/:id/update",
    bookInstanceController.bookinstance_update_post
);

// GET request for one BookInstance.
catalogRouter.get(
    "/bookinstance/:id",
    bookInstanceController.bookinstance_detail
);

// GET request for list of all BookInstance.
catalogRouter.get("/bookinstances", bookInstanceController.bookinstance_list);

module.exports = catalogRouter;
