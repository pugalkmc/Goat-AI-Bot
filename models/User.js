import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
  userId: { type: Number, required: true, unique: true },
  username: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  warnCount: { type: Number, default: 0 },
});

const User = mongoose.model('User', userSchema);

export default User;
