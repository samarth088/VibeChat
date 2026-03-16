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

    // Find chat
    const chat = await Chat.findById(chatId);

    if(!chat){
      return res.status(404).json({
        success:false,
        message:"Chat not found"
      });
    }

    // Detect receiver
    const receiver = chat.members.find(
      m => m.toString() !== sender.toString()
    );

    const message = await Message.create({
      chat: chatId,
      sender: sender,
      receiver: receiver,
      content: text
    });

    // Update chat
    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    await chat.save();

    res.json({
      success:true,
      message
    });

  }catch(err){
    next(err);
  }
};
