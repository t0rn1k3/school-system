const isLogin = (req, res, next) => {
  const isLogin = req.userAuth;
  if (isLogin) {
    next();
  } else {
    const err = new Error("You are not logged in");
    next(err);
  }
};

module.exports = isLogin;
