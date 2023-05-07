const express = require("express");
const request = require("supertest");
const users = require("../models/users");
const { app } = require("../app");

app.post("/api/users/signup", users.signup);

describe("registration controller testing", () => {
  beforeAll(() => {
    app.listen(5555);
    console.log("Wykonać na początku testów");
  });

  test("registration controller testing", async () => {
    const response = await request(app).post("/api/users/signup");
    expect(response.status).toBe(200);
    console.log(response.status);
  }, 100000);
});
