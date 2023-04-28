const express = require("express");
const router = express.Router();
const ctrlContact = require("../../models/contacts");

router.get("/contacts", ctrlContact.get);

router.get("/contacts/:contactId", ctrlContact.getById);

router.post("/contacts", ctrlContact.add);

router.put("/contacts/:contactId", ctrlContact.update);

router.delete("/contacts/:contactId", ctrlContact.remove);

router.patch("/contacts/:contactId/favorite", ctrlContact.favorite);

router.get("/", ctrlContact.pagination);

router.get("/", ctrlContact.filter);

module.exports = router;
