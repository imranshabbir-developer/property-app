import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import { ApiError } from "../utils/apiError.js";

export const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new ApiError(401, "Unauthorized, token missing");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) throw new ApiError(401, "Unauthorized, invalid token");

    req.user = user;
    next();
  } catch (error) {
    next(new ApiError(401, "Unauthorized, invalid token"));
  }
};
