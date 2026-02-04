const Admin = require("../model/Staff/Admin");


const isAdmin = async (req, res, next) => {
    //fid user
    const userId = req.userAuth._id
    const adminFound = await Admin.findById(userId)
    // check admin
    if(adminFound?.role === "admin" ){
        next()
    }else {
        next(new Error("You are not authorized to access this resource "))
    }

};

module.exports = isAdmin;
