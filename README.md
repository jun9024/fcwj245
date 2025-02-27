# fcwj245
'열람실 예약' 

학교 열람실의 좌석 예약 문제를 해결하고, 학생들에게 효율적이고 사용자 친화적인 시스템을 제공하는 것을 목표로 한 프로젝트입니다.

#프로젝트 계획 

학교 열람실을 이용하면서 불편함을 느낀 경험에서 출발하여, 보다 효율적인 좌석 예약 시스템을 개발하게 되었습니다. 기존 열람실 운영 방식에서는 다음과 같은 문제점이 자주 발생했습니다.

- 좌석 현황 확인 불가: 공식적인 열람실 앱이 없어, 시험 기간 등 사람이 몰리는 시기에 빈자리를 찾기 어려워 헛걸음하는 경우가 많았습니다.

- 비효율적인 입·퇴실 및 연장 시스템:
입실·퇴실·연장 처리를 키오스크에서만 가능하도록 운영되어, 퇴실을 깜빡하고 자리를 비워도 그대로 예약 상태로 유지되는 문제가 있었습니다.
연장 기한을 놓쳐 좌석을 계속 점유하고 있다가, 다른 사용자가 해당 좌석을 예약하면서 불필요한 마찰이 발생하는 경우가 빈번했습니다.
이러한 불편함을 해소하기 위해, 실시간 좌석 예약 및 관리 시스템을 구축했습니다.

이 시스템은 GPS 기반 인증을 통해 사용자가 열람실 1km 이내에 있을 때만 좌석을 예약할 수 있도록 하며, 웹 애플리케이션을 통해 보다 직관적인 좌석 관리가 가능하도록 설계되었습니다. 백엔드는 Node.js (Express) + MySQL, 프론트엔드는 HTML + JavaScript를 사용합니다.

#기능 설명

checkLocation(): 사용자의 현재 위치를 확인하여, 1km 이내에 위치한 열람실만 예약할 수 있도록 제한합니다. 이를 통해 불필요한 예약을 방지하고, 실제 이용자에게만 예약을 허용합니다.

renderSeats(): 좌석을 화면에 렌더링하고, 빈 좌석을 클릭하면 예약을 진행할 수 있게 합니다.

login(): 사용자 로그인 정보를 검증하고, 성공적으로 로그인하면 사용자와 관련된 좌석 정보를 저장합니다.

handleSeatClick(index): 좌석을 클릭하면, 4시간 예약이 완료되며 예약된 좌석의 남은 시간을 확인할 수 있습니다. 4시간 이후 연장이 되지 않으면 자동으로 퇴실되며, 이용 시간이 30분 미만으로 남았을 경우 연장 옵션을 제공하여 사용자가 연장할 수 있게 합니다.

calculateRemainingTime(index): 예약된 좌석의 남은 시간을 계산하여, 사용자가 남은 시간을 쉽게 파악할 수 있도록 돕습니다.

checkExpiredSeats(): 좌석 이용 시간이 30분 남았을 때 사용자에게 연장 여부를 알리는 알림을 표시합니다.

displayNotification(message): 사용자에게 필요한 알림을 화면에 표시하여 중요한 정보를 전달합니다.

setInterval(checkExpiredSeats, 60 * 1000): 1분마다 좌석의 이용 시간을 확인하고, 만료된 좌석에 대한 퇴실 알림을 처리합니다.

#실행 방법

1. 서버 실행
   
cd "C:\Users\WJ\OneDrive\바탕 화면\server" (프로젝트 폴더로 이동)
 
2. 필요한 패키지 설치
   
npm install

3.MySQL 데이터베이스 설정

CREATE DATABASE seat_reservations;

USE seat_reservations;

CREATE TABLE users (

    id INT AUTO_INCREMENT PRIMARY KEY,
    
    username VARCHAR(255) NOT NULL UNIQUE,
    
    password VARCHAR(255) NOT NULL
    
);  
(MySQL 실행 후 입력)


.env 파일 생성 후 MySQL 정보 설정

DB_HOST=localhost

DB_USER=root

DB_PASSWORD=yourpassword

DB_NAME=seat_reservations


4.서버 실행

node server.js

5. 클라이언트 실행 (프론트엔드)

index.html 파일을 더블 클릭하여 실행
