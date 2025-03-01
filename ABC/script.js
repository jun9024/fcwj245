// 열람실 위치 데이터 (위도, 경도)
const studyRooms = {
    1: { lat: 37.5665, lon: 126.9780, name: "열람실1" },
    2: { lat: 37.5675, lon: 126.9790, name: "노트북 열람실1" },
    3: { lat: 37.5685, lon: 126.9800, name: "열람실2" },
    4: { lat: 37.5695, lon: 126.9810, name: "노트북 열람실2" }
};

let userLat, userLon;
let selectedRoom = 1;
const seats = Array(4).fill().map(() => Array(100).fill(null));  // 좌석 배열 (각 좌석에 사용자 정보 저장)
const notifiedSeats = Array(4).fill().map(() => Array(100).fill(false)); // 30분 전 알람 여부

function selectRoom(roomNumber) {
    selectedRoom = roomNumber;

    document.querySelectorAll(".room-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".room-btn")[roomNumber - 1].classList.add("active");

    checkLocation();
}

function checkLocation() {
    navigator.geolocation.getCurrentPosition(position => {
        userLat = position.coords.latitude;
        userLon = position.coords.longitude;

        const roomLat = studyRooms[selectedRoom].lat;
        const roomLon = studyRooms[selectedRoom].lon;
        const distance = haversine(userLat, userLon, roomLat, roomLon);

        if (distance > 1) { // 1km 이내만 예약 가능
            document.getElementById("message").innerHTML = `🚫 ${studyRooms[selectedRoom].name}은 현재 위치에서 ${distance.toFixed(2)}km 떨어져 있습니다. 예약이 불가능합니다.`;
            document.getElementById("seat-container").innerHTML = "";
        } else {
            document.getElementById("message").innerHTML = `✅ ${studyRooms[selectedRoom].name} 자리 현황`;
            renderSeats();
        }
    }, () => {
        alert("❌ 위치 정보를 가져올 수 없습니다.");
    });
}

function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;  // 지구 반지름 (킬로미터)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function renderSeats() {
    const container = document.getElementById("seat-container");
    container.innerHTML = `<table><tbody></tbody></table>`;
    const tbody = container.querySelector("tbody");

    for (let i = 0; i < 10; i++) {
        const row = document.createElement("tr");

        for (let j = 0; j < 10; j++) {
            const index = i * 10 + j;
            const seat = document.createElement("td");
            const seatData = seats[selectedRoom - 1][index];
            seat.innerText = seatData ? "🔴" : index + 1;

            if (seatData) {
                seat.classList.add("reserved");
                const seatUser = seatData.user; // 예약된 사용자
                const currentUser = localStorage.getItem("username"); // 현재 로그인한 사용자

                // 예약자만 연장/퇴실 가능
                if (seatUser === currentUser) {
                    seat.onclick = () => handleSeatClick(index);
                } else {
                    seat.onclick = () => alert("🚫 이 좌석은 다른 사용자가 예약한 것입니다.");
                }
            } else {
                seat.onclick = () => handleSeatClick(index); // 빈 좌석은 클릭하여 예약
            }

            row.appendChild(seat);
        }

        tbody.appendChild(row);
    }
}

function login() {
    const usernameInput = document.getElementById("username").value;
    const passwordInput = document.getElementById("password").value;

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
    })
    .then(res => res.json())
    .then(data => {
        localStorage.setItem("username", data.username); // 로그인 후 사용자 정보 저장
        alert("로그인 성공!");
        document.getElementById("login-container").style.display = "none";  // 로그인 화면 숨기기
        renderSeats();  // 좌석 상태 반영
    })
}
    

