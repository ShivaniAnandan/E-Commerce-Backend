import User from '../models/userModel.js';  // Adjust the import based on your directory structure
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import generateToken from '../utils/generateToken.js'; // Adjust this import based on your directory structure

// Register a new user
export const register = async (req, res) => {
  const { name, email, password} = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ name, email, password});
    await user.save();

    // Create JWT token
    const token = generateToken(user._id);

    res.status(201).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Login an existing user
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create JWT token
    const token = generateToken(user._id);

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000, // 1 hour in milliseconds
      sameSite: 'None', // Allows cross-origin requests
    });

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Forget password
export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      // Generate JWT token with expiration time
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
      const resetLink = `${process.env.ResetUrl}/reset-password/${token}`;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_ID,
          pass: process.env.JWT_SECRET, // Use an app-specific password if 2FA is enabled
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_ID,
        to: user.email,
        subject: "Password Reset Link",
        html: `
          <p> Dear ${user.name}, </p>
          <p> Sorry to hear you’re having trouble logging into your account. If this was you, you can reset your password now. </p>
          <p> Click the following link to reset your password: <a href="${resetLink}">${resetLink}</a> </p>
          <p> If you didn’t request this, you can ignore this message. </p>
        `
      };

      transporter.sendMail(mailOptions, (error) => {
        if (error) {
          console.log(error);
          return res.status(500).send({ message: "Failed to send the password reset mail" });
        }
        res.status(201).send({ message: "Password reset mail sent successfully" });
      });
    } else {
      res.status(400).send({ message: `User with ${email} does not exist` });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;

    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(400).send({ message: "Invalid or expired token" });
      }

      // Find the user by email from the decoded token
      const user = await User.findOne({ email: decoded.email });

      if (!user) {
        return res.status(400).send({ message: "User not found" });
      }

      // Check if newPassword is provided
      if (req.body.newPassword) {
        user.password = req.body.newPassword;
        await user.save();
        res.status(201).send({ message: "Your new password has been updated" });
      } else {
        res.status(400).send({ message: "New password not provided" });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

// // @desc Auth user & get token (For Users and Admin)
// // @route POST /api/users/login
// // @access Public
// export const authUser = async (req, res) => {
//   const { email, password } = req.body;
//   const user = await User.findOne({ email });

//   if (user && (await user.matchPassword(password))) {
//     res.json({
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       isAdmin: user.isAdmin,  // Admin flag to distinguish admin users
//       token: generateToken(user._id),  // Generates token for session management
//     });
//   } else {
//     res.status(401);
//     throw new Error('Invalid email or password');  // Error for incorrect login details
//   }
// };

// // @desc Register a new user (For Users)
// // @route POST /api/users
// // @access Public
// export const registerUser = async (req, res) => {
//   const { name, email, password } = req.body;
//   const userExists = await User.findOne({ email });

//   if (userExists) {
//     res.status(400);
//     throw new Error('User already exists');  // Error if email is already registered
//   }

//   const user = await User.create({ name, email, password });  // Creating new user

//   if (user) {
//     res.status(201).json({
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       isAdmin: user.isAdmin,  // New users are not admins by default
//       token: generateToken(user._id),  // Generate token for the new user
//     });
//   } else {
//     res.status(400);
//     throw new Error('Invalid user data');  // Error for bad request
//   }
// };

// (Optional Additions for Admin below)

// @desc Get all users (For Admin only)
// @route GET /api/users
// @access Admin
export const getUsers = async (req, res) => {
  const users = await User.find({});
  res.json(users);  // Only admin can access all user data
};

// @desc Delete a user (For Admin only)
// @route DELETE /api/users/:id
// @access Admin
export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.deleteOne();
    res.json({ message: 'User removed' });  // Admin can delete users
  } else {
    res.status(404);
    throw new Error('User not found');  // Error for invalid user ID
  }
};

// @desc Update user to admin (For Admin only)
// @route PUT /api/users/:id/admin
// @access Admin
export const updateUserToAdmin = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.isAdmin = true;
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,  // Admin privilege updated
    });
  } else {
    res.status(404);
    throw new Error('User not found');  // Error for invalid user ID
  }
};
