import mongoose from "mongoose";

/** Single-row store for admin password after first “change password”. */
const adminCredentialSchema = new mongoose.Schema(
  {
    passwordHash: { type: String, required: true },
  },
  { collection: "admin_credentials" }
);

export default mongoose.models.AdminCredential ??
  mongoose.model("AdminCredential", adminCredentialSchema);
