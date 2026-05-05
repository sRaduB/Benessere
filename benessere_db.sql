-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Creato il: Mag 05, 2026 alle 13:57
-- Versione del server: 10.4.32-MariaDB
-- Versione PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `benessere_db`
--
CREATE DATABASE IF NOT EXISTS `benessere_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `benessere_db`;

-- --------------------------------------------------------

--
-- Struttura della tabella `dati_benessere`
--

CREATE TABLE `dati_benessere` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `data` date NOT NULL,
  `sonno` decimal(3,1) NOT NULL,
  `acqua` decimal(3,1) NOT NULL,
  `umore` int(11) NOT NULL,
  `punteggio` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `dati_benessere`
--

INSERT INTO `dati_benessere` (`id`, `user_id`, `data`, `sonno`, `acqua`, `umore`, `punteggio`) VALUES
(1, 1, '2026-05-05', 7.0, 1.2, 3, 78);

-- --------------------------------------------------------

--
-- Struttura della tabella `sfide`
--

CREATE TABLE `sfide` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `sfida_nome` varchar(100) NOT NULL,
  `data_completamento` date NOT NULL,
  `punti` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `sfide`
--

INSERT INTO `sfide` (`id`, `user_id`, `sfida_nome`, `data_completamento`, `punti`) VALUES
(1, 1, 'sleep', '2026-05-05', 25);

-- --------------------------------------------------------

--
-- Struttura della tabella `utenti`
--

CREATE TABLE `utenti` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `città` varchar(100) DEFAULT NULL,
  `punti_totali` int(11) DEFAULT 0,
  `streak` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `utenti`
--

INSERT INTO `utenti` (`id`, `username`, `password`, `città`, `punti_totali`, `streak`) VALUES
(1, 'sbostan', '$2b$10$jXbPnSk44pVUADLvEk.IzepSNYuCQxSmEHj64CtyQzLe6vB9RhDjG', '', 103, 1);

--
-- Indici per le tabelle scaricate
--

--
-- Indici per le tabelle `dati_benessere`
--
ALTER TABLE `dati_benessere`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`data`);

--
-- Indici per le tabelle `sfide`
--
ALTER TABLE `sfide`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indici per le tabelle `utenti`
--
ALTER TABLE `utenti`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT per le tabelle scaricate
--

--
-- AUTO_INCREMENT per la tabella `dati_benessere`
--
ALTER TABLE `dati_benessere`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT per la tabella `sfide`
--
ALTER TABLE `sfide`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT per la tabella `utenti`
--
ALTER TABLE `utenti`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Limiti per le tabelle scaricate
--

--
-- Limiti per la tabella `dati_benessere`
--
ALTER TABLE `dati_benessere`
  ADD CONSTRAINT `dati_benessere_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `utenti` (`id`);

--
-- Limiti per la tabella `sfide`
--
ALTER TABLE `sfide`
  ADD CONSTRAINT `sfide_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `utenti` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
