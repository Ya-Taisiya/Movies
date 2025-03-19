import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();
const port = 3000;

app.use(cors({
  origin: "http://localhost:4000", // Укажите адрес вашего клиента
  credentials: true, // Разрешаем передачу куки
}));
app.use(express.json());

const db = mysql.createConnection({
  host: "mysql-8.2",
  user: "root",
  password: "",
  database: "Movies",
});

db.connect((err) => {
  if (err) {
    console.error("Ошибка подключения к базе данных: ", err);
    return;
  }
  console.log("Подключено к базе данных MySQL");
});

// Регистрация пользователя
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Заполните все поля" });
  }

  const sql = "INSERT INTO users (username, password) VALUES (?, ?)";

  db.query(sql, [username, password], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Ошибка при регистрации" });
    }
    res.status(201).json({ message: "Пользователь зарегистрирован", user: { id: result.insertId, username } });
  });
});

// Авторизация пользователя
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Введите логин и пароль" });
  }

  const sql = "SELECT * FROM users WHERE username = ? AND password = ?";

  db.query(sql, [username, password], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Ошибка сервера" });
    }
    if (results.length > 0) {
      const user = results[0];
      res.json({ message: "Авторизация успешна", user });
    } else {
      res.status(401).json({ error: "Неверный логин или пароль" });
    }
  });
});

// Добавление закладки
app.post("/bookmarks", (req, res) => {
  const { user_id, movie_id, title, poster, year, rating, duration } = req.body;
  if (!user_id || !movie_id || !title || !poster) {
    return res.status(400).json({ error: "Необходимые поля отсутствуют" });
  }

  const sql = `
    INSERT INTO bookmarks (user_id, movie_id, title, poster, year, rating, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [user_id, movie_id, title, poster, year, rating, duration], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Ошибка при добавлении закладки" });
    }
    res.status(201).json({ message: "Закладка добавлена", bookmarkId: result.insertId });
  });
});

// Удаление закладки
app.delete("/bookmarks/:id", (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body; // Получаем user_id из тела запроса

  if (!user_id) {
    return res.status(400).json({ error: "Необходимо указать user_id" });
  }

  const sql = "DELETE FROM bookmarks WHERE id = ? AND user_id = ?";

  db.query(sql, [id, user_id], (err, result) => {
    if (err) {
      console.error("Ошибка при удалении закладки:", err);
      return res.status(500).json({ error: "Ошибка при удалении закладки" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Закладка не найдена" });
    }
    res.json({ message: "Закладка удалена" });
  });
});

// Получение закладок пользователя
app.get("/bookmarks/:user_id", (req, res) => {
  const { user_id } = req.params;

  const sql = "SELECT * FROM bookmarks WHERE user_id = ?";

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Ошибка при получении закладок" });
    }
    res.set('Cache-Control', 'no-store'); // Отключаем кэширование
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Сервер работает на http://localhost:${port}`);
});