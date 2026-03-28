const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: String,
    email: { type: String, required: true, unique: true },
    passwordHash: {
      type: String,
      required: function () {
        return this.status === "ACTIVE";
      },
    },
    avatar: String,
    role: { type: String, required: true },
    faceDescriptor: {
      type: [Number],
      default: [],
    },

    status: {
      type: String,
      enum: ["INVITED", "ACTIVE", "BLOCKED", "REJECTED"],
      default: "INVITED",
    },

    invitationToken: String,
    invitationExpiresAt: Date,
    forgotPasswordOTP: String,
    forgotPasswordExpiresAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