function handleSeatClick(index) {
    const now = Date.now();
    const reservedTime = seats[selectedRoom - 1][index]?.time;
    const seatUser = seats[selectedRoom - 1][index]?.user; // 예약된 사용자
    const currentUser = localStorage.getItem("username"); // 현재 로그인한 사용자

    if (!reservedTime) {
        // 좌석 예약
        seats[selectedRoom - 1][index] = { time: now + 4 * 60 * 60 * 1000, user: currentUser }; // 4시간 예약
        notifiedSeats[selectedRoom - 1][index] = false;
        renderSeats();
        alert(`✅ ${index + 1}번 좌석이 예약되었습니다! (${formatTime(now)} - ${formatTime(now + 4 * 60 * 60 * 1000)})`);
        return;
    }

    const remainingTime = calculateRemainingTime(index);

    if (remainingTime <= 0) {
        // 예약 시간 초과되어 퇴실 처리
        seats[selectedRoom - 1][index] = null;
        notifiedSeats[selectedRoom - 1][index] = false;
        renderSeats();
        alert("🚪 이용 시간이 초과되어 자동 퇴실되었습니다.");
        return;
    }

    if (seatUser !== currentUser) {
        // 다른 사용자가 예약한 좌석 클릭 시, 남은 이용 시간 표시
        alert(`🚫 다른 사용자가 예약한 좌석입니다.\n이용 시간: ${remainingTime}분 남음`);
        return;
    }

    if (remainingTime <= 30) {
        // 연장 가능 시간
        const extend = confirm(`⏳ 이용 시간이 ${remainingTime}분 남았습니다. 연장하시겠습니까?`);
        if (extend) {
            seats[selectedRoom - 1][index].time = now + 4 * 60 * 60 * 1000; // 4시간 연장
            notifiedSeats[selectedRoom - 1][index] = false;
            alert(`📢 연장되었습니다! (${formatTime(now)} - ${formatTime(now + 4 * 60 * 60 * 1000)})`);
        } else {
            const exit = confirm("퇴실하시겠습니까?");
            if (exit) {
                seats[selectedRoom - 1][index] = null;
                notifiedSeats[selectedRoom - 1][index] = false;
                renderSeats();
                alert("🚪 퇴실 처리되었습니다.");
            }
        }
    } else {
        const exit = confirm(`⏳ 이용 시간이 ${remainingTime}분 남았습니다. 퇴실하시겠습니까?`);
        if (exit) {
            seats[selectedRoom - 1][index] = null;
            notifiedSeats[selectedRoom - 1][index] = false;
            renderSeats();
            alert("🚪 퇴실 처리되었습니다.");
        }
    }
}

function calculateRemainingTime(index) {
    const remaining = seats[selectedRoom - 1][index]?.time - Date.now();
    return remaining ? Math.floor(remaining / (60 * 1000)) : 0; // 남은 시간 계산
}

function formatTime(timestamp) {
    const time = new Date(timestamp);
    return `${time.getHours()}:${time.getMinutes().toString().padStart(2, "0")}`;
}

// 예약된 좌석 상태 확인 및 퇴실 처리 (30분 알림 등)
function checkExpiredSeats() {
    const now = Date.now();
    let notificationMessage = ""; // 알림 메시지를 모을 변수

    for (let room = 0; room < 4; room++) {
        for (let i = 0; i < 100; i++) {
            if (seats[room][i]) {
                const remainingTime = calculateRemainingTime(i);

                if (remainingTime <= 30 && remainingTime > 29 && !notifiedSeats[room][i]) {
                    notificationMessage += `⏳ ${studyRooms[room + 1].name}의 ${i + 1}번 좌석 이용 시간이 30분 남았습니다. 연장을 원하면 좌석을 클릭하세요.\n`;
                    notifiedSeats[room][i] = true;
                }

                if (remainingTime <= 0) {
                    seats[room][i] = null;
                    notifiedSeats[room][i] = false;
                    notificationMessage += `🚪 ${studyRooms[room + 1].name}의 ${i + 1}번 좌석이 자동 퇴실되었습니다.\n`;
                }
            }
        }
    }

    // 알림 메시지가 있으면 사용자에게 표시
    if (notificationMessage) {
        displayNotification(notificationMessage);
    }
}

// 사용자에게 알림을 UI로 표시하는 함수
function displayNotification(message) {
    const notificationDiv = document.getElementById("notification");
    notificationDiv.innerHTML = message;
    notificationDiv.style.display = "block"; // 알림 표시

    setTimeout(() => {
        notificationDiv.style.display = "none"; // 일정 시간 후 알림 숨기기
    }, 10000); // 10초 후 알림 사라지게 설정
}

// 1분마다 퇴실 및 알림 처리
setInterval(checkExpiredSeats, 60 * 1000);
