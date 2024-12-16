
exports.getAllCourses = async (req, res) => {
    res.json({Message: "Get all Courses"})
 
}

exports.getCourse = async (req, res) => {
    res.json({ Message: "Get a Course" });
}

exports.createCourse = async (req, res) => {
    res.json({ Message: "Create a Course" });
  
}

exports.updateCourse = async (req, res) => {
    res.json({Message: "Update a course"});
  
}

exports.deleteCourse = async (req, res) => {
    res.json({Message: "Delete a course"})
 
}