const Message = require("../models/Message");
const Chat = require("../models/Chat");

// SEND MESSAGE
exports.sendMessage = async (req,res,next)=>{
  try{

    const sender = req.user._id;
    const { chatId, text } = req.body;

    if(!chatId || !text){
      return res.status(400).json({
        success:false,
        message:"chatId and text required"
      });
    }

    const message = await Message.create({
      chat:chatId,
      sender,
      text
    });

    await Chat.findByIdAndUpdate(chatId,{
      lastMessage:message._id,
      updatedAt:new Date()
    });

    res.json({
      success:true,
      message
    });

  }catch(err){
    next(err);
  }
};
