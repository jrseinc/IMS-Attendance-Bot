const mongoose = require('mongoose');

const attendanceMap = mongoose.Schema({
    name: String,
    roll_number: String,
    sub_section: String,
    college_id: String,
    classes_total: Number,
    classes_total_attended: Number,
    percentage: Number,
    attendances: Array
});

module.exports = mongoose.model('attendanceMap', attendanceMap);