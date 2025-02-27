const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();
const port = 3020; //포트번호 바꿔야함

// MySQL 연결 설정
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'dnjswns3011',
    database: 'seat_reservations'
});

db.connect(err => {
    if (err) {
        console.error('MySQL 연결 실패:', err.stack);
        return;
    }
    console.log('MySQL에 연결되었습니다.');
});

// Express 미들웨어 설정
app.use(express.json());
app.use(express.static(path.join(__dirname, 'ABC')));  // ABC 폴더의 절대 경로로 설정
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
}));

// 열람실 위치 데이터 (위도, 경도)
const studyRooms = {
    1: { lat: 37.5665, lon: 126.9780, name: "열람실1" },
    2: { lat: 37.5675, lon: 126.9790, name: "노트북 열람실1" },
    3: { lat: 37.5685, lon: 126.9800, name: "열람실2" },
    4: { lat: 37.5695, lon: 126.9810, name: "노트북 열람실2" }
};

// Haversine 공식을 사용하여 두 지점 간의 거리 계산 (단위: km)
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;  // 지구 반지름 (킬로미터)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 회원가입 API
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // 비밀번호 암호화
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).send('서버 오류');
        }

        // 암호화된 비밀번호를 DB에 저장
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, results) => {
            if (err) {
                return res.status(500).send('서버 오류');
            }
            res.send('회원가입 성공');
        });
    });
});

// 로그인 API
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            return res.status(500).send('서버 오류');
        }

        if (results.length > 0) {
            const user = results[0];

            // bcrypt를 사용해 입력된 비밀번호와 데이터베이스의 암호화된 비밀번호 비교
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    return res.status(500).send('서버 오류');
                }

                if (isMatch) {
                    req.session.username = username;
                    res.json({ message: '로그인 성공', username });
                } else {
                    res.status(400).send('잘못된 로그인 정보');
                }
            });
        } else {
            res.status(400).send('잘못된 로그인 정보');
        }
    });
});

// 로그아웃 API
app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.send('로그아웃 되었습니다.');
    });
});

// 좌석 예약 API
app.post('/reserve', (req, res) => {
    const { roomNumber, latitude, longitude, seatIndex } = req.body;

    const room = studyRooms[roomNumber];
    if (!room) {
        return res.status(400).send("잘못된 열람실 번호입니다.");
    }

    // Haversine 공식을 사용하여 거리 계산
    const distance = haversine(latitude, longitude, room.lat, room.lon);
    if (distance > 1) {  // 1km 이내만 예약 가능
        return res.status(400).send("현재 위치에서 1km 이내에서만 예약 가능합니다.");
    }

    // 좌석 예약 로직 (MySQL에 저장)
    const user = req.session.username;
    if (!user) {
        return res.status(401).send("로그인이 필요합니다.");
    }

    // 좌석 예약을 MySQL에 저장
    db.query('INSERT INTO reservations (username, room_number, seat_index) VALUES (?, ?, ?)', 
        [user, roomNumber, seatIndex], 
        (err, results) => {
            if (err) {
                return res.status(500).send('서버 오류');
            }
            res.send('예약 성공');
        }
    );
});

// 예약된 좌석 상태 조회 API
app.get('/seats', (req, res) => {
    const user = req.session.username;
    if (!user) {
        return res.status(401).send("로그인이 필요합니다.");
    }

    // 예약된 좌석 정보 조회
    db.query('SELECT * FROM reservations WHERE username = ?', [user], (err, results) => {
        if (err) {
            return res.status(500).send('서버 오류');
        }

        res.json(results);  // 예약된 좌석 정보 반환
    });
});

// 서버 실행
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
