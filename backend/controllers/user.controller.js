const User = require("../models/User");


// GET ALL USERS
exports.getAllUsers = async (req,res,next)=>{
  try{

    const users = await User.find(
      {_id:{ $ne:req.user._id }},
      "username name bio avatar uid status"
    );

    res.json({
      success:true,
      users
    });

  }catch(err){
    next(err);
  }
};


// GET MY PROFILE
exports.getProfile = async (req,res,next)=>{
  try{

    const user = await User.findById(req.user._id).select("-password");

    if(!user){
      return res.status(404).json({
        success:false,
        message:"User not found"
      });
    }

    res.json({
      success:true,
      user
    });

  }catch(err){
    next(err);
  }
};


// UPDATE PROFILE
exports.updateProfile = async (req,res,next)=>{
  try{

    const { bio, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { bio, avatar },
      { new:true }
    ).select("-password");

    res.json({
      success:true,
      user
    });

  }catch(err){
    next(err);
  }
};


// SEARCH USER
exports.searchUser = async (req,res,next)=>{
  try{

    const { uid } = req.query;

    if(!uid){
      return res.status(400).json({
        success:false,
        message:"Search query required"
      });
    }

    const query = uid.trim().toLowerCase();

    const user = await User.findOne({
      $or:[
        { uid:query },
        { username:query }
      ],
      _id:{ $ne:req.user._id }
    }).select("_id name username uid avatar status");

    if(!user){
      return res.json({
        success:false
      });
    }

    res.json({
      success:true,
      user:{
        id:user._id,
        uid:user.uid,
        name:user.name,
        username:user.username,
        avatar:user.avatar,
        online:user.status==="online"
      }
    });

  }catch(err){
    next(err);
  }
};
