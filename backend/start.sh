#!/bin/bash
service ssh start
echo "Esperando a MariaDB..."
sleep 5
echo "Iniciando AuthService..."
java -cp .:/app/mariadb-connector.jar AuthService &
echo "Iniciando LectorEEG..."
java -cp .:/app/mariadb-connector.jar LectorEEG
