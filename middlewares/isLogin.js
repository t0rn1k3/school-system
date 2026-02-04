const verifyToken = require("../utils/verifyToken");
Admin = require("../model/Staff/Admin");

const isLogin = async (req, res, next) => {
  // get token from header
  const headerObj = req.headers;
  //verify token
  const token = headerObj.authorization.split(" ")[1];
  const verify = verifyToken(token);
  if(verify){
    //find admin
    const user = await Admin.findById(verify.id).select("name email role");
    //save user id in req.obj
    req.userAuth = user
    next();
  }else {
    const err = new Error("Invalid token");
    next(err);
  }

};

module.exports = isLogin;
