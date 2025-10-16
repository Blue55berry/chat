const Message = require('../models/Message');
const User = require('../models/User');
const Chat = require('../models/Chat');
const fs = require('fs');
const path = require('path');

// @desc    Get all messages
// @route   GET /api/messages/:chatId
// @access  Private
const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "username profilePic email")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create new message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { content, chatId } = req.body;
    const files = req.files || [];

    if ((!content || content.trim() === '') && files.length === 0) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    if (!chatId) {
      return res.status(400).json({ message: "Chat ID is required" });
    }

    // Process file uploads if any
    const attachments = files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      path: `/uploads/${file.filename}`,
      size: file.size
    }));

    let newMessage = {
      sender: req.user._id,
      content: content || "",
      chat: chatId,
      attachments: attachments
    };

    try {
      let message = await Message.create(newMessage);

      message = await message.populate("sender", "username profilePic");
      message = await message.populate("chat");
      message = await User.populate(message, {
        path: "chat.users",
        select: "username profilePic email",
      });

      await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

      res.json(message);
    } catch (error) {
      // Clean up uploaded files if message creation fails
      if (attachments.length > 0) {
        attachments.forEach(attachment => {
          const filePath = path.join(__dirname, '..', attachment.path);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
      throw error;
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { allMessages, sendMessage };
