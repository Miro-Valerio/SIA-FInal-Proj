const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ================================================
// JSON FILE STORAGE
// tasks.json acts as the database
// ================================================
const DB_FILE = path.join(__dirname, "tasks.json");

// Read tasks from file
function readTasks() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify([]));
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
}

// Write tasks to file
function writeTasks(tasks) {
    fs.writeFileSync(DB_FILE, JSON.stringify(tasks, null, 2));
}


// ================================================
// HOME
// ================================================
app.get("/", (req, res) => {
    res.json({ message: "Taskr API is running!" });
});


// ================================================
// GET all tasks
// ================================================
app.get("/tasks", (req, res) => {
    const tasks = readTasks();
    res.json(tasks);
});


// ================================================
// GET one task
// ================================================
app.get("/tasks/:id", (req, res) => {
    const tasks = readTasks();
    const task = tasks.find(t => t.id == req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
});


// ================================================
// POST — create new task
// ================================================
app.post("/tasks", (req, res) => {
    const { text, category, priority, status, assignTo, startDate, deadline, remarks, timeLeft, subtasks } = req.body;

    if (!text) {
        return res.status(400).json({ message: "Task name (text) is required" });
    }

    const tasks = readTasks();

    const newTask = {
        id:        Date.now(),
        text:      text,
        category:  category  || "work",
        priority:  priority  || "medium",
        status:    status    || "todo",
        assignTo:  assignTo  || "",
        startDate: startDate || "",
        deadline:  deadline  || "",
        remarks:   remarks   || "",
        timeLeft:  timeLeft  || 60,
        completed: false,
        expired:   false,
        subtasks:  subtasks  || [],
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    writeTasks(tasks);

    res.status(201).json(newTask);
});


// ================================================
// PUT — update existing task
// ================================================
app.put("/tasks/:id", (req, res) => {
    const tasks = readTasks();
    const index = tasks.findIndex(t => t.id == req.params.id);

    if (index === -1) {
        return res.status(404).json({ message: "Task not found" });
    }

    // Merge existing task with updated fields
    tasks[index] = { ...tasks[index], ...req.body };

    writeTasks(tasks);
    res.json(tasks[index]);
});


// ================================================
// DELETE — remove a task
// ================================================
app.delete("/tasks/:id", (req, res) => {
    const tasks = readTasks();
    const index = tasks.findIndex(t => t.id == req.params.id);

    if (index === -1) {
        return res.status(404).json({ message: "Task not found" });
    }

    const deleted = tasks.splice(index, 1);
    writeTasks(tasks);

    res.json({ message: "Task deleted", task: deleted[0] });
});


// ================================================
// GET — summary/stats
// ================================================
app.get("/summary", (req, res) => {
    const tasks = readTasks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const total     = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending   = tasks.filter(t => !t.completed && !t.expired).length;
    const overdue   = tasks.filter(t => {
        if (!t.deadline || t.completed) return false;
        const deadline = new Date(t.deadline + "T00:00:00");
        return deadline < today;
    }).length;

    res.json({ total, completed, pending, overdue });
});


// ================================================
// SERVER
// ================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Taskr server running on port ${PORT}`);
});