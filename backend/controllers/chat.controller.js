const Chat = require("../models/Chat");
const Message = require("../models/Message");

// CREATE OR GET CHAT
exports.createOrGetChat = async (req, res, next) => {
  try {

    const currentUserId = req.user._id;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({
        success:false,
        message:"Other user ID required"
      });
    }

    let chat = await Chat.findOne({
      members:{ $all:[currentUserId, otherUserId] }
    });

    if (!chat) {
      chat = await Chat.create({
        members:[currentUserId, otherUserId],
        unreadCounts:{
          [currentUserId]:0,
          [otherUserId]:0
        }
      });
    }

    return res.json({
      success:true,
      roomId:chat._id
    });

  } catch(err){
    next(err);
  }
};


// GET USER CHATS
exports.getUserChats = async (req,res,next)=>{
  try{

    const currentUserId = req.user._id;

    const chats = await Chat.find({
      members:currentUserId
    })
    .populate("members","username avatar uid isOnline")
    .populate("lastMessage")
    .sort({updatedAt:-1});

    const formatted = chats.map(chat=>{

      const otherUser = chat.members.find(
        m => m._id.toString() !== currentUserId.toString()
      );

      return{
        _id:chat._id,
        user:otherUser,
        lastMessage:chat.lastMessage,
        unread:chat.unreadCounts?.[currentUserId] || 0
      };

    });

    res.json({
      success:true,
      chats:formatted
    });

  }catch(err){
    next(err);
  }
};


// GET CHAT MESSAGES
exports.getChatMessages = async (req,res,next)=>{
  try{

    const messages = await Message.find({
      chat:req.params.chatId
    }).sort({createdAt:1});

    res.json({
      success:true,
      messages
    });

  }catch(err){
    next(err);
  }
};
