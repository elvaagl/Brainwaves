.PHONY: all build up down restart logs clean ssh help

all: up

build:
	docker compose build

up:
	docker compose up --build -d
	@echo ""
	@echo "Brainwaves corriendo:"
	@echo "Frontend  → http://localhost"
	@echo "Backend   → http://localhost:8080/api/brain/status"
	@echo "MariaDB   → localhost:3306"
	@echo "SSH       → ssh brainuser@localhost -p 2222"
	@echo ""

down:
	docker compose down

restart: down up

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-sensor:
	docker compose logs -f sensor

ssh:
	ssh brainuser@localhost -p 2222

shell-backend:
	docker exec -it brainwaves_backend bash

shell-sensor:
	docker exec -it brainwaves_sensor bash

shell-db:
	docker exec -it brainwaves_db mariadb -u linuxdummy -plinux brainwaves_bd

clean:
	docker compose down -v --rmi all

help:
	@echo ""
	@echo "  make up            → Levantar todo"
	@echo "  make down          → Detener todo"
	@echo "  make restart       → Reiniciar todo"
	@echo "  make logs          → Ver todos los logs"
	@echo "  make ssh           → SSH al backend"
	@echo "  make shell-db      → MariaDB CLI"
	@echo "  make clean         → Borrar todo"
	@echo ""
