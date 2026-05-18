const { validationResult } = require("express-validator");
const { badRequest } = require("../utils/response");

const validate = (schemas) => [
  ...schemas,
  (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors = result.array().map((e) => e.msg);
      return badRequest(res, "Validation failed", errors);
    }
    next();
  },
];

module.exports = validate;
