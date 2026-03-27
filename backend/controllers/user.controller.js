// UPDATED
const User = require("../models/User");


// GET ALL USERS
exports.getAllUsers = async (req,res,next)=>{
  try{

    const users = await User.find(
      {_id:{ $ne:req.user._id }},
      "username name bio avatar uid status isOnline lastSeen"
    ).sort({ name: 1 });

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

    const { name, username, bio, avatar } = req.body;

    // Basic validation
    const updates = {};
    if (typeof name === "string") updates.name = name.trim();
    if (typeof bio === "string") updates.bio = bio;
    if (typeof avatar === "string") updates.avatar = avatar;

    // Username uniqueness check
    if (typeof username === "string") {
      const clean = username.trim().toLowerCase();
      if (!/^[a-z0-9_\.]{3,30}$/.test(clean)) {
        return res.status(400).json({
          success:false,
          message:"Username must be 3-30 characters: letters, numbers, underscore or dot"
        });
      }

      const existing = await User.findOne({ username: clean, _id: { $ne: req.user._id } });
      if (existing) {
        return res.status(400).json({
          success:false,
          message:"Username already taken"
        });
      }
      updates.username = clean;
    }

    // Perform update
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new:true, runValidators: true }
    ).select("-password");

    res.json({
      success:true,
      user
    });

  }catch(err){
    // Handle duplicate key errors defensively
    if (err && err.code === 11000) {
      const key = Object.keys(err.keyValue || {}).join(", ");
      return res.status(400).json({
        success:false,
        message:`Duplicate value for field: ${key}`
      });
    }
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
    }).select("_id name username uid avatar status isOnline lastSeen");

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
        bio: user.bio || '',
        isOnline: !!user.isOnline,
        lastSeen: user.lastSeen || null
      }
    });

  }catch(err){
    next(err);
  }
};
