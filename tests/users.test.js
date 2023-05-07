const request = require("supertest");
const mongoose = require("mongoose");
const app = require("./../app");

require("dotenv").config();

const PORT = process.env.PORT || 3000;
const uriDb = process.env.DB_HOST;

const connection = mongoose.connect(uriDb, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

connection
  .then(() => {
    app.listen(PORT, function () {
      console.log("Database connection successful");
    });
  })
  .catch((e) => {
    console.log("Database connection error:", e);
    process.exit(1);
  });

describe("registration controller testing", () => {
  test("registration controller testing", async () => {
    const response = await request(app)
      .post("/api/users/login")
      .send({ email: "test@test.pl", password: "test123" });
    expect(response.status).toBe(200);
  }, 50000);
});
