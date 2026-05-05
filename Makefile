.PHONY: server-up server-down migrate dbt-run logs clean

server-up:
	docker compose up -d db redis app frontend

server-down:
	docker compose down

migrate:
	docker compose run --rm app alembic upgrade head

dbt-run:
	docker compose run --rm dbt

logs:
	docker compose logs -f app frontend

clean:
	docker compose down -v --remove-orphans
