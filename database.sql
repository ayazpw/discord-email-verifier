

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


CREATE TABLE `ogrenci` (
  `id` int(11) NOT NULL,
  `discord_id` varchar(32) NOT NULL,
  `email` varchar(64) NOT NULL,
  `uni` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `cache` (
  `id` int(11) NOT NULL,
  `discordid` int(32) NOT NULL,
  `email` varchar(64) NOT NULL,
  `verification_code` int(11) NOT NULL,
  `domain_type` int(11) NOT NULL,
  `created_at` varchar(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


ALTER TABLE `ogrenci`
  ADD PRIMARY KEY (`id`);


ALTER TABLE `cache`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `ogrenci`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;
COMMIT;

ALTER TABLE `cache`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;
COMMIT;

