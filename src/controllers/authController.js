const User = require('../models/user');
const { generateToken } = require('../middlewares/auth');


exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email sudah digunakan'
      });
    }


    const newUser = await User.create({
      username,
      email,
      password
    });

    const token = generateToken(newUser);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};


exports.login = async (req, res) => {
  try {
    console.log('Login attempt:', req.body.email);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return res.status(400).json({
        status: 'error',
        message: 'Mohon berikan email dan password'
      });
    }

    console.log('Searching for user with email:', email);
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('Login failed: User not found', email);
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah'
      });
    }

    console.log('User found, verifying password');
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('Login failed: Invalid password for', email);
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah'
      });
    }

    console.log('Password valid, generating token for user:', user.id);
    const token = generateToken(user);

    console.log('Login successful for:', email);
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
};

exports.getMe = async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    }
  });
};