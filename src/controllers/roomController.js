const { Room, Seat } = require("../models");

// Lấy danh sách phòng
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy chi tiết phòng + danh sách ghế
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id, {
      include: [
        {
          model: Seat,
          order: [
            ["row", "ASC"],
            ["number", "ASC"],
          ],
        },
      ],
    });
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Thêm phòng (admin)
const createRoom = async (req, res) => {
  try {
    const { name, capacity, screen_type } = req.body;
    const room = await Room.create({ name, capacity, screen_type });
    res.status(201).json({ message: "Thêm phòng thành công", room });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Sửa phòng (admin)
const updateRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });

    await room.update(req.body);
    res.json({ message: "Cập nhật phòng thành công", room });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Xoá phòng (admin)
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });

    await room.destroy();
    res.json({ message: "Xoá phòng thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

module.exports = { getRooms, getRoomById, createRoom, updateRoom, deleteRoom };
