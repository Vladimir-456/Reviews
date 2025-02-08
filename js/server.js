const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer  = require('multer');
const path = require('path');
const { getRelativeTime } = require('./util.js');
const sanitizeHtml = require('sanitize-html');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const commentLimiter = rateLimit({
    windowMs: 10 * 1000, // 10 секунд
    max: 1, // Разрешаем только 1 комментарий за 10 секунд
    message: { error: "Слишком часто отправляете комментарии. Попробуйте позже." }
});

const app = express();
app.use(cors());
// Парсинг JSON оставляем для остальных запросов, если они есть
app.use(express.json());

app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
// Настраиваем хранилище для multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // папка, куда будут сохраняться файлы
  },
  filename: function (req, file, cb) {
    // Уникальное имя файла: текущая дата и оригинальное имя
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Создаем папку uploads, если ее еще нет (можно сделать через fs)
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const pool = new Pool({
    user: 'postgres', 
    host: 'localhost',
    database: 'comments_db',
    password: '12',
    port: 5432,
});
  
app.get('/comments', async (req, res) => {
    // По умолчанию загружаем 3 комментария, начиная с 0
    const limit = parseInt(req.query.limit, 10) || 5;
    const offset = parseInt(req.query.offset, 10) || 0;
  
    try {
      const result = await pool.query(
        'SELECT * FROM comments ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );

      const formattedComments = result.rows.map(comment => ({
        ...comment,
        relativeTime: getRelativeTime(comment.created_at),
      }));

      res.json(formattedComments);
    } catch (err) {
      console.error('Ошибка при получении комментариев:', err);
      res.status(500).json({ error: err.message });
    }
  });
  app.post('/comments', commentLimiter, upload.single('image'), async (req, res) => {
    let { username, text } = req.body;
    let img = null;

    if (!username || !text || text.trim() === '') {
        return res.status(400).json({ error: "Имя и комментарий не могут быть пустыми!" });
    }

    // Очищаем текст от XSS-инъекций
    username = sanitizeHtml(username);
    text = sanitizeHtml(text);

    if (req.file) {
        img = `http://localhost:3000/uploads/${req.file.filename}`;
    }

    try {
        const result = await pool.query(
            'INSERT INTO comments (username, text, img) VALUES ($1, $2, $3) RETURNING *',
            [username, text, img]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при добавлении комментария:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});
// Статическая папка для загруженных файлов
app.use('/uploads', express.static('uploads'));

const port = 3000;
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});