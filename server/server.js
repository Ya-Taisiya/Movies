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

// Обновление отзыва
app.put("/reviews/:id", (req, res) => {
  const { id } = req.params;
  const { user_id, rating, comment } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "Необходимо указать user_id" });
  }

  const sql = `
    UPDATE reviews 
    SET rating = ?, comment = ? 
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [rating, comment, id, user_id], (err, result) => {
    if (err) {
      console.error("Ошибка при обновлении отзыва:", err);
      return res.status(500).json({ error: "Ошибка при обновлении отзыва" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Отзыв не найден" });
    }
    res.json({ message: "Отзыв обновлен" });
  });
});

// Удаление отзыва
app.delete("/reviews/:id", (req, res) => {
  const { id } = req.params;
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "Необходимо указать user_id" });
  }

  const sql = "DELETE FROM reviews WHERE id = ? AND user_id = ?";

  db.query(sql, [id, user_id], (err, result) => {
    if (err) {
      console.error("Ошибка при удалении отзыва:", err);
      return res.status(500).json({ error: "Ошибка при удалении отзыва" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Отзыв не найден" });
    }
    res.json({ message: "Отзыв удален" });
  });
});

// Получение среднего рейтинга фильма
app.get("/movies/rating/:movie_id", (req, res) => {
  const { movie_id } = req.params;

  const sql = `
    SELECT AVG(rating) as average_rating, COUNT(*) as review_count 
    FROM reviews 
    WHERE movie_id = ?
  `;

  db.query(sql, [movie_id], (err, results) => {
    if (err) {
      console.error("Ошибка при получении рейтинга:", err);
      return res.status(500).json({ error: "Ошибка при получении рейтинга" });
    }
    res.json({
      average_rating: results[0].average_rating || 0,
      review_count: results[0].review_count || 0
    });
  });
});

// Проверка, оставлял ли пользователь отзыв
app.get("/reviews/check", (req, res) => {
  const { user_id, movie_id } = req.query;

  const sql = `
    SELECT id, rating 
    FROM reviews 
    WHERE user_id = ? AND movie_id = ?
  `;

  db.query(sql, [user_id, movie_id], (err, results) => {
    if (err) {
      console.error("Ошибка при проверке отзыва:", err);
      return res.status(500).json({ error: "Ошибка при проверке отзыва" });
    }
    res.json(results.length > 0 ? results[0] : null);
  });
});

// Получение оценки пользователя для фильма
app.get('/ratings/check', (req, res) => {
  const { user_id, movie_id } = req.query;

  const sql = 'SELECT id, rating FROM ratings WHERE user_id = ? AND movie_id = ?';
  
  db.query(sql, [user_id, movie_id], (err, results) => {
    if (err) {
      console.error('Ошибка при проверке оценки:', err);
      return res.status(500).json({ error: 'Ошибка при проверке оценки' });
    }
    res.json(results.length > 0 ? results[0] : null);
  });
});

// Добавление/обновление оценки
app.post('/ratings', (req, res) => {
  const { user_id, movie_id, rating } = req.body;
  
  if (!user_id || !movie_id || rating === undefined) {
    return res.status(400).json({ error: 'Необходимые поля отсутствуют' });
  }

  // Сначала проверяем, есть ли уже оценка от этого пользователя
  db.query(
    'SELECT id FROM ratings WHERE user_id = ? AND movie_id = ?',
    [user_id, movie_id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка сервера' });
      }

      if (results.length > 0) {
        // Обновляем существующую оценку
        db.query(
          'UPDATE ratings SET rating = ? WHERE id = ?',
          [rating, results[0].id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Ошибка при обновлении оценки' });
            }
            res.json({ message: 'Оценка обновлена' });
          }
        );
      } else {
        // Добавляем новую оценку
        db.query(
          'INSERT INTO ratings (user_id, movie_id, rating) VALUES (?, ?, ?)',
          [user_id, movie_id, rating],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Ошибка при добавлении оценки' });
            }
            res.json({ message: 'Оценка добавлена' });
          }
        );
      }
    }
  );
});

// Получение среднего рейтинга фильма
app.get('/movies/:id/rating', (req, res) => {
  const { id } = req.params;

  const sql = 'SELECT AVG(rating) as average_rating, COUNT(*) as rating_count FROM ratings WHERE movie_id = ?';
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Ошибка при получении рейтинга:', err);
      return res.status(500).json({ error: 'Ошибка при получении рейтинга' });
    }
    
    const avgRating = results[0].average_rating || 0;
    const ratingCount = results[0].rating_count || 0;
    
    res.json({
      average_rating: avgRating,
      rating_count: ratingCount
    });
  });
});

// Добавление отзыва
app.post("/reviews", (req, res) => {
  const { movie_id, user_id, user_name, rating, comment } = req.body;
  
  if (!movie_id || !user_id || !user_name || !rating) {
    return res.status(400).json({ error: "Необходимые поля отсутствуют" });
  }

  const sql = `
    INSERT INTO reviews (movie_id, user_id, user_name, rating, comment)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [movie_id, user_id, user_name, rating, comment || null], (err, result) => {
    if (err) {
      console.error("Ошибка при добавлении отзыва:", err);
      return res.status(500).json({ error: "Ошибка при добавлении отзыва" });
    }
    res.status(201).json({ 
      message: "Отзыв добавлен",
      review: {
        id: result.insertId,
        movie_id,
        user_id,
        user_name,
        rating,
        comment,
        created_at: new Date().toISOString()
      }
    });
  });
});

// Получение отзывов для фильма
app.get("/reviews/:movie_id", (req, res) => {
  const { movie_id } = req.params;

  const sql = "SELECT * FROM reviews WHERE movie_id = ? ORDER BY created_at DESC";

  db.query(sql, [movie_id], (err, results) => {
    if (err) {
      console.error("Ошибка при получении отзывов:", err);
      return res.status(500).json({ error: "Ошибка при получении отзывов" });
    }
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Сервер работает на http://localhost:${port}`);
});