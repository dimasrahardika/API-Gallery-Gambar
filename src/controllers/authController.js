
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Mohon berikan email dan password'
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah'
      });
    }

    const token = generateToken(user);

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
    res.status(400).json({
      status: 'error',
      message: error.message
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