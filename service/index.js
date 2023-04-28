const contactList = require("./schema/contact");
const User = require("./schema/user");

const getAllContacts = async () => {
  return contactList.find();
};

const getContactById = (contactId) => {
  return contactList.findOne({ _id: contactId });
};

const addContact = ({ name, email, phone }) => {
  return contactList.create({ name, email, phone });
};

const updateContact = (contactId, { name, email, phone }) => {
  return contactList.findByIdAndUpdate(
    { _id: contactId },
    { new: name, email, phone }
  );
};

const removeContact = (contactId) => {
  return contactList.findByIdAndRemove({ _id: contactId });
};

const updateStatusContact = (contactId, favorite) => {
  return contactList.findByIdAndUpdate({ _id: contactId }, favorite, {
    new: true,
  });
};

const existingUser = async (query) => {
  const existingUser = await User.findOne(query);
  return existingUser;
};

const saveNewUser = async (newUser) => {
  const user = new User(newUser);
  const savedUser = await user.save();
  return savedUser;
};

const loginResponse = (res, token, email, subscription) => {
  return res.status(200).json({
    token,
    user: {
      email,
      subscription,
    },
  });
};

const findUserByIdAndToken = async (userId, token) => {
  const user = await User.findOne({ _id: userId, token: token });
  return user;
};

const findUserById = async (userId) => {
  const user = await User.findById({ _id: userId });
  return user;
};

const getPaginationContacts = async ({ offset, limit }) => {
  const contactsWithPagination = await contactList
    .find()
    .skip(offset)
    .limit(limit);
  return contactsWithPagination;
};

const getContactsByField = async (fieldName, fieldValue) => {
  const query = {};
  query[fieldName] = fieldValue;
  const results = await contactList.find(query);
  return results;
};

module.exports = {
  getAllContacts,
  getContactById,
  addContact,
  updateContact,
  removeContact,
  updateStatusContact,
  existingUser,
  saveNewUser,
  loginResponse,
  findUserByIdAndToken,
  findUserById,
  getPaginationContacts,
  getContactsByField,
};
