import jwt from 'jsonwebtoken';

export function signUserToken(user) {
  return jwt.sign({ sub: user._id.toString(), type: 'user' }, process.env.JWT_SECRET, {
    expiresIn: '12h'
  });
}

export function verifyUserToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function signAdminToken() {
  return jwt.sign({ isAdmin: true, type: 'admin' }, process.env.ADMIN_JWT_SECRET, {
    expiresIn: '6h'
  });
}

export function verifyAdminToken(token) {
  return jwt.verify(token, process.env.ADMIN_JWT_SECRET);
}