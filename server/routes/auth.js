const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @route   POST /api/auth/signup
// @desc    Register a new user
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;
        const city = req.body.city?.trim();
        const zone = req.body.zone?.trim();
        const area = req.body.area?.trim();

        // Check if user already exists
        const emailLower = email.toLowerCase().trim();
        let user = await User.findOne({ email: emailLower });
        let admin = await Admin.findOne({ email: emailLower });
        
        if (user || admin) {
            return res.status(400).json({ message: 'User already exists' });
        }

        if (role === 'admin') {
            user = new Admin({
                name: name?.trim(),
                email: emailLower,
                password,
                phone,
                city,
                zone: zone || 'All',
                area,
                role: 'admin'
            });
        } else {
            user = new User({
                name: name?.trim(),
                email: emailLower,
                password,
                phone,
                city,
                zone,
                area,
                role: (role || 'citizen').trim()
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Create JWT
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                const userObj = user.toObject();
                delete userObj.password;
                userObj.id = userObj._id;
                res.json({ token, user: userObj });
            }
        );
    } catch (err) {
        console.error('Signup Error:', err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ message: 'Validation Error: ' + messages.join(', ') });
        }
        res.status(500).json({ message: 'Server Error: ' + err.message });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    try {
        const { password } = req.body;
        const email = req.body.email?.toLowerCase().trim();

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Check if user exists in either collection (Strict Lowercase Match)
        let user = await User.findOne({ email });
        let is_admin = false;

        if (!user) {
            user = await Admin.findOne({ email });
            is_admin = true;
        }

        if (!user) {
            return res.status(400).json({ message: 'Email incorrect' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Password incorrect' });
        }

        // Update last login
        user.lastLogin = Date.now();
        await user.save();

        // Create JWT
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                const userObj = user.toObject();
                delete userObj.password;
                userObj.id = userObj._id;
                res.json({ token, user: userObj });
            }
        );
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ message: 'Server Error: ' + err.message });
    }
});

// @route   GET /api/auth/users
// @desc    Get all users (Admin check simplified for now)
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error('Fetch Users Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
router.get('/profile', auth, async (req, res) => {
    try {
        // Try to find in User or Admin collection
        let user = await User.findById(req.user.id).select('-password');
        if (!user) {
            user = await Admin.findById(req.user.id).select('-password');
        }
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userObj = user.toObject();
        userObj.id = userObj._id;
        res.json(userObj);
    } catch (err) {
        console.error('Fetch Profile Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, phone, zone, city, area, postalCode } = req.body;
        const userId = req.user.id;

        // Build profile object
        const profileFields = {};
        if (name) profileFields.name = name;
        if (phone) profileFields.phone = phone;
        if (zone) profileFields.zone = zone;
        if (city) profileFields.city = city;
        if (area) profileFields.area = area;
        if (postalCode) profileFields.postalCode = postalCode;

        let user = await User.findById(userId);
        let Model = User;

        if (!user) {
            user = await Admin.findById(userId);
            Model = Admin;
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user = await Model.findByIdAndUpdate(
            userId,
            { $set: profileFields },
            { new: true }
        ).select('-password');

        const userObj = user.toObject();
        delete userObj.password;
        userObj.id = userObj._id;
        res.json(userObj);
    } catch (err) {
        console.error('Update Profile Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/auth/profile/avatar
// @desc    Update profile avatar (base64)
router.put('/profile/avatar', auth, async (req, res) => {
  try {
    const { avatar } = req.body;
    const userId = req.user.id;

    if (!avatar) {
      return res.status(400).json({ message: 'No avatar image provided' });
    }

    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.avatar = avatar;
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    userObj.id = userObj._id;
    res.json(userObj);
  } catch (err) {
    console.error('Update Avatar Error:', err.message);
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Change Password Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Forgot password handler
router.post('/forgot-password', async (req, res) => {
    try {
        const email = req.body.email?.toLowerCase().trim();
        let user = await User.findOne({ email });
        if (!user) {
            user = await Admin.findOne({ email });
        }
        
        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
        const message = `You are receiving this email because you requested a password reset for your EcoPulse account.\n\nPlease click on the link below to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'EcoPulse Password Reset',
                message,
            });
            res.status(200).json({ message: 'Email sent successfully!' });
        } catch (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error) {
        console.error('Forgot Password Error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/auth/reset-password/:token
// @desc    Reset password handler
router.put('/reset-password/:token', async (req, res) => {
    try {
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        let user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            user = await Admin.findOne({
                resetPasswordToken,
                resetPasswordExpire: { $gt: Date.now() },
            });
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        
        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset Password Error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/verify-email
// @desc    Direct verify email (bypassing token)
router.post('/verify-email', async (req, res) => {
    try {
        const email = req.body.email?.toLowerCase().trim();
        let user = await User.findOne({ email });
        if (!user) {
            user = await Admin.findOne({ email });
        }
        
        if (!user) {
            return res.status(404).json({ message: 'Email not found in database' });
        }
        res.status(200).json({ message: 'User verified successfully' });
    } catch (error) {
        console.error('Verify Email Error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/direct-reset-password
// @desc    Direct reset password (bypassing token)
router.post('/direct-reset-password', async (req, res) => {
    try {
        const email = req.body.email?.toLowerCase().trim();
        const { password } = req.body;
        let user = await User.findOne({ email });
        if (!user) {
            user = await Admin.findOne({ email });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Direct Reset Password Error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/google
// @desc    Google SignIn/SignUp
router.post('/google', async (req, res) => {
  try {
    const { token, role } = req.body;
    // Verify token with google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { name, email, picture, sub } = ticket.getPayload();
    
    // Check if user exists
    let user = await User.findOne({ email });
    let admin = await Admin.findOne({ email });

    if (!user && !admin) {
      if (role === 'admin') {
          user = await Admin.create({
              name: name,
              email: email,
              password: '',
              phone: 'Not provided',
              zone: 'All',
              role: 'admin'
          });
      } else {
          user = await User.create({
              name: name,
              email: email,
              password: '',
              phone: 'Not provided',
              zone: 'Unassigned',
              role: role || 'citizen',
              isGoogleAuth: true
          });
      }
    } else {
        user = user || admin;
    }

    // Generate JWT token
    const payload = { user: { id: user.id, role: user.role } };
    const appToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    const userObj = user.toObject();
    delete userObj.password;
    userObj.id = userObj._id;
    
    res.status(200).json({
      success: true,
      token: appToken,
      user: userObj
    });
  } catch (error) {
    console.error("Google Auth backend error: ", error);
    res.status(401).json({ message: 'Google Authentication Failed' });
  }
});

module.exports = router;
